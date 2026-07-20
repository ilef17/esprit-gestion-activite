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