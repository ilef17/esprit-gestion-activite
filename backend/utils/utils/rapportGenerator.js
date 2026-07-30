import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import pool from '../config/db.js'
import { ESPRIT_LOGO_PNG_BASE64 } from './espritLogoBase64.js'
import { getPeriodeActuelle } from './periode.js'

const ESPRIT_LOGO_BUFFER = Buffer.from(ESPRIT_LOGO_PNG_BASE64, 'base64')

export const REPORTS_DIR = path.join(process.cwd(), 'generated', 'rapports')

function ensureReportsDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
}

/**
 * Rassemble les données d'un rapport : répartition des tâches par état
 * d'avancement, activités hors-équipe validées et score (si une sous-équipe
 * précise est ciblée), pour chaque collaborateur concerné. `idCollaborateur`
 * restreint le rapport à un seul collaborateur (combinable avec idSousEquipe).
 *
 * `periode` = { annee_universitaire, semestre } où semestre vaut 'S1', 'S2' ou
 * 'annuel' (les deux semestres de l'année combinés). Si omise, on retombe sur
 * l'année/semestre actuellement actifs (comportement historique).
 */
export async function buildReportData(idSousEquipe, idCollaborateur, periode) {
  const actuelle = getPeriodeActuelle()
  const annee = periode?.annee_universitaire || actuelle.annee_universitaire
  const portee = periode?.semestre || actuelle.semestre // 'S1' | 'S2' | 'annuel'

  let sousEquipeNom = 'Toutes les sous-équipes'
  if (idSousEquipe) {
    const [[se]] = await pool.query('SELECT nom FROM sous_equipe WHERE id_sous_equipe = ?', [idSousEquipe])
    if (se) sousEquipeNom = se.nom
  }

  let collaborateurNom = null
  if (idCollaborateur) {
    const [[c]] = await pool.query('SELECT nom FROM collaborateur WHERE id_collaborateur = ?', [idCollaborateur])
    if (c) collaborateurNom = c.nom
  }

  const statutCols = `
    COUNT(t.id_tache) AS taches_total,
    SUM(CASE WHEN t.statut='a_faire' THEN 1 ELSE 0 END) AS non_realisees,
    SUM(CASE WHEN t.statut='en_cours' THEN 1 ELSE 0 END) AS en_cours,
    SUM(CASE WHEN t.statut='validee' THEN 1 ELSE 0 END) AS validees,
    SUM(CASE WHEN t.statut='a_refaire' THEN 1 ELSE 0 END) AS a_refaire
  `
  // Les tâches sont rattachées à la période où elles ont été créées (colonnes
  // annee_universitaire / semestre sur `tache`) ; en portée "annuel" on combine
  // les deux semestres de l'année, sinon on ne garde que le semestre demandé.
  const periodeCond = portee === 'annuel'
    ? 't.annee_universitaire = ?'
    : 't.annee_universitaire = ? AND t.semestre = ?'
  const periodeParams = portee === 'annuel' ? [annee] : [annee, portee]

  let sql
  let params
  if (idSousEquipe) {
    sql = `
      SELECT c.id_collaborateur, c.nom, ${statutCols}
      FROM collaborateur c
      JOIN collaborateur_sousequipe cs ON cs.id_collaborateur = c.id_collaborateur AND cs.id_sous_equipe = ?
      LEFT JOIN tache t ON t.id_collaborateur = c.id_collaborateur AND t.id_sous_equipe = ? AND ${periodeCond}
      ${idCollaborateur ? 'WHERE c.id_collaborateur = ?' : ''}
      GROUP BY c.id_collaborateur
      ORDER BY c.nom
    `
    params = [idSousEquipe, idSousEquipe, ...periodeParams, ...(idCollaborateur ? [idCollaborateur] : [])]
  } else {
    sql = `
      SELECT c.id_collaborateur, c.nom, ${statutCols}
      FROM collaborateur c
      LEFT JOIN tache t ON t.id_collaborateur = c.id_collaborateur AND ${periodeCond}
      ${idCollaborateur ? 'WHERE c.id_collaborateur = ?' : ''}
      GROUP BY c.id_collaborateur
      ORDER BY c.nom
    `
    params = [...periodeParams, ...(idCollaborateur ? [idCollaborateur] : [])]
  }
  const [collaborateurs] = await pool.query(sql, params)

  // Activités hors-équipe réalisées : pas de rattachement à une période dans le schéma
  // (voir demande_hors_equipe), donc affichées en cumul total plutôt que par semestre.
  const [horsEquipeRows] = await pool.query(
    `SELECT id_collaborateur, COUNT(*) AS nb FROM demande_hors_equipe WHERE statut = 'faite' GROUP BY id_collaborateur`
  )
  const horsEquipeMap = {}
  horsEquipeRows.forEach((r) => { horsEquipeMap[r.id_collaborateur] = Number(r.nb) })

  // Le score n'a de sens que rapporté à une sous-équipe précise (voir
  // evaluationScore.model.js) — pas de score affiché pour un rapport global.
  // En portée "annuel", on moyenne les scores S1 et S2 quand les deux existent.
  let scoreMap = {}
  if (idSousEquipe) {
    const [scoreRows] = await pool.query(
      portee === 'annuel'
        ? `SELECT id_collaborateur, semestre, score FROM evaluation_score
           WHERE id_sous_equipe = ? AND annee_universitaire = ?`
        : `SELECT id_collaborateur, semestre, score FROM evaluation_score
           WHERE id_sous_equipe = ? AND annee_universitaire = ? AND semestre = ?`,
      portee === 'annuel' ? [idSousEquipe, annee] : [idSousEquipe, annee, portee]
    )
    const parCollaborateur = {}
    scoreRows.forEach((r) => {
      if (!parCollaborateur[r.id_collaborateur]) parCollaborateur[r.id_collaborateur] = []
      parCollaborateur[r.id_collaborateur].push(Number(r.score))
    })
    Object.entries(parCollaborateur).forEach(([id, notes]) => {
      scoreMap[id] = Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 100) / 100
    })
  }

  const lignes = collaborateurs.map((c) => ({
    nom: c.nom,
    taches_total: Number(c.taches_total) || 0,
    en_cours: Number(c.en_cours) || 0,
    validees: Number(c.validees) || 0,
    a_refaire: Number(c.a_refaire) || 0,
    non_realisees: Number(c.non_realisees) || 0,
    hors_equipe_validees: horsEquipeMap[c.id_collaborateur] || 0,
    score: idSousEquipe ? (scoreMap[c.id_collaborateur] ?? null) : null,
  }))

  return {
    sousEquipeNom,
    collaborateurNom,
    annee_universitaire: annee,
    semestre: portee,
    lignes,
  }
}

