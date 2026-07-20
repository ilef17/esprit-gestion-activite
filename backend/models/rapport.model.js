import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'
import { genererFichierRapport, REPORTS_DIR } from '../utils/rapportGenerator.js'

export async function getAllRapports(periode) {
  const params = []
  let whereCond = ''
  if (periode?.annee_universitaire && periode?.semestre) {
    whereCond = ' WHERE r.annee_universitaire = ? AND (r.semestre = ? OR r.semestre = \'annuel\')'
    params.push(periode.annee_universitaire, periode.semestre)
  }
  const [rows] = await pool.query(`
    SELECT r.*, se.nom AS sous_equipe_nom, c.nom AS collaborateur_nom
    FROM rapport r
    LEFT JOIN sous_equipe se ON se.id_sous_equipe = r.id_sous_equipe
    LEFT JOIN collaborateur c ON c.id_collaborateur = r.id_collaborateur
    ${whereCond}
    ORDER BY r.date_generation DESC
  `, params)
  return rows
}

export async function getRapportById(id) {
  const [rows] = await pool.query('SELECT * FROM rapport WHERE id_rapport = ?', [id])
  return rows[0]
}

// Insère la ligne de métadonnées, génère le fichier PDF/Excel correspondant à
// partir des données réelles (tâches, hors-équipe, scores), puis enregistre
// son chemin. Si la génération échoue, la ligne reste avec chemin_fichier nul
// plutôt que de faire échouer toute la requête — l'admin peut réessayer.
export async function createRapport({ titre, description, format, id_sous_equipe, id_collaborateur, annee_universitaire, semestre }) {
  const [result] = await pool.query(
    `INSERT INTO rapport (titre, description, format, id_sous_equipe, id_collaborateur, annee_universitaire, semestre)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [titre, description || null, format || 'pdf', id_sous_equipe || null, id_collaborateur || null, annee_universitaire || null, semestre || null]
  )
  const idRapport = result.insertId

  try {
    const filename = await genererFichierRapport({
      idRapport,
      format: format || 'pdf',
      idSousEquipe: id_sous_equipe || null,
      idCollaborateur: id_collaborateur || null,
      periode: annee_universitaire ? { annee_universitaire, semestre } : null,
    })
    await pool.query('UPDATE rapport SET chemin_fichier = ? WHERE id_rapport = ?', [filename, idRapport])
  } catch (err) {
    console.error('Erreur génération fichier rapport:', err)
  }

  return getRapportById(idRapport)
}

export async function deleteRapport(id) {
  const rapport = await getRapportById(id)
  if (rapport?.chemin_fichier) {
    const filePath = path.join(REPORTS_DIR, rapport.chemin_fichier)
    fs.unlink(filePath, () => {}) // best-effort, on ignore l'erreur si déjà absent
  }
  await pool.query('DELETE FROM rapport WHERE id_rapport = ?', [id])
}