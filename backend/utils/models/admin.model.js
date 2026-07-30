import pool from '../config/db.js'

export async function findAdminByLogin(login) {
  const [rows] = await pool.query(
    'SELECT * FROM admin WHERE email = ? OR identifiant_esprit = ? LIMIT 1',
    [login, login]
  )
  return rows[0]
}

// ---------- Création (signup réservé à un admin déjà connecté) ----------

export async function findAdminByEmailOrIdentifiant(email, identifiant) {
  const [rows] = await pool.query(
    'SELECT * FROM admin WHERE email = ? OR identifiant_esprit = ? LIMIT 1',
    [email, identifiant]
  )
  return rows[0]
}

export async function createAdmin({ nom, email, identifiant_esprit, mot_de_passe }) {
  const [result] = await pool.query(
    'INSERT INTO admin (nom, email, identifiant_esprit, mot_de_passe) VALUES (?, ?, ?, ?)',
    [nom, email, identifiant_esprit, mot_de_passe]
  )
  return { id_admin: result.insertId, nom, email, identifiant_esprit }
}

// ---------- Mot de passe oublié ----------

export async function findAdminByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM admin WHERE email = ? LIMIT 1', [email])
  return rows[0]
}

export async function updateAdminPassword(email, hashedPassword) {
  await pool.query('UPDATE admin SET mot_de_passe = ? WHERE email = ?', [hashedPassword, email])
}

export async function getAdminById(id) {
  const [rows] = await pool.query('SELECT * FROM admin WHERE id_admin = ?', [id])
  return rows[0]
}

// ---------- Profil de l'admin connecté (page "Mon profil") ----------
// Symétrique de getMonProfil / getMonProfilResponsable : pas de sous-équipes côté
// admin, et pas de "profil_visible" (l'admin voit tout par définition).

export async function getMonProfilAdmin(id) {
  const [rows] = await pool.query(
    'SELECT id_admin, nom, email, identifiant_esprit, notifications_email FROM admin WHERE id_admin = ?',
    [id]
  )
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id_admin,
    nom: row.nom,
    email: row.email,
    identifiant_esprit: row.identifiant_esprit,
    notifications_email: !!row.notifications_email,
  }
}

export async function updateMesPreferencesAdmin(id, { notifications_email }) {
  if (notifications_email === undefined) return getMonProfilAdmin(id)
  await pool.query('UPDATE admin SET notifications_email = ? WHERE id_admin = ?', [notifications_email ? 1 : 0, id])
  return getMonProfilAdmin(id)
}

export async function updateMonIdentiteAdmin(id, { nom, email }) {
  const fields = []
  const values = []
  if (nom !== undefined) { fields.push('nom = ?'); values.push(nom) }
  if (email !== undefined) { fields.push('email = ?'); values.push(email) }
  if (fields.length === 0) return getMonProfilAdmin(id)
  values.push(id)
  await pool.query(`UPDATE admin SET ${fields.join(', ')} WHERE id_admin = ?`, values)
  return getMonProfilAdmin(id)
}

// Changement de mot de passe depuis "Mon profil" (self-service, par id).
export async function updateAdminPasswordById(id, hashedPassword) {
  await pool.query('UPDATE admin SET mot_de_passe = ? WHERE id_admin = ?', [hashedPassword, id])
}