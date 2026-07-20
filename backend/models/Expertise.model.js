import pool from '../config/db.js'

export async function getExpertisesByCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    'SELECT * FROM expertise WHERE id_collaborateur = ? ORDER BY libelle',
    [idCollaborateur]
  )
  return rows
}

export async function getExpertiseById(id) {
  const [rows] = await pool.query('SELECT * FROM expertise WHERE id_expertise = ?', [id])
  return rows[0]
}

export async function addExpertise(idCollaborateur, libelle) {
  const [result] = await pool.query(
    'INSERT INTO expertise (id_collaborateur, libelle) VALUES (?, ?)',
    [idCollaborateur, libelle]
  )
  return { id_expertise: result.insertId, id_collaborateur: Number(idCollaborateur), libelle }
}

export async function deleteExpertise(id) {
  await pool.query('DELETE FROM expertise WHERE id_expertise = ?', [id])
}

// Toutes les expertises de tous les collaborateurs en une seule requête — utilisé par
// la page "Activité école" (admin) et "Tous les collègues" (collaborateur) pour remplir
// la colonne Expertises sans faire une requête par ligne du tableau.
export async function getAllExpertises() {
  const [rows] = await pool.query('SELECT * FROM expertise ORDER BY libelle')
  return rows
}

// Utilisé par la page "Activité école" pour afficher le nombre d'expertises par professeur
export async function countExpertisesParCollaborateur() {
  const [rows] = await pool.query(
    'SELECT id_collaborateur, COUNT(*) AS nb FROM expertise GROUP BY id_collaborateur'
  )
  return rows
}