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

  // Activités hors-équipe validées : pas de rattachement à une période dans le schéma
  // (voir demande_hors_equipe), donc affichées en cumul total plutôt que par semestre.
  const [horsEquipeRows] = await pool.query(
    `SELECT id_collaborateur, COUNT(*) AS nb FROM demande_hors_equipe WHERE statut = 'validee' GROUP BY id_collaborateur`
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
const TEXT = '#1D1D2B'
const MUTED = '#767A8A'
const BORDER = '#ECEDF2'
const GREEN = '#1FAE63'
const RED_DARK = '#B30224'

const SEMESTRE_LABELS = { S1: 'Semestre 1', S2: 'Semestre 2', annuel: 'Année complète' }

export function genererPdf(data, filePath) {
  ensureReportsDir()
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    const pageWidth = doc.page.width
    const marginX = 40

    // ---------- Bandeau rouge (logo directement dessus, fond transparent — pas de carte blanche) ----------
    const bannerHeight = 90
    doc.rect(0, 0, pageWidth, bannerHeight).fill(RED)
    doc.image(ESPRIT_LOGO_BUFFER, marginX, 24, { fit: [130, 42], align: 'center', valign: 'center' })
    doc.fillColor('rgba(255,255,255,0.9)').font('Helvetica-Bold').fontSize(9)
      .text('GESTION DES ACTIVITÉS', marginX + 145, 45, { characterSpacing: 1 })

    // ---------- Titre + sous-titre ----------
    let y = bannerHeight + 32
    const titre = data.sousEquipeNom === 'Toutes les sous-équipes'
      ? 'Rapport global'
      : `Rapport — ${data.sousEquipeNom}`
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(20).text(titre, marginX, y)
    y = doc.y + 4
    const semestreLabel = SEMESTRE_LABELS[data.semestre] || data.semestre
    const sousTitre = `${semestreLabel} · ${data.annee_universitaire}` + (data.collaborateurNom ? ` · ${data.collaborateurNom}` : '')
    doc.fillColor(MUTED).font('Helvetica').fontSize(11).text(sousTitre, marginX, y)
    y = doc.y + 18

    // ---------- Résumé : N collaborateurs · taux de réussite moyen ----------
    const nb = data.lignes.length
    const taux = data.lignes.map((l) => (l.taches_total > 0 ? (l.validees / l.taches_total) * 100 : 0))
    const moyenne = nb > 0 ? Math.round(taux.reduce((a, b) => a + b, 0) / nb) : 0
    doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT)
      .text(`${nb} collaborateur${nb > 1 ? 's' : ''}`, marginX, y, { continued: true })
      .font('Helvetica').fillColor(MUTED).text('  ·  ', { continued: true })
      .font('Helvetica-Bold').fillColor(TEXT).text(`taux de réussite moyen : `, { continued: true })
      .fillColor(moyenne >= 50 ? GREEN : RED_DARK).text(`${moyenne}%`)
    y = doc.y + 18

    // ---------- Tableau : Collaborateur | Validées | Totales | Taux ----------
    const cols = [
      { x: marginX, w: 220, key: 'nom', label: 'COLLABORATEUR', align: 'left' },
      { x: marginX + 220, w: 100, key: 'validees', label: 'VALIDÉES', align: 'left' },
      { x: marginX + 320, w: 100, key: 'taches_total', label: 'TOTALES', align: 'left' },
      { x: marginX + 420, w: 95, key: 'taux', label: 'TAUX', align: 'left' },
    ]

    const drawHeader = (yy) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED)
      cols.forEach((col) => doc.text(col.label, col.x, yy, { width: col.w, characterSpacing: 0.5 }))
      const lineY = yy + 16
      doc.moveTo(marginX, lineY).lineTo(pageWidth - marginX, lineY).strokeColor(BORDER).stroke()
      return lineY + 12
    }

    y = drawHeader(y)

    doc.font('Helvetica').fontSize(10.5)
    data.lignes.forEach((ligne, i) => {
      if (y > 760) {
        doc.addPage()
        y = 40
        y = drawHeader(y)
      }
      const t = ligne.taches_total > 0 ? Math.round((ligne.validees / ligne.taches_total) * 100) : 0
      doc.fillColor(TEXT).font('Helvetica-Bold').text(ligne.nom, cols[0].x, y, { width: cols[0].w })
      doc.font('Helvetica').text(String(ligne.validees), cols[1].x, y, { width: cols[1].w })
      doc.text(String(ligne.taches_total), cols[2].x, y, { width: cols[2].w })
      doc.font('Helvetica-Bold').fillColor(t >= 50 ? GREEN : RED_DARK).text(`${t}%`, cols[3].x, y, { width: cols[3].w })
      y += 26
    })

    if (data.lignes.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('Aucun collaborateur concerné par ce rapport.', marginX, y)
      y = doc.y + 10
    }

    const withScore = data.lignes.filter((l) => l.score !== null)
    if (withScore.length > 0) {
      y += 14
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT).text('Scores calculés (activités hors-équipe validées incluses)', marginX, y)
      y = doc.y + 6
      doc.font('Helvetica').fontSize(9.5)
      withScore.forEach((l) => {
        doc.fillColor(TEXT).text(`${l.nom} — ${l.score}/20  (${l.hors_equipe_validees} activité${l.hors_equipe_validees > 1 ? 's' : ''} hors-équipe validée${l.hors_equipe_validees > 1 ? 's' : ''})`, marginX, y)
        y = doc.y + 2
      })
    }

    doc.font('Helvetica').fontSize(7.5).fillColor('#A6A9B4')
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — ESPRIT · Gestion des Activités`, marginX, doc.page.height - 30)

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