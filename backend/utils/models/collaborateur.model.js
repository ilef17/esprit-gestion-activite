import pool from '../config/db.js'

export async function findCollaborateurByLogin(login) {
  const [rows] = await pool.query(
    'SELECT * FROM collaborateur WHERE email = ? OR identifiant_esprit = ? LIMIT 1',
    [login, login]
  )
  return rows[0]
}

export async function findCollaborateurByEmailOrIdentifiant(email, identifiant) {
  const [rows] = await pool.query(
    'SELECT * FROM collaborateur WHERE email = ? OR identifiant_esprit = ? LIMIT 1',
    [email, identifiant]
  )
  return rows[0]
}

export async function createCollaborateur({ nom, email, identifiant_esprit, mot_de_passe }) {
  const [result] = await pool.query(
    'INSERT INTO collaborateur (nom, email, identifiant_esprit, mot_de_passe) VALUES (?, ?, ?, ?)',
    [nom, email, identifiant_esprit, mot_de_passe]
  )
  return { id_collaborateur: result.insertId, nom, email, identifiant_esprit }
}

export async function addCollaborateurToSousEquipes(idCollaborateur, sousEquipeIds) {
  if (!sousEquipeIds || sousEquipeIds.length === 0) return
  const values = sousEquipeIds.map((id) => [idCollaborateur, id])
  await pool.query(
    'INSERT IGNORE INTO collaborateur_sousequipe (id_collaborateur, id_sous_equipe) VALUES ?',
    [values]
  )
}

// ---------- Gestion admin (page Utilisateurs) ----------

export async function getAllCollaborateurs() {
  const [rows] = await pool.query(`
    SELECT
      c.id_collaborateur, c.nom, c.email, c.identifiant_esprit, c.actif, c.date_creation,
      (SELECT GROUP_CONCAT(se.id_sous_equipe, ':', se.nom SEPARATOR '||')
         FROM collaborateur_sousequipe cs
         JOIN sous_equipe se ON se.id_sous_equipe = cs.id_sous_equipe
        WHERE cs.id_collaborateur = c.id_collaborateur) AS sous_equipes,
      (SELECT GROUP_CONCAT(up.id_up, ':', up.nom_up SEPARATOR '||')
         FROM collaborateur_equipe_hors_up cu
         JOIN equipe_hors_up up ON up.id_up = cu.id_up
        WHERE cu.id_collaborateur = c.id_collaborateur) AS equipes_hors_up
    FROM collaborateur c
    ORDER BY c.nom
  `)
  return rows
}

// IDs bruts des équipes (sous-équipes UP + équipes hors UP) auxquelles appartient un
// collaborateur — utilisé pour lister le pool de tâches non assignées qui lui sont
// ouvertes (voir taches.controller.js -> listTachesDisponibles).
export async function getEquipesIdsCollaborateur(idCollaborateur) {
  const [sousEquipes] = await pool.query(
    'SELECT id_sous_equipe FROM collaborateur_sousequipe WHERE id_collaborateur = ?',
    [idCollaborateur]
  )
  const [equipesHorsUp] = await pool.query(
    'SELECT id_up FROM collaborateur_equipe_hors_up WHERE id_collaborateur = ?',
    [idCollaborateur]
  )
  return {
    sousEquipeIds: sousEquipes.map((r) => r.id_sous_equipe),
    equipeHorsUpIds: equipesHorsUp.map((r) => r.id_up),
  }
}

export async function getCollaborateurById(id) {
  const [rows] = await pool.query('SELECT * FROM collaborateur WHERE id_collaborateur = ?', [id])
  return rows[0]
}

