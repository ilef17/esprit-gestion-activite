import pool from '../config/db.js'

// Aligné sur l'enum `type` de la table `activite_academique` (schema.sql). `jury_soutenance`
// est conservé pour compatibilité avec d'anciennes entrées, mais n'est plus proposé dans les
// formulaires (remplacé par la distinction plus fine membre_jury / président_jury, qui
// correspond aux colonnes du tableau "Activité école" admin).
export const TYPES_ACTIVITE = [
  'membre_jury',
  'president_jury',
  'formation_ete',
  'formation_hiver',
  'formation_printemps',
  'evenement',
  'comite_organisation',
  'jury_soutenance',
]

// Toutes les activités de tous les collaborateurs en une seule requête — utilisé par
// la page "Activité école" (admin) et "Tous les collègues" (collaborateur) pour remplir
// les colonnes par type sans faire une requête par ligne du tableau.
export async function getAllActivites() {
  const [rows] = await pool.query('SELECT * FROM activite_academique ORDER BY date_activite DESC, date_ajout DESC')
  return rows
}

export async function getActivitesByCollaborateur(idCollaborateur, type) {
  let sql = 'SELECT * FROM activite_academique WHERE id_collaborateur = ?'
  const params = [idCollaborateur]
  if (type) {
    sql += ' AND type = ?'
    params.push(type)
  }
  sql += ' ORDER BY date_activite DESC, date_ajout DESC'
  const [rows] = await pool.query(sql, params)
  return rows
}

export async function getActiviteById(id) {
  const [rows] = await pool.query('SELECT * FROM activite_academique WHERE id_activite = ?', [id])
  return rows[0]
}

export async function addActivite(idCollaborateur, { type, titre, role, date_activite, description }) {
  const [result] = await pool.query(
    `INSERT INTO activite_academique (id_collaborateur, type, titre, role, date_activite, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idCollaborateur, type, titre, role || null, date_activite || null, description || null]
  )
  return {
    id_activite: result.insertId,
    id_collaborateur: Number(idCollaborateur),
    type,
    titre,
    role: role || null,
    date_activite: date_activite || null,
    description: description || null,
  }
}

export async function deleteActivite(id) {
  await pool.query('DELETE FROM activite_academique WHERE id_activite = ?', [id])
}

// Utilisé par la page "Activité école" : nombre d'entrées par professeur ET par type
// (jury de soutenance / événement / comité d'organisation), en une seule requête.
// `periode` ({ annee_universitaire, semestre }) restreint le comptage à cette période
// (utilisé pour le calcul du score d'évaluation, propre à une période) ; omis, renvoie
// le total toutes périodes confondues (utilisé par l'affichage "Activité école").
export async function countActivitesParCollaborateurEtType(periode) {
  let sql = 'SELECT id_collaborateur, type, COUNT(*) AS nb FROM activite_academique'
  const params = []
  if (periode?.annee_universitaire && periode?.semestre) {
    sql += ' WHERE annee_universitaire = ? AND semestre = ?'
    params.push(periode.annee_universitaire, periode.semestre)
  }
  sql += ' GROUP BY id_collaborateur, type'
  const [rows] = await pool.query(sql, params)
  return rows
}