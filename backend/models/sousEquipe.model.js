import pool from '../config/db.js'
import { getBornesPeriode, getPeriodeActuelle } from '../utils/periode.js'

// Liste simple (utilisée par la page signup, publique)
export async function getAllSousEquipes() {
  const [rows] = await pool.query('SELECT id_sous_equipe, nom FROM sous_equipe ORDER BY nom')
  return rows
}

// Liste enrichie pour le dashboard admin : responsable, membres, avancement (%)
// `periode` = { annee_universitaire, semestre } optionnel — ne montre que les
// sous-équipes créées durant cette période, et ne compte que les membres qui
// l'ont rejointe durant cette même période (filtre Année/Semestre global).
export async function getAllSousEquipesDetaillees(periode) {
  const params = []
  let membresCond = ''
  let whereCond = ''
  if (periode?.annee_universitaire && periode?.semestre) {
    const { debut, fin } = getBornesPeriode(periode.annee_universitaire, periode.semestre)
    membresCond = ' AND cs.date_affectation >= ? AND cs.date_affectation < ?'
    whereCond = ' WHERE se.date_creation >= ? AND se.date_creation < ?'
    params.push(debut, fin, debut, fin)
  }
  const [rows] = await pool.query(`
    SELECT
      se.id_sous_equipe, se.nom, se.id_module, se.statut,
      r.id_responsable, r.nom AS responsable_nom,
      (SELECT COUNT(*) FROM collaborateur_sousequipe cs WHERE cs.id_sous_equipe = se.id_sous_equipe${membresCond}) AS nb_membres,
      (SELECT COUNT(*) FROM tache t WHERE t.id_sous_equipe = se.id_sous_equipe) AS nb_taches,
      (SELECT COUNT(*) FROM tache t WHERE t.id_sous_equipe = se.id_sous_equipe AND t.statut = 'validee') AS nb_taches_validees
    FROM sous_equipe se
    LEFT JOIN responsable r ON r.id_responsable = se.id_responsable
    ${whereCond}
    ORDER BY se.nom
  `, params)

  return rows.map((row) => ({
id: row.id_sous_equipe,
    nom: row.nom,
    id_module: row.id_module || null,
    statut: row.statut === 'active' ? 'Active' : 'À suivre',
    responsable: row.responsable_nom || '—',
    id_responsable: row.id_responsable || null,
    membres_count: row.nb_membres,
    avancement: row.nb_taches > 0 ? Math.round((row.nb_taches_validees / row.nb_taches) * 100) : 0,
  }))
}

// Sous-équipes gérées par un responsable connecté (dashboard "Responsable")
export async function getSousEquipesByResponsable(idResponsable) {
  const [rows] = await pool.query(`
    SELECT
      se.id_sous_equipe, se.nom, se.id_module, se.statut,
      (SELECT COUNT(*) FROM collaborateur_sousequipe cs WHERE cs.id_sous_equipe = se.id_sous_equipe) AS nb_membres,
      (SELECT COUNT(*) FROM tache t WHERE t.id_sous_equipe = se.id_sous_equipe) AS nb_taches,
      (SELECT COUNT(*) FROM tache t WHERE t.id_sous_equipe = se.id_sous_equipe AND t.statut = 'validee') AS nb_taches_validees
    FROM sous_equipe se
    WHERE se.id_responsable = ?
    ORDER BY se.nom
  `, [idResponsable])

  return rows.map((row) => ({
    id: row.id_sous_equipe,
    nom: row.nom,
    id_module: row.id_module || null,
    statut: row.statut === 'active' ? 'Active' : 'À suivre',
    membres_count: row.nb_membres,
    nb_taches: row.nb_taches,
    avancement: row.nb_taches > 0 ? Math.round((row.nb_taches_validees / row.nb_taches) * 100) : 0,
  }))
}

