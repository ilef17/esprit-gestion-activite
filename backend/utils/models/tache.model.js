import pool from '../config/db.js'
import { getPeriodeActuelle } from '../utils/periode.js'

export async function getAllTaches({ sousEquipeId, equipeHorsUpId, collaborateurId } = {}) {
  let sql = `
    SELECT t.*, c.nom AS collaborateur_nom,
      COALESCE(se.nom, eh.nom_up) AS sous_equipe_nom
    FROM tache t
    LEFT JOIN collaborateur c ON c.id_collaborateur = t.id_collaborateur
    LEFT JOIN sous_equipe se ON se.id_sous_equipe = t.id_sous_equipe
    LEFT JOIN equipe_hors_up eh ON eh.id_up = t.id_equipe_hors_up
    WHERE 1 = 1
  `
  const params = []
  if (sousEquipeId) {
    sql += ' AND t.id_sous_equipe = ?'
    params.push(sousEquipeId)
  }
  if (equipeHorsUpId) {
    sql += ' AND t.id_equipe_hors_up = ?'
    params.push(equipeHorsUpId)
  }
  if (collaborateurId) {
    sql += ' AND t.id_collaborateur = ?'
    params.push(collaborateurId)
  }
  sql += ' ORDER BY t.date_creation DESC'
  const [rows] = await pool.query(sql, params)
  return rows
}

// Tâches non assignées ("pool") ouvertes aux membres d'une sous-équipe / équipe hors
// UP donnée — utilisé pour l'e-mail/notification de disponibilité et pour l'écran
// "Tâches disponibles" côté collaborateur.
export async function getTachesNonAssigneesParEquipes({ sousEquipeIds = [], equipeHorsUpIds = [] } = {}) {
  if (sousEquipeIds.length === 0 && equipeHorsUpIds.length === 0) return []
  const conditions = []
  const params = []
  if (sousEquipeIds.length > 0) {
    conditions.push(`t.id_sous_equipe IN (${sousEquipeIds.map(() => '?').join(',')})`)
    params.push(...sousEquipeIds)
  }
  if (equipeHorsUpIds.length > 0) {
    conditions.push(`t.id_equipe_hors_up IN (${equipeHorsUpIds.map(() => '?').join(',')})`)
    params.push(...equipeHorsUpIds)
  }
  const [rows] = await pool.query(
    `SELECT t.*, COALESCE(se.nom, eh.nom_up) AS sous_equipe_nom
       FROM tache t
       LEFT JOIN sous_equipe se ON se.id_sous_equipe = t.id_sous_equipe
       LEFT JOIN equipe_hors_up eh ON eh.id_up = t.id_equipe_hors_up
      WHERE t.id_collaborateur IS NULL AND (${conditions.join(' OR ')})
      ORDER BY t.date_creation DESC`,
    params
  )
  return rows
}

// Nombre de tâches qu'un collaborateur a actuellement "à faire" ou "en cours" — sert
// de base à la limite de prise en charge dans le pool commun (voir choisirTache).
export async function compterTachesActivesCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM tache WHERE id_collaborateur = ? AND statut IN ('a_faire', 'en_cours')`,
    [idCollaborateur]
  )
  return rows[0]?.n || 0
}

// Assignation atomique : la condition "id_collaborateur IS NULL" dans le WHERE évite
// que deux collaborateurs ne prennent la même tâche en même temps (le second UPDATE,
// exécuté après le premier, ne trouvera plus aucune ligne à modifier).
export async function choisirTachePourCollaborateur(idTache, idCollaborateur) {
  const [result] = await pool.query(
    `UPDATE tache SET id_collaborateur = ? WHERE id_tache = ? AND id_collaborateur IS NULL`,
    [idCollaborateur, idTache]
  )
  if (result.affectedRows === 0) return null
  return getTacheById(idTache)
}

export async function marquerDisponibiliteNotifiee(ids) {
  if (!ids || ids.length === 0) return
  await pool.query(
    `UPDATE tache SET disponibilite_notifiee = 1 WHERE id_tache IN (${ids.map(() => '?').join(',')})`,
    ids
  )
}

export async function getTacheById(id) {
  const [rows] = await pool.query('SELECT * FROM tache WHERE id_tache = ?', [id])
  return rows[0]
}

export async function createTache({ titre, description, statut, priorite, date_echeance, id_collaborateur, id_sous_equipe, id_equipe_hors_up }) {
  // Une tâche appartient à la période où elle a été créée (utilisé par les rapports
  // semestriels/annuels — voir rapportGenerator.js).
  const { annee_universitaire, semestre } = getPeriodeActuelle()
  const [result] = await pool.query(
    `INSERT INTO tache (titre, description, statut, priorite, date_echeance, id_collaborateur, id_sous_equipe, id_equipe_hors_up, annee_universitaire, semestre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      titre, description || null, statut || 'a_faire', priorite || 'moyenne', date_echeance || null,
      id_collaborateur || null, id_sous_equipe || null, id_equipe_hors_up || null,
      annee_universitaire, semestre,
    ]
  )
  return getTacheById(result.insertId)
}

