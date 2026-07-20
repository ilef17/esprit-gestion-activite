import pool from '../config/db.js'

export async function getParametres() {
  const [rows] = await pool.query('SELECT * FROM parametre_systeme WHERE id = 1')
  if (rows[0]) return rows[0]
  // Crée la ligne par défaut si elle n'existe pas encore
  await pool.query('INSERT INTO parametre_systeme (id) VALUES (1)')
  const [created] = await pool.query('SELECT * FROM parametre_systeme WHERE id = 1')
  return created[0]
}

export async function updateParametres(data) {
  await getParametres() // s'assure que la ligne existe
  const fields = []
  const values = []
  for (const key of [
    'annee_universitaire',
    'semestre_actif',
    'mail_verification_auto',
    'validation_auto',
    'notifications_email',
    'sauvegarde_auto',
  ]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(typeof data[key] === 'boolean' ? (data[key] ? 1 : 0) : data[key])
    }
  }
  if (fields.length === 0) return getParametres()
  await pool.query(`UPDATE parametre_systeme SET ${fields.join(', ')} WHERE id = 1`, values)
  return getParametres()
}
