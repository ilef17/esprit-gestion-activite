import pool from '../config/db.js'
import { getAllCriteres } from './critereEvaluation.model.js'

// ---------- helpers spécifiques au type d'équipe ----------
// 'up'      -> table sous_equipe / collaborateur_sousequipe / colonne id_sous_equipe
// 'hors_up' -> table equipe_hors_up / collaborateur_equipe_hors_up / colonne id_up
function teamConfig(type) {
  if (type === 'hors_up') {
    return {
      idCol: 'id_up',
      teamTable: 'equipe_hors_up',
      teamIdCol: 'id_up',
      teamNomCol: 'nom_up',
      membreTable: 'collaborateur_equipe_hors_up',
    }
  }
  return {
    idCol: 'id_sous_equipe',
    teamTable: 'sous_equipe',
    teamIdCol: 'id_sous_equipe',
    teamNomCol: 'nom',
    membreTable: 'collaborateur_sousequipe',
  }
}

function buildScoresQuery(cfg, { sousEquipeId, type, annee_universitaire, semestre, applyPeriode }) {
  let sql = `
    SELECT
      es.id_score, es.id_sous_equipe, es.id_up, es.type_equipe,
      es.annee_universitaire, es.semestre, es.score,
      es.detail_json, es.date_calcul,
      c.id_collaborateur, c.nom AS collaborateur_nom,
      t.${cfg.teamNomCol} AS sous_equipe_nom
    FROM evaluation_score es
    JOIN collaborateur c ON c.id_collaborateur = es.id_collaborateur
    JOIN ${cfg.teamTable} t ON t.${cfg.teamIdCol} = es.${cfg.idCol}
  `
  const where = ['es.type_equipe = ?']
  const params = [type]
  if (sousEquipeId) { where.push(`es.${cfg.idCol} = ?`); params.push(sousEquipeId) }
  if (applyPeriode) {
    if (annee_universitaire) { where.push('es.annee_universitaire = ?'); params.push(annee_universitaire) }
    if (semestre) { where.push('es.semestre = ?'); params.push(semestre) }
  }
  sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY es.annee_universitaire DESC, es.semestre DESC, es.score DESC'
  return { sql, params }
}

export async function getScores({ sousEquipeId, type = 'up', annee_universitaire, semestre } = {}) {
  const cfg = teamConfig(type)
  const opts = { sousEquipeId, type, annee_universitaire, semestre }

  let { sql, params } = buildScoresQuery(cfg, { ...opts, applyPeriode: true })
  let [rows] = await pool.query(sql, params)

  // Repli : si aucune évaluation n'existe pour la période sélectionnée sur cette
  // équipe, on récupère la période la plus récente déjà calculée pour cette
  // équipe plutôt que de renvoyer une liste vide — évite l'état "Aucun score
  // calculé" sur le dashboard alors que des évaluations existent, juste pas
  // pour le semestre affiché en haut de page.
  if (rows.length === 0 && sousEquipeId && (annee_universitaire || semestre)) {
    const fallback = buildScoresQuery(cfg, { ...opts, applyPeriode: false })
    const [allRows] = await pool.query(fallback.sql, fallback.params)
    if (allRows.length) {
      const { annee_universitaire: latestAnnee, semestre: latestSemestre } = allRows[0]
      rows = allRows.filter((r) => r.annee_universitaire === latestAnnee && r.semestre === latestSemestre)
    }
  }

  return rows.map((r) => ({
    ...r,
    detail_json: typeof r.detail_json === 'string' ? JSON.parse(r.detail_json) : r.detail_json,
  }))
}

async function getPeriodeActive() {
  const [[row]] = await pool.query(
    'SELECT annee_universitaire, semestre_actif AS semestre FROM parametre_systeme WHERE id = 1'
  )
  return row
}

async function getMembres(teamId, type) {
  const cfg = teamConfig(type)
  const [rows] = await pool.query(
    `SELECT c.id_collaborateur, c.nom FROM ${cfg.membreTable} m
     JOIN collaborateur c ON c.id_collaborateur = m.id_collaborateur
     WHERE m.${cfg.idCol} = ?`,
    [teamId]
  )
  return rows
}

