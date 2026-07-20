import pool from '../config/db.js'
import { getBornesPeriode } from '../utils/periode.js'

export async function getAllDemandes(periode) {
  const params = []
  let whereCond = ''
  if (periode?.annee_universitaire && periode?.semestre) {
    const { debut, fin } = getBornesPeriode(periode.annee_universitaire, periode.semestre)
    whereCond = ' WHERE d.date_reception >= ? AND d.date_reception < ?'
    params.push(debut, fin)
  }
  const [rows] = await pool.query(`
    SELECT d.*, c.nom AS collaborateur_nom
    FROM demande_hors_equipe d
    JOIN collaborateur c ON c.id_collaborateur = d.id_collaborateur
    ${whereCond}
    ORDER BY d.date_reception DESC
  `, params)
  return rows
}

// Demandes du collaborateur connecté — utilisées par "Mes demandes" côté collaborateur.
export async function getDemandesByCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT d.*, c.nom AS collaborateur_nom
     FROM demande_hors_equipe d
     JOIN collaborateur c ON c.id_collaborateur = d.id_collaborateur
     WHERE d.id_collaborateur = ?
     ORDER BY d.date_reception DESC`,
    [idCollaborateur]
  )
  return rows
}

export async function getDemandeById(id) {
  const [rows] = await pool.query('SELECT * FROM demande_hors_equipe WHERE id_demande = ?', [id])
  return rows[0]
}

// Comme getDemandeById mais avec le nom + l'email du collaborateur joints — utile pour
// composer l'email de vérification et l'email de notification (validée/refusée)
// sans refaire une requête séparée.
export async function getDemandeDetailById(id) {
  const [rows] = await pool.query(
    `SELECT d.*, c.nom AS collaborateur_nom, c.email AS collaborateur_email
     FROM demande_hors_equipe d
     JOIN collaborateur c ON c.id_collaborateur = d.id_collaborateur
     WHERE d.id_demande = ?`,
    [id]
  )
  return rows[0]
}

export async function createDemande({ id_collaborateur, description, contexte, date_debut, date_fin, contact_responsable }) {
  const [result] = await pool.query(
    `INSERT INTO demande_hors_equipe
       (id_collaborateur, description, contexte, date_debut, date_fin, contact_responsable)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_collaborateur, description, contexte || null, date_debut || null, date_fin || null, contact_responsable || null]
  )
  return getDemandeById(result.insertId)
}

export async function setDestinataireEtEnvoyer(id, destinataire_verification) {
  await pool.query(
    `UPDATE demande_hors_equipe
     SET destinataire_verification = ?, statut = 'envoye'
     WHERE id_demande = ?`,
    [destinataire_verification, id]
  )
  return getDemandeById(id)
}

export async function validerDemande(id) {
  await pool.query(
    `UPDATE demande_hors_equipe SET statut = 'validee', date_validation = NOW() WHERE id_demande = ?`,
    [id]
  )
  return getDemandeById(id)
}

export async function refuserDemande(id) {
  await pool.query(`UPDATE demande_hors_equipe SET statut = 'refusee' WHERE id_demande = ?`, [id])
  return getDemandeById(id)
}

export async function deleteDemande(id) {
  await pool.query('DELETE FROM demande_hors_equipe WHERE id_demande = ?', [id])
}