// Création groupée : le responsable publie une liste de tâches en un seul envoi
// (même équipe, même appel) — voir addTachesEnLot dans le contrôleur, qui envoie
// ensuite une seule notification/e-mail récapitulatif au lieu d'un par tâche.
export async function createTachesEnLot(taches) {
  const created = []
  for (const t of taches) {
    created.push(await createTache(t))
  }
  return created
}

export async function updateTache(id, data) {
  const fields = []
  const values = []
  for (const key of ['titre', 'description', 'statut', 'priorite', 'date_echeance', 'id_collaborateur', 'id_sous_equipe', 'id_equipe_hors_up', 'membre_concerne', 'raison_probleme']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  // Horodate automatiquement la validation quand le statut passe à "validee"
  if (data.statut === 'validee') {
    fields.push('date_validation = NOW()')
  }
  // Le champ membre_concerne / raison_probleme n'ont de sens que pour un problème
  // de coordination — nettoyés dès qu'on quitte ce statut.
  if (data.statut && data.statut !== 'probleme_coordination' && data.membre_concerne === undefined) {
    fields.push('membre_concerne = NULL')
  }
  if (data.statut && data.statut !== 'probleme_coordination' && data.raison_probleme === undefined) {
    fields.push('raison_probleme = NULL')
  }
  if (fields.length === 0) return getTacheById(id)
  values.push(id)
  await pool.query(`UPDATE tache SET ${fields.join(', ')} WHERE id_tache = ?`, values)
  return getTacheById(id)
}

export async function deleteTache(id) {
  await pool.query('DELETE FROM tache WHERE id_tache = ?', [id])
}

// Tâches dont l'échéance tombe dans 2 jours ou moins (mais pas déjà passée), pas
// encore validées, et pas déjà rappelées — utilisé par le cron quotidien de rappel
// (voir server.js). Une comparaison en plage (et non une égalité stricte à J+2) est
// nécessaire : une tâche créée avec une échéance déjà à J+1, ou dont le cron a raté
// le jour J+2 (serveur down, etc.), doit quand même recevoir un rappel une fois
// entrée dans la fenêtre, au lieu d'être silencieusement sautée pour toujours.
// `rappel_echeance_envoye` évite tout double envoi entre deux exécutions.
export async function getTachesEcheanceProche() {
  const [rows] = await pool.query(`
    SELECT t.*, c.nom AS collaborateur_nom, c.email AS collaborateur_email, c.notifications_email
    FROM tache t
    JOIN collaborateur c ON c.id_collaborateur = t.id_collaborateur
    WHERE t.date_echeance BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
      AND t.statut != 'validee'
      AND t.rappel_echeance_envoye = 0
      AND t.id_collaborateur IS NOT NULL
  `)
  return rows
}

export async function marquerRappelEcheanceEnvoye(id) {
  await pool.query('UPDATE tache SET rappel_echeance_envoye = 1 WHERE id_tache = ?', [id])
}

// Statistiques d'implication par collaborateur (utilisées par la page Rapports et le
// tableau de bord). Si année/semestre sont fournis, ne compte que les tâches créées
// pendant cette période (colonnes tache.annee_universitaire / tache.semestre).
export async function getStatsImplication(anneeUniversitaire, semestre) {
  let sql = `
    SELECT
      c.id_collaborateur, c.nom,
      COUNT(t.id_tache) AS taches_total,
      SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) AS taches_validees
    FROM collaborateur c
    LEFT JOIN tache t ON t.id_collaborateur = c.id_collaborateur
  `
  const params = []
  if (anneeUniversitaire && semestre) {
    sql += ' AND t.annee_universitaire = ? AND t.semestre = ?'
    params.push(anneeUniversitaire, semestre)
  }
  sql += ' GROUP BY c.id_collaborateur ORDER BY c.nom'
  const [rows] = await pool.query(sql, params)
  return rows.map((r) => ({
    id_collaborateur: r.id_collaborateur,
    nom: r.nom,
    taches_validees: Number(r.taches_validees) || 0,
    taches_total: Number(r.taches_total) || 0,
    taux_implication: r.taches_total > 0 ? Math.round((r.taches_validees / r.taches_total) * 100) : 0,
  }))
}