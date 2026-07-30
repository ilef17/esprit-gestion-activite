import pool from '../config/db.js'

export async function findResponsableByLogin(login) {
  const [rows] = await pool.query(
    'SELECT * FROM responsable WHERE email = ? OR identifiant_esprit = ? LIMIT 1',
    [login, login]
  )
  return rows[0]
}

export async function findResponsableByEmailOrIdentifiant(email, identifiant) {
  const [rows] = await pool.query(
    'SELECT * FROM responsable WHERE email = ? OR identifiant_esprit = ? LIMIT 1',
    [email, identifiant]
  )
  return rows[0]
}

export async function createResponsable({ nom, email, identifiant_esprit, mot_de_passe }) {
  const [result] = await pool.query(
    'INSERT INTO responsable (nom, email, identifiant_esprit, mot_de_passe) VALUES (?, ?, ?, ?)',
    [nom, email, identifiant_esprit, mot_de_passe]
  )
  return { id_responsable: result.insertId, nom, email, identifiant_esprit }
}

// ---------- Gestion admin (page Utilisateurs) ----------

export async function getAllResponsables() {
  const [rows] = await pool.query(`
    SELECT
      r.id_responsable, r.nom, r.email, r.identifiant_esprit, r.actif, r.date_creation,
      (SELECT GROUP_CONCAT(se.id_sous_equipe, ':', se.nom SEPARATOR '||')
         FROM sous_equipe se
        WHERE se.id_responsable = r.id_responsable) AS sous_equipes,
      (SELECT GROUP_CONCAT(up.id_up, ':', up.nom_up SEPARATOR '||')
         FROM equipe_hors_up up
        WHERE up.id_responsable = r.id_responsable) AS equipes_hors_up
    FROM responsable r
    ORDER BY r.nom
  `)
  return rows
}

export async function getResponsableById(id) {
  const [rows] = await pool.query('SELECT * FROM responsable WHERE id_responsable = ?', [id])
  return rows[0]
}