// Les tâches (table `tache`) ne sont aujourd'hui rattachées qu'aux sous-équipes
// (UP) — il n'existe pas encore de suivi de tâches pour les équipes hors UP.
// Pour ces dernières, on renvoie 0 tâche : les critères de base partent donc à 0
// et doivent être notés manuellement dans la grille, comme un critère personnalisé.
async function getAvgTaskCount(teamId, type, nbMembres) {
  if (type === 'hors_up') return 0
  const [[{ totalTaches }]] = await pool.query(
    'SELECT COUNT(*) AS totalTaches FROM tache WHERE id_sous_equipe = ?',
    [teamId]
  )
  return nbMembres > 0 ? totalTaches / nbMembres : 0
}

// Calcule, pour un collaborateur dans une équipe donnée, une suggestion [0..1]
// pour chacun des 4 critères de base — dérivée des données existantes. Sert de
// valeur de départ pré-remplie dans la grille de notation ; l'admin peut la
// remplacer par une note manuelle qui prendra le dessus.
async function computeSuggestedRatios({ idCollaborateur, teamId, type, avgTaskCount }) {
  if (type === 'hors_up') {
    return { qualite: 0, delais: 0, implication: 0, coordination: 0 }
  }

  const [taches] = await pool.query(
    `SELECT statut, date_echeance, date_validation
     FROM tache WHERE id_collaborateur = ? AND id_sous_equipe = ?`,
    [idCollaborateur, teamId]
  )

  const validees = taches.filter((t) => t.statut === 'validee')
  const aRefaire = taches.filter((t) => t.statut === 'a_refaire')
  const terminees = validees.length + aRefaire.length

  const qualite = terminees > 0 ? validees.length / terminees : 0

  const dansLesDelais = validees.filter(
    (t) => !t.date_echeance || !t.date_validation || new Date(t.date_validation) <= new Date(t.date_echeance)
  ).length
  const delais = validees.length > 0 ? dansLesDelais / validees.length : 0

  const volumeRatio = avgTaskCount > 0 ? Math.min(terminees / avgTaskCount, 1) : (terminees > 0 ? 1 : 0)
  const [[{ nbHorsEquipe }]] = await pool.query(
    `SELECT COUNT(*) AS nbHorsEquipe FROM demande_hors_equipe
     WHERE id_collaborateur = ? AND statut = 'validee'`,
    [idCollaborateur]
  )
  const horsEquipeRatio = Math.min(Number(nbHorsEquipe) / 2, 1)
  const implication = Math.min(0.7 * volumeRatio + 0.3 * horsEquipeRatio, 1)

  const coordination = terminees > 0 ? 1 : 0

  return { qualite, delais, implication, coordination }
}

export async function getGrilleNotes(teamId, type = 'up') {
  const membres = await getMembres(teamId, type)
  const { annee_universitaire, semestre } = await getPeriodeActive()
  const criteres = await getAllCriteres()
  const avgTaskCount = await getAvgTaskCount(teamId, type, membres.length)
  const cfg = teamConfig(type)

  const [existingRows] = await pool.query(
    `SELECT id_collaborateur, detail_json FROM evaluation_score
     WHERE ${cfg.idCol} = ? AND type_equipe = ? AND annee_universitaire = ? AND semestre = ?`,
    [teamId, type, annee_universitaire, semestre]
  )
  const savedByCollab = {}
  existingRows.forEach((r) => {
    savedByCollab[r.id_collaborateur] = typeof r.detail_json === 'string' ? JSON.parse(r.detail_json) : r.detail_json
  })

  const grille = []
  for (const membre of membres) {
    const saved = savedByCollab[membre.id_collaborateur]
    const suggestions = await computeSuggestedRatios({
      idCollaborateur: membre.id_collaborateur,
      teamId,
      type,
      avgTaskCount,
    })

    const notes = {}
    for (const critere of criteres) {
      const key = critere.code || `custom_${critere.id_critere}`
      if (critere.code) {
        // Critère connecté (basé sur les tâches) : toujours recalculé à partir des
        // données actuelles, jamais figé sur une ancienne valeur enregistrée.
        notes[critere.id_critere] = Math.round(suggestions[critere.code] * 20 * 100) / 100
      } else {
        // Critère personnalisé : aucune source automatique, on garde la dernière
        // note manuelle enregistrée pour cette période (ou vide si jamais notée).
        const savedNote = saved?.[key]?.note
        notes[critere.id_critere] = savedNote !== undefined && savedNote !== null ? savedNote : null
      }
    }
    grille.push({ id_collaborateur: membre.id_collaborateur, nom: membre.nom, notes })
  }

  return { criteres, grille, annee_universitaire, semestre }
}

