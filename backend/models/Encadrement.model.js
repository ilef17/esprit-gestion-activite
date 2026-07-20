import pool from '../config/db.js'

export async function getEncadrementsByCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    'SELECT * FROM encadrement WHERE id_collaborateur = ? ORDER BY date_ajout DESC',
    [idCollaborateur]
  )
  return rows
}

export async function getEncadrementById(id) {
  const [rows] = await pool.query('SELECT * FROM encadrement WHERE id_encadrement = ?', [id])
  return rows[0]
}

export async function addEncadrement(idCollaborateur, { nom_etudiant, sujet, type, annee_universitaire }) {
  const [result] = await pool.query(
    `INSERT INTO encadrement (id_collaborateur, nom_etudiant, sujet, type, annee_universitaire)
     VALUES (?, ?, ?, ?, ?)`,
    [idCollaborateur, nom_etudiant, sujet || null, type || 'pfe', annee_universitaire || null]
  )
  return {
    id_encadrement: result.insertId,
    id_collaborateur: Number(idCollaborateur),
    nom_etudiant,
    sujet: sujet || null,
    type: type || 'pfe',
    annee_universitaire: annee_universitaire || null,
  }
}

export async function deleteEncadrement(id) {
  await pool.query('DELETE FROM encadrement WHERE id_encadrement = ?', [id])
}

// Utilisé par la page "Activité école" pour afficher le nombre d'étudiants encadrés par professeur
export async function countEncadrementsParCollaborateur() {
  const [rows] = await pool.query(
    'SELECT id_collaborateur, COUNT(*) AS nb FROM encadrement GROUP BY id_collaborateur'
  )
  return rows
}