// Profil complet du collaborateur connecté (page "Mon profil") : identité, sous-équipes
// (UP + hors UP), responsable(s) de ces équipes, et préférences de compte.
export async function getMonProfil(id) {
  const [rows] = await pool.query(
    `SELECT
      c.id_collaborateur, c.nom, c.email, c.identifiant_esprit,
      c.notifications_email, c.profil_visible,
      (SELECT GROUP_CONCAT(DISTINCT se.nom SEPARATOR ', ')
         FROM collaborateur_sousequipe cs
         JOIN sous_equipe se ON se.id_sous_equipe = cs.id_sous_equipe
        WHERE cs.id_collaborateur = c.id_collaborateur) AS sous_equipes_up,
      (SELECT GROUP_CONCAT(DISTINCT eh.nom_up SEPARATOR ', ')
         FROM collaborateur_equipe_hors_up ceh
         JOIN equipe_hors_up eh ON eh.id_up = ceh.id_up
        WHERE ceh.id_collaborateur = c.id_collaborateur) AS equipes_hors_up,
      (SELECT GROUP_CONCAT(DISTINCT r.nom SEPARATOR ', ')
         FROM collaborateur_sousequipe cs
         JOIN sous_equipe se ON se.id_sous_equipe = cs.id_sous_equipe
         JOIN responsable r ON r.id_responsable = se.id_responsable
        WHERE cs.id_collaborateur = c.id_collaborateur) AS responsables_up,
      (SELECT GROUP_CONCAT(DISTINCT r2.nom SEPARATOR ', ')
         FROM collaborateur_equipe_hors_up ceh
         JOIN equipe_hors_up eh ON eh.id_up = ceh.id_up
         JOIN responsable r2 ON r2.id_responsable = eh.id_responsable
        WHERE ceh.id_collaborateur = c.id_collaborateur) AS responsables_hors_up
    FROM collaborateur c
    WHERE c.id_collaborateur = ?`,
    [id]
  )
  const row = rows[0]
  if (!row) return null

  // Fusionne UP + hors UP (équipes et responsables), en dédoublonnant les responsables
  // qui encadreraient à la fois une sous-équipe UP et une équipe hors UP du collaborateur.
  const joinUnique = (...groups) => {
    const seen = new Set()
    const out = []
    for (const g of groups) {
      if (!g) continue
      for (const v of g.split(', ')) {
        if (v && !seen.has(v)) { seen.add(v); out.push(v) }
      }
    }
    return out.length ? out.join(', ') : null
  }

  return {
    id: row.id_collaborateur,
    nom: row.nom,
    email: row.email,
    identifiant_esprit: row.identifiant_esprit,
    sous_equipes: joinUnique(row.sous_equipes_up, row.equipes_hors_up),
    responsables: joinUnique(row.responsables_up, row.responsables_hors_up),
    notifications_email: !!row.notifications_email,
    profil_visible: !!row.profil_visible,
  }
}

// Met à jour les préférences de compte (toggles de la page "Mon profil").
export async function updateMesPreferences(id, { notifications_email, profil_visible }) {
  const fields = []
  const values = []
  if (notifications_email !== undefined) { fields.push('notifications_email = ?'); values.push(notifications_email ? 1 : 0) }
  if (profil_visible !== undefined) { fields.push('profil_visible = ?'); values.push(profil_visible ? 1 : 0) }
  if (fields.length === 0) return getMonProfil(id)
  values.push(id)
  await pool.query(`UPDATE collaborateur SET ${fields.join(', ')} WHERE id_collaborateur = ?`, values)
  return getMonProfil(id)
}

export async function updateCollaborateur(id, data) {
  const fields = []
  const values = []
  for (const key of ['nom', 'email', 'identifiant_esprit', 'actif']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (fields.length === 0) return getCollaborateurById(id)
  values.push(id)
  await pool.query(`UPDATE collaborateur SET ${fields.join(', ')} WHERE id_collaborateur = ?`, values)
  return getCollaborateurById(id)
}

export async function deleteCollaborateur(id) {
  await pool.query('DELETE FROM collaborateur WHERE id_collaborateur = ?', [id])
}

// ---------- Mot de passe oublié ----------

export async function updateCollaborateurPassword(email, hashedPassword) {
  await pool.query('UPDATE collaborateur SET mot_de_passe = ? WHERE email = ?', [hashedPassword, email])
}

// Changement de mot de passe depuis "Mon profil" (self-service, par id — contrairement à
// updateCollaborateurPassword ci-dessus qui sert au flux "mot de passe oublié", par email).
export async function updateCollaborateurPasswordById(id, hashedPassword) {
  await pool.query('UPDATE collaborateur SET mot_de_passe = ? WHERE id_collaborateur = ?', [hashedPassword, id])
}

// Met à jour nom/email depuis "Mon profil" (édition self-service). L'unicité de l'email
// est vérifiée en amont par le contrôleur (findCollaborateurByEmailOrIdentifiant).
export async function updateMonIdentite(id, { nom, email }) {
  const fields = []
  const values = []
  if (nom !== undefined) { fields.push('nom = ?'); values.push(nom) }
  if (email !== undefined) { fields.push('email = ?'); values.push(email) }
  if (fields.length === 0) return getMonProfil(id)
  values.push(id)
  await pool.query(`UPDATE collaborateur SET ${fields.join(', ')} WHERE id_collaborateur = ?`, values)
  return getMonProfil(id)
}

// Crée un compte collaborateur à partir d'un compte responsable existant
// (mêmes identifiants de connexion — nom, email, identifiant_esprit, mot de passe déjà hashé).
// Symétrique de createResponsableFromCollaborateur : un responsable peut aussi être
// membre d'une sous-équipe / équipe hors UP, ce qui exige une ligne dans `collaborateur`
// (contrainte de clé étrangère sur collaborateur_sousequipe / collaborateur_equipe_hors_up).
export async function createCollaborateurFromResponsable({ nom, email, identifiant_esprit, mot_de_passe }) {
  const [result] = await pool.query(
    'INSERT INTO collaborateur (nom, email, identifiant_esprit, mot_de_passe) VALUES (?, ?, ?, ?)',
    [nom, email, identifiant_esprit, mot_de_passe]
  )
  return getCollaborateurById(result.insertId)
}