const RED = '#E4032E'
const RED_DEEP = '#9C0119'
const TEXT = '#1D1D2B'
const MUTED = '#767A8A'
const FAINT = '#A6A9B4'
const BORDER = '#ECEDF2'
const TINT = '#FCE9EB'
const TINT_SOFT = '#FBF7F8'
const GREEN = '#1FAE63'
const GREEN_TINT = '#E7F8EF'
const RED_DARK = '#B30224'

const SEMESTRE_LABELS = { S1: 'Semestre 1', S2: 'Semestre 2', annuel: 'Année complète' }

// Petite pastille arrondie pleine largeur de texte (ex. "82%"), fond + texte assortis
// selon la couleur donnée — remplace le texte simplement coloré de l'ancienne version
// pour un rendu plus soigné, proche d'un badge d'interface plutôt que d'un tableau brut.
function drawPill(doc, text, x, y, { color, tint, width, fontSize = 9.5 } = {}) {
  const w = width ?? doc.widthOfString(text, { font: 'Helvetica-Bold', fontSize }) + 18
  const h = fontSize + 9
  doc.roundedRect(x, y, w, h, h / 2).fill(tint)
  doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(color)
    .text(text, x, y + h / 2 - fontSize / 2 + 0.5, { width: w, align: 'center' })
  return w
}

// Mini barre de progression horizontale (note /20) — donne une lecture immédiate des
// scores sans avoir à comparer des nombres, dans l'esprit d'un tableau de bord plutôt
// que d'une simple liste.
function drawScoreBar(doc, x, y, width, ratio, color) {
  const h = 6
  doc.roundedRect(x, y, width, h, h / 2).fill(BORDER)
  const filled = Math.max(h, width * Math.max(0, Math.min(1, ratio)))
  doc.roundedRect(x, y, filled, h, h / 2).fill(color)
}

