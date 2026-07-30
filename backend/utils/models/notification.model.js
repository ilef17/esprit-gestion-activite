import pool from '../config/db.js'

// Il n'existe pas de table `utilisateur` unique dans ce schéma (admin / responsable /
// collaborateur sont 3 tables séparées) : un destinataire est donc identifié par
// (id_utilisateur, type_utilisateur), exactement comme req.user = { id, role }.

export async function creerNotification({ id_utilisateur, type_utilisateur, type, titre, message, lien_page }) {
  const [result] = await pool.query(
    `INSERT INTO notification (id_utilisateur, type_utilisateur, type, titre, message, lien_page)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_utilisateur, type_utilisateur, type, titre, message || null, lien_page || null]
  )
  return { id_notification: result.insertId }
}

// Notifie plusieurs destinataires du même rôle en une seule requête (ex. campagne de
// vœux pédagogiques envoyée à tous les collaborateurs).
export async function creerNotificationsEnMasse(idsUtilisateurs, { type_utilisateur, type, titre, message, lien_page }) {
  if (!idsUtilisateurs || idsUtilisateurs.length === 0) return
  const values = idsUtilisateurs.map((id) => [id, type_utilisateur, type, titre, message || null, lien_page || null])
  await pool.query(
    `INSERT INTO notification (id_utilisateur, type_utilisateur, type, titre, message, lien_page) VALUES ?`,
    [values]
  )
}

export async function getMesNotifications(idUtilisateur, typeUtilisateur, { limit = 30 } = {}) {
  const [rows] = await pool.query(
    `SELECT * FROM notification
      WHERE id_utilisateur = ? AND type_utilisateur = ?
      ORDER BY date_creation DESC
      LIMIT ?`,
    [idUtilisateur, typeUtilisateur, Number(limit)]
  )
  return rows
}

export async function compterNonLues(idUtilisateur, typeUtilisateur) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM notification WHERE id_utilisateur = ? AND type_utilisateur = ? AND lu = 0`,
    [idUtilisateur, typeUtilisateur]
  )
  return rows[0]?.total || 0
}

export async function marquerLue(id, idUtilisateur, typeUtilisateur) {
  await pool.query(
    `UPDATE notification SET lu = 1 WHERE id_notification = ? AND id_utilisateur = ? AND type_utilisateur = ?`,
    [id, idUtilisateur, typeUtilisateur]
  )
}

export async function marquerToutesLues(idUtilisateur, typeUtilisateur) {
  await pool.query(
    `UPDATE notification SET lu = 1 WHERE id_utilisateur = ? AND type_utilisateur = ? AND lu = 0`,
    [idUtilisateur, typeUtilisateur]
  )
}

// Retrouve le nom d'un auteur (admin ou responsable) pour les messages du type
// "X vous a assigné une tâche" — jamais un collaborateur, qui ne peut pas assigner.
export async function getNomAuteur(typeUtilisateur, idUtilisateur) {
  if (typeUtilisateur === 'admin') {
    const [rows] = await pool.query('SELECT nom FROM admin WHERE id_admin = ?', [idUtilisateur])
    return rows[0]?.nom || 'Un administrateur'
  }
  if (typeUtilisateur === 'responsable') {
    const [rows] = await pool.query('SELECT nom FROM responsable WHERE id_responsable = ?', [idUtilisateur])
    return rows[0]?.nom || 'Un responsable'
  }
  return 'Un membre de l\'équipe'
}