// Sous-équipes du collaborateur connecté, avec le responsable de chacune — utilisé par le
// formulaire "Nouvelle activité hors-équipe" : le collaborateur choisit la sous-équipe
// concernée et le responsable à prévenir s'affiche automatiquement.
export async function getMesSousEquipesAvecResponsable(idCollaborateur) {
  const [rows] = await pool.query(`
    SELECT se.id_sous_equipe, se.nom, r.id_responsable, r.nom AS responsable_nom
    FROM collaborateur_sousequipe cs
    JOIN sous_equipe se ON se.id_sous_equipe = cs.id_sous_equipe
    LEFT JOIN responsable r ON r.id_responsable = se.id_responsable
    WHERE cs.id_collaborateur = ?
    ORDER BY se.nom
  `, [idCollaborateur])
  return rows.map((row) => ({
    id_sous_equipe: row.id_sous_equipe,
    nom: row.nom,
    id_responsable: row.id_responsable || null,
    responsable_nom: row.responsable_nom || null,
  }))
}

// Vérifie qu'une sous-équipe appartient bien au responsable connecté, avant de
// le laisser gérer ses membres ou ses tâches (contrôle d'accès côté serveur).
export async function sousEquipeAppartientAuResponsable(idSousEquipe, idResponsable) {
  if (!idSousEquipe) return false
  const [rows] = await pool.query(
    'SELECT 1 FROM sous_equipe WHERE id_sous_equipe = ? AND id_responsable = ? LIMIT 1',
    [idSousEquipe, idResponsable]
  )
  return rows.length > 0
}

export async function getSousEquipeMembres(idSousEquipe) {
  const [rows] = await pool.query(
    `SELECT c.id_collaborateur, c.nom, c.email, c.actif, c.notifications_email
     FROM collaborateur_sousequipe cs
     JOIN collaborateur c ON c.id_collaborateur = cs.id_collaborateur
     WHERE cs.id_sous_equipe = ?
     ORDER BY c.nom`,
    [idSousEquipe]
  )
  return rows
}

export async function getSousEquipeById(id) {
  const [rows] = await pool.query('SELECT * FROM sous_equipe WHERE id_sous_equipe = ?', [id])
  return rows[0]
}

export async function createSousEquipe({ nom, id_module, id_responsable, statut }) {
  // Même règle que createDemande/createTache : sans période, la sous-équipe reste
  // invisible côté desktop, qui filtre par année/semestre actifs.
  const { annee_universitaire, semestre } = getPeriodeActuelle()
  const [result] = await pool.query(
    `INSERT INTO sous_equipe (nom, id_module, id_responsable, statut, annee_universitaire, semestre)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nom, id_module || null, id_responsable || null, statut || 'active', annee_universitaire, semestre]
  )
  return { id_sous_equipe: result.insertId, nom, id_module, id_responsable, statut, annee_universitaire, semestre }
}

export async function updateSousEquipe(id, data) {
  const fields = []
  const values = []
  for (const key of ['nom', 'id_module', 'id_responsable', 'statut'])  {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (fields.length === 0) return getSousEquipeById(id)
  values.push(id)
  await pool.query(`UPDATE sous_equipe SET ${fields.join(', ')} WHERE id_sous_equipe = ?`, values)
  return getSousEquipeById(id)
}

export async function deleteSousEquipe(id) {
  await pool.query('DELETE FROM sous_equipe WHERE id_sous_equipe = ?', [id])
}

export async function addMembreToSousEquipe(idSousEquipe, idCollaborateur) {
  await pool.query(
    'INSERT IGNORE INTO collaborateur_sousequipe (id_collaborateur, id_sous_equipe) VALUES (?, ?)',
    [idCollaborateur, idSousEquipe]
  )
}

export async function removeMembreFromSousEquipe(idSousEquipe, idCollaborateur) {
  await pool.query(
    'DELETE FROM sous_equipe WHERE id_sous_equipe = ? AND id_collaborateur = ?',
    [idSousEquipe, idCollaborateur]
  )
}