import pool from '../config/db.js'
import { getAllCriteres } from './critereEvaluation.model.js'
import { countEncadrementsParCollaborateur } from './Encadrement.model.js'
import { countExpertisesParCollaborateur } from './Expertise.model.js'
import { countActivitesParCollaborateurEtType } from './Activiteacademique.model.js'

// Poids internes (avant normalisation par équipe) du critère "Activité Au Sein ESPRIT" :
// un encadrement (PFA/PFE) représente un engagement continu sur tout un semestre, donc
// pèse plus qu'une expertise déclarée ou une activité ponctuelle (jury, formation,
// événement, comité d'organisation).
const POIDS_ENCADREMENT = 2
const POIDS_EXPERTISE = 1
const POIDS_ACTIVITE = 1

// Garde-fous sur la notation manuelle des critères personnalisés (code = NULL) : une
// note manuelle n'a, par définition, aucune donnée vérifiable derrière elle. Pour
// limiter le risque de favoritisme signalé sur "Activité Au Sein ESPRIT" (avant qu'il
// devienne un critère connecté), on impose :
// - un plafond sous le maximum de 20, pour qu'une note manuelle ne puisse jamais peser
//   autant qu'une note automatique parfaite ;
// - une justification écrite obligatoire, conservée avec la note (voir detail_json) —
//   crée une trace auditable : si un admin favorise un ami, la justification insuffisante
//   ou incohérente reste visible dans l'historique des scores.
export const PLAFOND_NOTE_MANUELLE = 15
export const JUSTIFICATION_MIN_LENGTH = 20