export async function calculerScoresEquipe(teamId, notesOverride = {}, type = 'up') {
  const membres = await getMembres(teamId, type)
  const { annee_universitaire, semestre } = await getPeriodeActive()
  const criteres = await getAllCriteres()
  const totalPonderation = criteres.reduce((s, c) => s + Number(c.ponderation), 0) || 100
  const avgTaskCount = await getAvgTaskCount(teamId, type, membres.length)
  const idSousEquipe = type === 'up' ? teamId : null
  const idUp = type === 'hors_up' ? teamId : null

  const results = []
  for (const membre of membres) {
    const suggestions = await computeSuggestedRatios({
      idCollaborateur: membre.id_collaborateur,
      teamId,
      type,
      avgTaskCount,
    })
    const overrides = notesOverride[membre.id_collaborateur] || {}

    let scoreBrut = 0
    const detail = {}
    for (const critere of criteres) {
      const key = critere.code || `custom_${critere.id_critere}`
      const provided = overrides[critere.id_critere]

      let note
      if (provided !== undefined && provided !== null && provided !== '') {
        note = Math.max(0, Math.min(20, Number(provided)))
      } else if (critere.code) {
        note = Math.round(suggestions[critere.code] * 20 * 100) / 100
      } else {
        note = 0
      }

      const ratio = note / 20
      detail[key] = {
        nom: critere.nom,
        ponderation: Number(critere.ponderation),
        note,
        ratio: Math.round(ratio * 100) / 100,
        connecte: Boolean(critere.code),
      }
      scoreBrut += ratio * Number(critere.ponderation)
    }
    const score = Math.round((scoreBrut / totalPonderation) * 20 * 100) / 100

   await pool.query(
  `INSERT INTO evaluation_score
     (id_collaborateur, id_sous_equipe, id_up, type_equipe, equipe_key, annee_universitaire, semestre, score, detail_json)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE score = VALUES(score), detail_json = VALUES(detail_json), date_calcul = NOW()`,
  [membre.id_collaborateur, idSousEquipe, idUp, type, teamId, annee_universitaire, semestre, score, JSON.stringify(detail)]
)
    results.push({ id_collaborateur: membre.id_collaborateur, nom: membre.nom, score, detail })
  }
  return results
}

// Alias conservé pour compatibilité si d'autres fichiers importent l'ancien nom.
export { calculerScoresEquipe as calculerScoresSousEquipe }

// Dernier score calculé pour le collaborateur connecté (page "Mon profil"), toutes équipes
// confondues (UP ou hors UP), le plus récent en premier.
export async function getMonDernierScore(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT
      es.id_score, es.type_equipe, es.annee_universitaire, es.semestre, es.score, es.date_calcul,
      CASE WHEN es.type_equipe = 'hors_up'
        THEN (SELECT nom_up FROM equipe_hors_up WHERE id_up = es.id_up)
        ELSE (SELECT nom FROM sous_equipe WHERE id_sous_equipe = es.id_sous_equipe)
      END AS equipe_nom
    FROM evaluation_score es
    WHERE es.id_collaborateur = ?
    ORDER BY es.date_calcul DESC
    LIMIT 1`,
    [idCollaborateur]
  )
  return rows[0] || null
}