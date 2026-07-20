import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'
import { creerSauvegarde, verifierIntegrite, BACKUPS_DIR } from '../utils/backupGenerator.js'

export async function getAllSauvegardes() {
  const [rows] = await pool.query('SELECT * FROM sauvegarde ORDER BY date_creation DESC')
  return rows
}

export async function getSauvegardeById(id) {
  const [rows] = await pool.query('SELECT * FROM sauvegarde WHERE id_sauvegarde = ?', [id])
  return rows[0]
}

// Lance mysqldump, calcule le checksum, et enregistre le résultat (succès ou
// échec) en base — appelé aussi bien par le déclenchement manuel que par le
// planificateur automatique (voir server.js).
export async function lancerSauvegarde({ type = 'manuelle' } = {}) {
  const resultat = await creerSauvegarde({ type })
  const [insert] = await pool.query(
    `INSERT INTO sauvegarde (nom_fichier, taille_octets, checksum_sha256, type, statut, message_erreur)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [resultat.nom_fichier, resultat.taille_octets, resultat.checksum_sha256, resultat.type, resultat.statut, resultat.message_erreur]
  )
  return getSauvegardeById(insert.insertId)
}

export async function verifierSauvegarde(id) {
  const sauvegarde = await getSauvegardeById(id)
  if (!sauvegarde) return null
  const check = await verifierIntegrite(sauvegarde.nom_fichier, sauvegarde.checksum_sha256)
  return { ...sauvegarde, ...check }
}

export async function deleteSauvegarde(id) {
  const sauvegarde = await getSauvegardeById(id)
  if (sauvegarde?.nom_fichier) {
    const filePath = path.join(BACKUPS_DIR, sauvegarde.nom_fichier)
    fs.unlink(filePath, () => {})
  }
  await pool.query('DELETE FROM sauvegarde WHERE id_sauvegarde = ?', [id])
}