// Note automatique pour "Activité Au Sein ESPRIT" — remplace l'ancienne notation
// manuelle (grille "Noter les membres") par un calcul objectif à partir de données déjà
// suivies ailleurs dans l'app : nombre d'étudiants encadrés, nombre d'expertises
// déclarées, nombre d'activités académiques (jury, formation, événement, comité). Comme
// pour le volume de tâches, chaque collaborateur est comparé à la moyenne de son équipe
// plutôt qu'à un barème absolu, pour rester cohérent d'une équipe à l'autre.
async function getActiviteEcoleRatios(membres, { annee_universitaire, semestre } = {}) {
  if (membres.length === 0) return {}
  const [encadrements, expertises, activites] = await Promise.all([
    countEncadrementsParCollaborateur(annee_universitaire),
    countExpertisesParCollaborateur(),
    countActivitesParCollaborateurEtType({ annee_universitaire, semestre }),
  ])
  const scoreBrut = {}
  encadrements.forEach((r) => {
    scoreBrut[r.id_collaborateur] = (scoreBrut[r.id_collaborateur] || 0) + Number(r.nb) * POIDS_ENCADREMENT
  })
  expertises.forEach((r) => {
    scoreBrut[r.id_collaborateur] = (scoreBrut[r.id_collaborateur] || 0) + Number(r.nb) * POIDS_EXPERTISE
  })
  activites.forEach((r) => {
    scoreBrut[r.id_collaborateur] = (scoreBrut[r.id_collaborateur] || 0) + Number(r.nb) * POIDS_ACTIVITE
  })

  const valeurs = membres.map((m) => scoreBrut[m.id_collaborateur] || 0)
  const moyenneEquipe = valeurs.reduce((a, b) => a + b, 0) / valeurs.length

  const ratios = {}
  membres.forEach((m) => {
    const valeur = scoreBrut[m.id_collaborateur] || 0
    ratios[m.id_collaborateur] = moyenneEquipe > 0 ? Math.min(valeur / moyenneEquipe, 1) : (valeur > 0 ? 1 : 0)
  })
  return ratios
}

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

  // Filtrage strict sur la période demandée : si aucune évaluation n'existe pour
  // l'année/semestre sélectionné(e), on renvoie une liste vide plutôt que de
  // substituer silencieusement une autre période — le dashboard affiche
  // désormais la période choisie et un repli invisible induirait l'utilisateur
  // en erreur (des scores d'une autre année affichés sous le mauvais libellé).
  const { sql, params } = buildScoresQuery(cfg, { ...opts, applyPeriode: true })
  const [rows] = await pool.query(sql, params)

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
async function computeSuggestedRatios({ idCollaborateur, teamId, type, avgTaskCount, activiteEcoleRatio }) {
  if (type === 'hors_up') {
    // Contrairement aux tâches (non suivies pour les équipes hors UP), l'activité école
    // (encadrements, expertises, activités académiques) est indépendante du type
    // d'équipe : elle reste calculée normalement ici.
    return { qualite: 0, delais: 0, implication: 0, coordination: 0, activite_ecole: activiteEcoleRatio }
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

  return { qualite, delais, implication, coordination, activite_ecole: activiteEcoleRatio }
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
  const activiteEcoleRatios = await getActiviteEcoleRatios(membres, { annee_universitaire, semestre })
  for (const membre of membres) {
    const saved = savedByCollab[membre.id_collaborateur]
    const suggestions = await computeSuggestedRatios({
      idCollaborateur: membre.id_collaborateur,
      teamId,
      type,
      avgTaskCount,
      activiteEcoleRatio: activiteEcoleRatios[membre.id_collaborateur] || 0,
    })

    const notes = {}
    const justifications = {}
    for (const critere of criteres) {
      const key = critere.code || `custom_${critere.id_critere}`
      if (critere.code) {
        // Critère connecté (basé sur les tâches) : toujours recalculé à partir des
        // données actuelles, jamais figé sur une ancienne valeur enregistrée.
        notes[critere.id_critere] = Math.round(suggestions[critere.code] * 20 * 100) / 100
      } else {
        // Critère personnalisé : aucune source automatique, on garde la dernière
        // note manuelle (et sa justification) enregistrée pour cette période, pour
        // pré-remplir la grille — l'admin doit néanmoins reconfirmer/adapter la
        // justification à chaque nouvelle application (voir calculerScoresEquipe).
        const savedNote = saved?.[key]?.note
        notes[critere.id_critere] = savedNote !== undefined && savedNote !== null ? savedNote : null
        justifications[critere.id_critere] = saved?.[key]?.justification || ''
      }
    }
    grille.push({ id_collaborateur: membre.id_collaborateur, nom: membre.nom, notes, justifications })
  }

  return { criteres, grille, annee_universitaire, semestre }
}

// "Appliquer" recalcule désormais le score de TOUS les collaborateurs du
// système en une fois (le filtre équipe de la page Évaluation ne sert plus
// qu'à consulter les scores d'une équipe donnée, plus à restreindre le calcul).
// On boucle sur chaque sous-équipe (UP) puis chaque équipe hors UP et on
// applique calculerScoresEquipe à chacune, sans note manuelle (voir plus haut :
// un critère personnalisé non noté compte simplement pour 0).
export async function calculerScoresPourTous(periodeOverride = {}) {
  const [sousEquipes] = await pool.query('SELECT id_sous_equipe AS id FROM sous_equipe')
  const [equipesHorsUp] = await pool.query('SELECT id_up AS id FROM equipe_hors_up')
  const resultats = []
  for (const { id } of sousEquipes) {
    try {
      const r = await calculerScoresEquipe(id, {}, 'up', periodeOverride)
      resultats.push({ type: 'up', id, count: r.length })
    } catch (err) {
      resultats.push({ type: 'up', id, error: err.message })
    }
  }
  for (const { id } of equipesHorsUp) {
    try {
      const r = await calculerScoresEquipe(id, {}, 'hors_up', periodeOverride)
      resultats.push({ type: 'hors_up', id, count: r.length })
    } catch (err) {
      resultats.push({ type: 'hors_up', id, error: err.message })
    }
  }
  return resultats
}

export async function calculerScoresEquipe(teamId, notesOverride = {}, type = 'up', periodeOverride = {}) {
  const membres = await getMembres(teamId, type)
  // Priorité à la période sélectionnée dans le tableau de bord au moment du calcul
  // (envoyée par le front) — le paramètre système `semestre_actif` ne sert plus que
  // de repli si aucune période n'est fournie par l'appelant.
  let { annee_universitaire, semestre } = periodeOverride
  if (!annee_universitaire || !semestre) {
    const active = await getPeriodeActive()
    annee_universitaire = annee_universitaire || active.annee_universitaire
    semestre = semestre || active.semestre
  }
  const criteres = await getAllCriteres()
  const totalPonderation = criteres.reduce((s, c) => s + Number(c.ponderation), 0) || 100
  const avgTaskCount = await getAvgTaskCount(teamId, type, membres.length)
  const idSousEquipe = type === 'up' ? teamId : null
  const idUp = type === 'hors_up' ? teamId : null

  const activiteEcoleRatios = await getActiviteEcoleRatios(membres, { annee_universitaire, semestre })

  // Passe 1 : calcule et VALIDE le score de chaque membre sans rien écrire en base.
  // Une note manuelle manquante ou sans justification suffisante doit bloquer tout le
  // calcul de l'équipe — sinon on risquerait d'enregistrer les scores des membres déjà
  // valides pendant qu'un autre membre reste avec une note personnalisée non justifiée.
  const prepared = []
  for (const membre of membres) {
    const suggestions = await computeSuggestedRatios({
      idCollaborateur: membre.id_collaborateur,
      teamId,
      type,
      avgTaskCount,
      activiteEcoleRatio: activiteEcoleRatios[membre.id_collaborateur] || 0,
    })
    const overrides = notesOverride[membre.id_collaborateur] || {}

    let scoreBrut = 0
    const detail = {}
    for (const critere of criteres) {
      const key = critere.code || `custom_${critere.id_critere}`

      let note
      let justification
      if (critere.code) {
        // Critère connecté : toujours recalculé à partir des données réelles, un
        // éventuel override est ignoré (il n'y a pas de notation manuelle possible).
        note = Math.round(suggestions[critere.code] * 20 * 100) / 100
      } else if (Number(critere.ponderation) > 0) {
        // Critère personnalisé qui compte dans le score : la notation manuelle a été
        // retirée de l'interface — si aucune note n'est fournie (l'appel "Appliquer à
        // tous" n'en envoie jamais), le critère compte pour 0 plutôt que de bloquer le
        // calcul de toute l'équipe.
        const provided = overrides[critere.id_critere]
        const noteFournie = provided?.note
        if (noteFournie === undefined || noteFournie === null || noteFournie === '') {
          note = 0
        } else {
          justification = String(provided?.justification || '').trim()
          note = Math.max(0, Math.min(PLAFOND_NOTE_MANUELLE, Number(noteFournie)))
        }
      } else {
        // Critère personnalisé à pondération 0 : n'affecte pas le score, pas besoin
        // d'imposer une note/justification tant qu'il n'est pas réellement activé.
        note = 0
      }

      const ratio = note / 20
      detail[key] = {
        nom: critere.nom,
        ponderation: Number(critere.ponderation),
        note,
        ratio: Math.round(ratio * 100) / 100,
        connecte: Boolean(critere.code),
        ...(justification ? { justification } : {}),
      }
      scoreBrut += ratio * Number(critere.ponderation)
    }
    const score = Math.round((scoreBrut / totalPonderation) * 20 * 100) / 100
    prepared.push({ membre, score, detail })
  }

  // Passe 2 : tout est valide, on peut écrire.
  const results = []
  for (const { membre, score, detail } of prepared) {
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

// Scores calculés pour le collaborateur connecté (page "Mon profil"), un par équipe
// (UP ou hors UP) dont il est membre — le plus récent en premier. Avant, seul le score
// le plus récent tous équipes confondues était renvoyé (LIMIT 1), ce qui masquait le
// score des autres équipes pour un collaborateur qui en a plusieurs.
// Scores calculés pour le collaborateur connecté (page "Mon profil"), un par équipe
// (UP ou hors UP) dont il est membre. Quand une période (annee_universitaire + semestre)
// est fournie, on renvoie le score de CETTE période précisément (le tableau a bien ces
// colonnes) — une équipe non évaluée sur cette période n'apparaît simplement pas. Sans
// période fournie, on garde l'ancien comportement (le plus récent par équipe) pour ne
// rien casser côté appels existants qui n'auraient pas encore été mis à jour.
export async function getMesScores(idCollaborateur, anneeUniversitaire, semestre) {
  if (anneeUniversitaire && semestre) {
    const [rows] = await pool.query(
      `SELECT
        es.id_score, es.type_equipe, es.annee_universitaire, es.semestre, es.score, es.date_calcul,
        CASE WHEN es.type_equipe = 'hors_up'
          THEN (SELECT nom_up FROM equipe_hors_up WHERE id_up = es.id_up)
          ELSE (SELECT nom FROM sous_equipe WHERE id_sous_equipe = es.id_sous_equipe)
        END AS equipe_nom
      FROM evaluation_score es
      WHERE es.id_collaborateur = ? AND es.annee_universitaire = ? AND es.semestre = ?
      ORDER BY es.date_calcul DESC`,
      [idCollaborateur, anneeUniversitaire, semestre]
    )
    return rows
  }

  const [rows] = await pool.query(
    `SELECT
      es.id_score, es.type_equipe, es.annee_universitaire, es.semestre, es.score, es.date_calcul,
      CASE WHEN es.type_equipe = 'hors_up'
        THEN (SELECT nom_up FROM equipe_hors_up WHERE id_up = es.id_up)
        ELSE (SELECT nom FROM sous_equipe WHERE id_sous_equipe = es.id_sous_equipe)
      END AS equipe_nom
    FROM evaluation_score es
    INNER JOIN (
      SELECT equipe_key, MAX(date_calcul) AS max_date
      FROM evaluation_score
      WHERE id_collaborateur = ?
      GROUP BY equipe_key
    ) latest ON latest.equipe_key = es.equipe_key AND latest.max_date = es.date_calcul
    WHERE es.id_collaborateur = ?
    ORDER BY es.date_calcul DESC`,
    [idCollaborateur, idCollaborateur]
  )
  return rows
}

// Historique complet des scores d'un collaborateur, toutes équipes et toutes
// périodes confondues, trié chronologiquement — alimente la vue "Historique"
// de la page "Mon profil" (évolution du score dans le temps, contrairement à
// getMesScores() ci-dessus qui ne renvoie qu'une période à la fois).
export async function getHistoriqueScores(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT
      es.id_score, es.type_equipe, es.annee_universitaire, es.semestre, es.score, es.date_calcul,
      CASE WHEN es.type_equipe = 'hors_up'
        THEN (SELECT nom_up FROM equipe_hors_up WHERE id_up = es.id_up)
        ELSE (SELECT nom FROM sous_equipe WHERE id_sous_equipe = es.id_sous_equipe)
      END AS equipe_nom
    FROM evaluation_score es
    WHERE es.id_collaborateur = ?
    ORDER BY es.annee_universitaire ASC, es.semestre ASC, es.date_calcul ASC`,
    [idCollaborateur]
  )
  return rows
}

// Utilisé quand un collaborateur est retiré d'une sous-équipe ou d'une équipe hors UP :
// ses scores d'évaluation calculés pour CETTE équipe n'ont plus de sens (il n'en fait
// plus partie), ils sont donc supprimés — voir sousEquipes.controller.js et
// equipeHorsUp.controller.js -> removeMembre.
export async function deleteScoresCollaborateurEquipe(idCollaborateur, teamId, type = 'up') {
  const cfg = teamConfig(type)
  await pool.query(
    `DELETE FROM evaluation_score WHERE id_collaborateur = ? AND type_equipe = ? AND ${cfg.idCol} = ?`,
    [idCollaborateur, type, teamId]
  )
}