export async function updateResponsable(id, data) {
  const fields = []
  const values = []
  for (const key of ['nom', 'email', 'identifiant_esprit', 'actif']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (fields.length === 0) return getResponsableById(id)
  values.push(id)
  await pool.query(`UPDATE responsable SET ${fields.join(', ')} WHERE id_responsable = ?`, values)
  return getResponsableById(id)
}

export async function deleteResponsable(id) {
  await pool.query('DELETE FROM responsable WHERE id_responsable = ?', [id])
}

// Un compte "responsable" n'a de sens que tant qu'il gère au moins une équipe (sous-équipe
// UP ou équipe hors UP). Quand il vient d'être retiré de sa dernière équipe (ou que celle-ci
// vient d'être supprimée) et qu'il n'en gère donc plus aucune, on supprime ce compte
// orphelin plutôt que de le laisser affiché dans la page Utilisateurs avec une équipe vide —
// voir sousEquipes.controller.js et equipeHorsUp.controller.js (editSousEquipe/editEquipeHorsUp,
// removeSousEquipe/removeEquipeHorsUp). Le compte collaborateur "miroir" éventuel n'est pas
// touché : la personne redevient simplement un collaborateur ordinaire.
export async function supprimerResponsableSiOrphelin(id) {
  if (!id) return
  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM sous_equipe WHERE id_responsable = ?) +
      (SELECT COUNT(*) FROM equipe_hors_up WHERE id_responsable = ?) AS nb_equipes`,
    [id, id]
  )
  if (Number(rows[0]?.nb_equipes || 0) === 0) {
    await deleteResponsable(id)
  }
}

// ---------- Mot de passe oublié ----------

export async function updateResponsablePassword(email, hashedPassword) {
  await pool.query('UPDATE responsable SET mot_de_passe = ? WHERE email = ?', [hashedPassword, email])
}

// ---------- Profil du responsable connecté (page "Mon profil") ----------

// Identité, équipes gérées (sous-équipes UP + équipes hors UP) et préférences de
// compte, pour l'utilisateur du token.
export async function getMonProfilResponsable(id) {
  const [rows] = await pool.query(
    `SELECT
      r.id_responsable, r.nom, r.email, r.identifiant_esprit,
      r.notifications_email, r.profil_visible,
      GROUP_CONCAT(DISTINCT se.nom SEPARATOR ', ') AS sous_equipes_up,
      GROUP_CONCAT(DISTINCT eh.nom_up SEPARATOR ', ') AS equipes_hors_up
    FROM responsable r
    LEFT JOIN sous_equipe se ON se.id_responsable = r.id_responsable
    LEFT JOIN equipe_hors_up eh ON eh.id_responsable = r.id_responsable
    WHERE r.id_responsable = ?
    GROUP BY r.id_responsable, r.nom, r.email, r.identifiant_esprit, r.notifications_email, r.profil_visible`,
    [id]
  )
  const row = rows[0]
  if (!row) return null
  const toutesEquipes = [row.sous_equipes_up, row.equipes_hors_up].filter(Boolean).join(', ')
  return {
    id: row.id_responsable,
    nom: row.nom,
    email: row.email,
    identifiant_esprit: row.identifiant_esprit,
    sous_equipes: toutesEquipes || null,
    notifications_email: !!row.notifications_email,
    profil_visible: !!row.profil_visible,
  }
}

// Met à jour les préférences de compte (toggles de la page "Mon profil").
export async function updateMesPreferencesResponsable(id, { notifications_email, profil_visible }) {
  const fields = []
  const values = []
  if (notifications_email !== undefined) { fields.push('notifications_email = ?'); values.push(notifications_email ? 1 : 0) }
  if (profil_visible !== undefined) { fields.push('profil_visible = ?'); values.push(profil_visible ? 1 : 0) }
  if (fields.length === 0) return getMonProfilResponsable(id)
  values.push(id)
  await pool.query(`UPDATE responsable SET ${fields.join(', ')} WHERE id_responsable = ?`, values)
  return getMonProfilResponsable(id)
}

// Met à jour nom/email depuis "Mon profil" (édition self-service). L'unicité de l'email
// est vérifiée en amont par le contrôleur (findResponsableByEmailOrIdentifiant).
export async function updateMonIdentiteResponsable(id, { nom, email }) {
  const fields = []
  const values = []
  if (nom !== undefined) { fields.push('nom = ?'); values.push(nom) }
  if (email !== undefined) { fields.push('email = ?'); values.push(email) }
  if (fields.length === 0) return getMonProfilResponsable(id)
  values.push(id)
  await pool.query(`UPDATE responsable SET ${fields.join(', ')} WHERE id_responsable = ?`, values)
  return getMonProfilResponsable(id)
}

// Changement de mot de passe depuis "Mon profil" (self-service, par id — contrairement à
// updateResponsablePassword ci-dessus qui sert au flux "mot de passe oublié", par email).
export async function updateResponsablePasswordById(id, hashedPassword) {
  await pool.query('UPDATE responsable SET mot_de_passe = ? WHERE id_responsable = ?', [hashedPassword, id])
}

// Crée un compte responsable à partir d'un compte collaborateur existant
// (même identifiants de connexion — nom, email, identifiant_esprit, mot de passe déjà hashé).
// Utilisé quand l'admin "promeut" un collaborateur pour qu'il puisse être désigné
// responsable d'une (sous-)équipe, sans lui faire recréer un compte.
export async function createResponsableFromCollaborateur({ nom, email, identifiant_esprit, mot_de_passe }) {
  const [result] = await pool.query(
    'INSERT INTO responsable (nom, email, identifiant_esprit, mot_de_passe) VALUES (?, ?, ?, ?)',
    [nom, email, identifiant_esprit, mot_de_passe]
  )
  return getResponsableById(result.insertId)
}