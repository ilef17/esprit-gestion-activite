import pool from '../config/db.js'

// `code` ancre un critère à un calcul mesurable dans evaluationScore.model.js
// (qualite / delais / implication / coordination / activite_ecole). Les 5 critères de
// base en ont un et sont protégés contre la suppression (voir deleteCritere plus bas) ;
// seul un critère personnalisé ajouté depuis l'UI a code = NULL, et sa pondération ne
// contribue à aucun calcul automatique tant qu'aucune logique dédiée n'a été écrite
// pour lui (voir calculerScoresSousEquipe).
export async function getAllCriteres() {
  const [rows] = await pool.query('SELECT * FROM critere_evaluation ORDER BY id_critere')
  return rows
}

export async function getCritereById(id) {
  const [rows] = await pool.query('SELECT * FROM critere_evaluation WHERE id_critere = ?', [id])
  return rows[0]
}

export async function createCritere({ nom, ponderation }) {
  const [result] = await pool.query(
    'INSERT INTO critere_evaluation (nom, ponderation) VALUES (?, ?)',
    [nom, ponderation || 0]
  )
  return getCritereById(result.insertId)
}

export async function updateCritere(id, { nom, ponderation }) {
  const fields = []
  const values = []
  if (nom !== undefined) { fields.push('nom = ?'); values.push(nom) }
  if (ponderation !== undefined) { fields.push('ponderation = ?'); values.push(ponderation) }
  if (fields.length === 0) return getCritereById(id)
  values.push(id)
  await pool.query(`UPDATE critere_evaluation SET ${fields.join(', ')} WHERE id_critere = ?`, values)
  return getCritereById(id)
}

// Un critère avec un `code` est connecté à un calcul automatique (voir
// evaluationScore.model.js) : le supprimer casserait ce calcul pour tout le monde, sans
// avantage — contrairement à un critère personnalisé, il n'a pas besoin d'être retiré
// pour éviter la notation manuelle, puisqu'il n'y en a justement pas. On bloque donc sa
// suppression ici, en plus du bouton ✕ masqué côté UI pour ces critères.
export async function deleteCritere(id) {
  const critere = await getCritereById(id)
  if (critere?.code) {
    throw new Error(`Le critère "${critere.nom}" est calculé automatiquement et ne peut pas être supprimé.`)
  }
  await pool.query('DELETE FROM critere_evaluation WHERE id_critere = ?', [id])
}

export async function getTotalPonderation() {
  const [rows] = await pool.query('SELECT COALESCE(SUM(ponderation), 0) AS total FROM critere_evaluation')
  return Number(rows[0].total)
}