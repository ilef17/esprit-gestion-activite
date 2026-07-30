import pool from '../config/db.js'
import { getBornesPeriode } from '../utils/periode.js'

// Liste simple
export async function getAllEquipesHorsUp() {
  const [rows] = await pool.query('SELECT id_up, nom_up FROM equipe_hors_up ORDER BY nom_up')
  return rows
}

// Liste enrichie pour le dashboard admin : responsable, membres
export async function getAllEquipesHorsUpDetaillees(periode) {
  const params = []
  let membresCond = ''
  let whereCond = ''
  if (periode?.annee_universitaire && periode?.semestre) {
    const { debut, fin } = getBornesPeriode(periode.annee_universitaire, periode.semestre)
    membresCond = ' AND cu.date_affectation >= ? AND cu.date_affectation < ?'
    whereCond = ' WHERE up.date_creation >= ? AND up.date_creation < ?'
    params.push(debut, fin, debut, fin)
  }
  const [rows] = await pool.query(`
    SELECT
      up.id_up, up.nom_up, up.id_module, up.statut, up.ouverte_voeux, up.places_disponibles,
      r.id_responsable, r.nom AS responsable_nom,
      (SELECT COUNT(*) FROM collaborateur_equipe_hors_up cu WHERE cu.id_up = up.id_up${membresCond}) AS nb_membres
    FROM equipe_hors_up up
    LEFT JOIN responsable r ON r.id_responsable = up.id_responsable
    ${whereCond}
    ORDER BY up.nom_up
  `, params)

  return rows.map((row) => ({
    id: row.id_up,
    nom: row.nom_up,
    id_module: row.id_module || null,
    statut: row.statut === 'active' ? 'Active' : 'À suivre',
    ouverte_voeux: !!row.ouverte_voeux,
    places_disponibles: row.places_disponibles,
    responsable: row.responsable_nom || '—',
    id_responsable: row.id_responsable || null,
    membres_count: row.nb_membres,
    avancement: 0,
  }))
}

// Équipe(s) hors UP du responsable connecté — utilisée par son propre dashboard
// (miroir de getSousEquipesByResponsable dans sousEquipe.model.js).
export async function getEquipesHorsUpByResponsable(idResponsable) {
  const [rows] = await pool.query(`
    SELECT
      up.id_up, up.nom_up, up.id_module, up.statut,
      (SELECT COUNT(*) FROM collaborateur_equipe_hors_up cu WHERE cu.id_up = up.id_up) AS nb_membres
    FROM equipe_hors_up up
    WHERE up.id_responsable = ?
    ORDER BY up.nom_up
  `, [idResponsable])

  return rows.map((row) => ({
    id: row.id_up,
    nom: row.nom_up,
    id_module: row.id_module || null,
    statut: row.statut,
    nb_membres: row.nb_membres,
    // Les équipes hors-UP n'ont pas de tâches rattachées dans le schéma
    // (voir dashboard.controller.js) — pas de nb_taches/nb_taches_validees ici.
    type: 'hors_up',
  }))
}

// Vérifie qu'une équipe hors UP appartient bien au responsable donné, avant de le
// laisser en gérer les membres (miroir de sousEquipeAppartientAuResponsable).
export async function equipeHorsUpAppartientAuResponsable(idUp, idResponsable) {
  if (!idUp) return false
  const [rows] = await pool.query(
    'SELECT 1 FROM equipe_hors_up WHERE id_up = ? AND id_responsable = ? LIMIT 1',
    [idUp, idResponsable]
  )
  return rows.length > 0
}

export async function getEquipeHorsUpMembres(idUp) {
  const [rows] = await pool.query(
    `SELECT c.id_collaborateur, c.nom, c.email, c.actif, c.notifications_email
     FROM collaborateur_equipe_hors_up cu
     JOIN collaborateur c ON c.id_collaborateur = cu.id_collaborateur
     WHERE cu.id_up = ?
     ORDER BY c.nom`,
    [idUp]
  )
  return rows
}

export async function getEquipeHorsUpById(id) {
  const [rows] = await pool.query('SELECT * FROM equipe_hors_up WHERE id_up = ?', [id])
  return rows[0]
}

export async function createEquipeHorsUp({ nom, id_module, id_responsable, statut, ouverte_voeux, places_disponibles }) {
  const [result] = await pool.query(
    `INSERT INTO equipe_hors_up (nom_up, id_module, id_responsable, statut, ouverte_voeux, places_disponibles)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nom, id_module || null, id_responsable || null, statut || 'active', ouverte_voeux ? 1 : 0, places_disponibles || 0]
  )
  return { id_up: result.insertId, nom_up: nom, id_module, id_responsable, statut, ouverte_voeux, places_disponibles }
}

export async function updateEquipeHorsUp(id, data) {
  const fields = []
  const values = []
  const map = { nom: 'nom_up', id_module: 'id_module', id_responsable: 'id_responsable', statut: 'statut', ouverte_voeux: 'ouverte_voeux', places_disponibles: 'places_disponibles' }
  for (const key of Object.keys(map)) {
    if (data[key] !== undefined) {
      fields.push(`${map[key]} = ?`)
      values.push(key === 'ouverte_voeux' ? (data[key] ? 1 : 0) : data[key])
    }
  }
  if (fields.length === 0) return getEquipeHorsUpById(id)
  values.push(id)
  await pool.query(`UPDATE equipe_hors_up SET ${fields.join(', ')} WHERE id_up = ?`, values)
  return getEquipeHorsUpById(id)
}

export async function deleteEquipeHorsUp(id) {
  await pool.query('DELETE FROM equipe_hors_up WHERE id_up = ?', [id])
}

// Équipes hors UP du collaborateur connecté, avec le responsable de chacune — même
// usage que getMesSousEquipesAvecResponsable (sousEquipe.model.js) : le formulaire
// "Nouvelle activité hors-équipe" propose aussi ces équipes en plus des sous-équipes.
export async function getMesEquipesHorsUpAvecResponsable(idCollaborateur) {
  const [rows] = await pool.query(`
    SELECT up.id_up, up.nom_up AS nom, r.id_responsable, r.nom AS responsable_nom
    FROM collaborateur_equipe_hors_up cu
    JOIN equipe_hors_up up ON up.id_up = cu.id_up
    LEFT JOIN responsable r ON r.id_responsable = up.id_responsable
    WHERE cu.id_collaborateur = ?
    ORDER BY up.nom_up
  `, [idCollaborateur])
  return rows.map((row) => ({
    id_up: row.id_up,
    nom: row.nom,
    id_responsable: row.id_responsable || null,
    responsable_nom: row.responsable_nom || null,
  }))
}

export async function addMembreToEquipeHorsUp(idUp, idCollaborateur) {
  await pool.query(
    'INSERT IGNORE INTO collaborateur_equipe_hors_up (id_collaborateur, id_up) VALUES (?, ?)',
    [idCollaborateur, idUp]
  )
}

export async function removeMembreFromEquipeHorsUp(idUp, idCollaborateur) {
  await pool.query(
    'DELETE FROM collaborateur_equipe_hors_up WHERE id_up = ? AND id_collaborateur = ?',
    [idUp, idCollaborateur]
  )
}