export function genererPdf(data, filePath) {
  ensureReportsDir()
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const marginX = 44
    const contentWidth = pageWidth - marginX * 2

    // ---------- Bandeau : dégradé profond + cercle décoratif discret ----------
    const bannerHeight = 108
    const gradient = doc.linearGradient(0, 0, pageWidth, bannerHeight)
    gradient.stop(0, RED_DEEP).stop(1, RED)
    doc.rect(0, 0, pageWidth, bannerHeight).fill(gradient)
    // Cercle décoratif très subtil, à moitié hors-cadre — apporte du relief au bandeau
    // sans distraire du logo ni du titre.
    doc.save()
    doc.circle(pageWidth - 60, 20, 90).fillOpacity(0.06).fill('#FFFFFF')
    doc.restore()

    doc.image(ESPRIT_LOGO_BUFFER, marginX, 30, { fit: [125, 40] })
    doc.fillColor('rgba(255,255,255,0.92)').font('Helvetica-Bold').fontSize(8.5)
      .text('GESTION DES ACTIVITÉS', marginX, 78, { characterSpacing: 1.4 })
    // Fine ligne dorée sous le bandeau : sépare nettement l'en-tête institutionnel du
    // contenu du rapport, touche discrète mais soignée.
    doc.rect(0, bannerHeight, pageWidth, 3).fill('#F2B84B')

    // ---------- Titre + sous-titre ----------
    let y = bannerHeight + 34
    const titre = data.sousEquipeNom === 'Toutes les sous-équipes'
      ? 'Rapport global d\'activité'
      : `Rapport d'activité — ${data.sousEquipeNom}`
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(21).text(titre, marginX, y, { width: contentWidth })
    y = doc.y + 5
    const semestreLabel = SEMESTRE_LABELS[data.semestre] || data.semestre
    const sousTitre = `${semestreLabel} · Année universitaire ${data.annee_universitaire}` + (data.collaborateurNom ? ` · ${data.collaborateurNom}` : '')
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(11).text(sousTitre, marginX, y, { width: contentWidth })
    y = doc.y + 26

    // ---------- Chiffres clés : trois cartes (collaborateurs / taux moyen / période) ----------
    const nb = data.lignes.length
    const taux = data.lignes.map((l) => (l.taches_total > 0 ? (l.validees / l.taches_total) * 100 : 0))
    const moyenne = nb > 0 ? Math.round(taux.reduce((a, b) => a + b, 0) / nb) : 0
    const totalTaches = data.lignes.reduce((s, l) => s + l.taches_total, 0)

    const cardGap = 14
    const cardW = (contentWidth - cardGap * 2) / 3
    const cardH = 64
    const stats = [
      { label: 'COLLABORATEUR' + (nb > 1 ? 'S' : ''), value: String(nb) },
      { label: 'TAUX DE RÉUSSITE MOYEN', value: `${moyenne}%`, accent: moyenne >= 50 ? GREEN : RED_DARK },
      { label: 'TÂCHES SUIVIES', value: String(totalTaches) },
    ]
    stats.forEach((s, i) => {
      const x = marginX + i * (cardW + cardGap)
      doc.roundedRect(x, y, cardW, cardH, 10).fillAndStroke(TINT_SOFT, BORDER)
      doc.font('Helvetica-Bold').fontSize(22).fillColor(s.accent || TEXT)
        .text(s.value, x + 16, y + 12, { width: cardW - 32 })
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
        .text(s.label, x + 16, y + cardH - 22, { width: cardW - 32, characterSpacing: 0.4 })
    })
    y += cardH + 30

    // ---------- Tableau : Collaborateur | Validées | Totales | Taux ----------
    const tableTop = y
    const cols = [
      { x: marginX + 18, w: 210, key: 'nom', label: 'COLLABORATEUR' },
      { x: marginX + 230, w: 90, key: 'validees', label: 'VALIDÉES' },
      { x: marginX + 320, w: 90, key: 'taches_total', label: 'TOTALES' },
      { x: marginX + 410, w: 90, key: 'taux', label: 'TAUX' },
    ]
    const rowHeight = 30

    const drawTableHeader = (yy) => {
      doc.roundedRect(marginX, yy, contentWidth, 30, 8).fill(TINT)
      doc.font('Helvetica-Bold').fontSize(8.2).fillColor(RED_DEEP)
      cols.forEach((col) => doc.text(col.label, col.x, yy + 11, { width: col.w, characterSpacing: 0.6 }))
      return yy + 30
    }

    y = drawTableHeader(tableTop)

    doc.font('Helvetica').fontSize(10)
    data.lignes.forEach((ligne, i) => {
      if (y + rowHeight > pageHeight - 70) {
        doc.addPage()
        y = 44
        y = drawTableHeader(y)
      }
      if (i % 2 === 1) doc.rect(marginX, y, contentWidth, rowHeight).fill(TINT_SOFT)
      const t = ligne.taches_total > 0 ? Math.round((ligne.validees / ligne.taches_total) * 100) : 0
      const rowMidY = y + rowHeight / 2 - 6

      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10.5)
        .text(ligne.nom, cols[0].x, rowMidY, { width: cols[0].w })
      doc.font('Helvetica').fontSize(10).fillColor(TEXT)
        .text(String(ligne.validees), cols[1].x, rowMidY, { width: cols[1].w })
      doc.text(String(ligne.taches_total), cols[2].x, rowMidY, { width: cols[2].w })
      drawPill(doc, `${t}%`, cols[3].x, y + rowHeight / 2 - 10.5, {
        color: t >= 50 ? GREEN : RED_DARK,
        tint: t >= 50 ? GREEN_TINT : TINT,
        width: 52,
      })
      doc.moveTo(marginX + 18, y + rowHeight).lineTo(pageWidth - marginX - 18, y + rowHeight).strokeColor(BORDER).lineWidth(0.5).stroke()
      y += rowHeight
    })

    if (data.lignes.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(MUTED)
        .text('Aucun collaborateur concerné par ce rapport.', marginX, y + 14)
      y += 34
    }

    // ---------- Scores calculés : carte dédiée avec mini barres de progression ----------
    const withScore = data.lignes.filter((l) => l.score !== null)
    if (withScore.length > 0) {
      y += 26
      if (y + 40 + withScore.length * 26 > pageHeight - 70) {
        doc.addPage()
        y = 44
      }
      doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT)
        .text('Scores calculés', marginX, y)
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(FAINT)
        .text('activités hors-équipe validées incluses', marginX + 108, y + 2.5)
      y = doc.y + 12

      withScore.forEach((l) => {
        if (y + 26 > pageHeight - 70) {
          doc.addPage()
          y = 44
        }
        const ratio = Number(l.score) / 20
        const barColor = ratio >= 0.5 ? GREEN : RED_DARK
        doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT)
          .text(l.nom, marginX + 18, y, { width: 170 })
        drawScoreBar(doc, marginX + 200, y + 5, 200, ratio, barColor)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(barColor)
          .text(`${l.score}/20`, marginX + 412, y - 1, { width: 50 })
        doc.font('Helvetica').fontSize(8.5).fillColor(FAINT)
          .text(`${l.hors_equipe_validees} activité${l.hors_equipe_validees > 1 ? 's' : ''} hors-équipe`, marginX + 470, y, { width: contentWidth - 470 })
        y += 26
      })
    }

    // ---------- Pied de page (numéro inclus) sur chaque page ----------
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      const footerY = pageHeight - 46
      doc.moveTo(marginX, footerY).lineTo(pageWidth - marginX, footerY).strokeColor(BORDER).lineWidth(0.75).stroke()
      doc.font('Helvetica').fontSize(7.8).fillColor(FAINT)
        .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — ESPRIT · Gestion des Activités`, marginX, footerY + 10)
      doc.text(`Page ${i - range.start + 1} / ${range.count}`, pageWidth - marginX - 100, footerY + 10, { width: 100, align: 'right' })
    }

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

export async function genererExcel(data, filePath) {
  ensureReportsDir()
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ESPRIT · Gestion des Activités'
  const ws = wb.addWorksheet('Rapport')

  const periodeLabel = SEMESTRE_LABELS[data.semestre] || data.semestre

  ws.mergeCells('A1:H1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `Rapport d'activité — ${data.sousEquipeNom}${data.collaborateurNom ? ' · ' + data.collaborateurNom : ''} — ${periodeLabel} ${data.annee_universitaire}`
  titleCell.font = { bold: true, size: 13, color: { argb: 'FFE4032E' } }

  ws.addRow([])
  const headerRow = ws.addRow([
    'Collaborateur', 'Tâches total', 'En cours', 'Validées',
    'À refaire', 'Non réalisées', 'Hors-équipe validées', 'Score /20',
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE1E5' } }
  })

  data.lignes.forEach((l) => {
    ws.addRow([
      l.nom, l.taches_total, l.en_cours, l.validees,
      l.a_refaire, l.non_realisees, l.hors_equipe_validees, l.score ?? '—',
    ])
  })

  ws.columns.forEach((col) => { col.width = 16 })
  ws.getColumn(1).width = 26

  await wb.xlsx.writeFile(filePath)
}

// Construit les données puis écrit le fichier (PDF ou Excel) sur disque.
// Renvoie le nom de fichier (relatif à REPORTS_DIR) à stocker dans chemin_fichier.
export async function genererFichierRapport({ idRapport, format, idSousEquipe, idCollaborateur, periode }) {
  const data = await buildReportData(idSousEquipe, idCollaborateur, periode)
  const ext = format === 'excel' ? 'xlsx' : 'pdf'
  const filename = `rapport-${idRapport}-${Date.now()}.${ext}`
  const filePath = path.join(REPORTS_DIR, filename)

  if (format === 'excel') await genererExcel(data, filePath)
  else await genererPdf(data, filePath)

  return filename
}