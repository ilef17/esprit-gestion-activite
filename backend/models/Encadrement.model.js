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

// Utilisé par la page "Activité école" pour afficher le nombre d'étudiants encadrés par
// professeur. `annee_universitaire` restreint le comptage à cette année (utilisé pour le
// calcul du score d'évaluation, qui est propre à une période) ; omis, renvoie le total
// toutes années confondues (utilisé par l'affichage "Activité école" en lecture seule).
export async function countEncadrementsParCollaborateur(annee_universitaire) {
  const sql = annee_universitaire
    ? 'SELECT id_collaborateur, COUNT(*) AS nb FROM encadrement WHERE annee_universitaire = ? GROUP BY id_collaborateur'
    : 'SELECT id_collaborateur, COUNT(*) AS nb FROM encadrement GROUP BY id_collaborateur'
  const [rows] = await pool.query(sql, annee_universitaire ? [annee_universitaire] : [])
  return rows
}

// Tous les encadrements, tous collaborateurs confondus — utilisé par le tableau
// "Activité école" (admin + "Tous les collègues" collaborateur) pour pouvoir filtrer
// par année universitaire côté frontend (même logique que expertises/activités), au
// lieu de se limiter à un simple total non filtrable.
export async function getAllEncadrements() {
  const [rows] = await pool.query('SELECT * FROM encadrement ORDER BY date_ajout DESC')
  return rows
}