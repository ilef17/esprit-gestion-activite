import pool from '../config/db.js'
import { getBornesPeriode } from '../utils/periode.js'

// Sous-requête ré-utilisée par les 3 lectures ci-dessous : agrège, pour une demande,
// les noms de TOUTES les équipes choisies (sous-équipes et/ou équipes hors UP), en plus
// des colonnes historiques sous_equipe_nom/up_nom qui ne couvrent qu'une seule équipe
// (gardées pour compatibilité avec les demandes créées avant le support multi-équipes).
const EQUIPES_NOMS_SUBQUERY = `(
  SELECT GROUP_CONCAT(
    CASE WHEN den.type_equipe = 'sous_equipe' THEN se2.nom ELSE up2.nom_up END
    ORDER BY den.type_equipe, den.id_equipe SEPARATOR ', '
  )
  FROM demande_equipe_notification den
  LEFT JOIN sous_equipe se2 ON se2.id_sous_equipe = den.id_equipe AND den.type_equipe = 'sous_equipe'
  LEFT JOIN equipe_hors_up up2 ON up2.id_up = den.id_equipe AND den.type_equipe = 'hors_up'
  WHERE den.id_demande = d.id_demande
)`

export async function getAllDemandes(periode) {
  const params = []
  let whereCond = ''
  if (periode?.annee_universitaire && periode?.semestre) {
    const { debut, fin } = getBornesPeriode(periode.annee_universitaire, periode.semestre)
    whereCond = ' WHERE d.date_reception >= ? AND d.date_reception < ?'
    params.push(debut, fin)
  }
  const [rows] = await pool.query(`
    SELECT d.*, c.nom AS collaborateur_nom, se.nom AS sous_equipe_nom, up.nom_up AS up_nom,
      ${EQUIPES_NOMS_SUBQUERY} AS equipes_noms
    FROM demande_hors_equipe d
    JOIN collaborateur c ON c.id_collaborateur = d.id_collaborateur
    LEFT JOIN sous_equipe se ON se.id_sous_equipe = d.id_sous_equipe
    LEFT JOIN equipe_hors_up up ON up.id_up = d.id_up
    ${whereCond}
    ORDER BY d.date_reception DESC
  `, params)
  return rows
}

// Activités hors-équipe du collaborateur connecté — utilisées par "Activités
// hors-équipe" côté collaborateur.
export async function getDemandesByCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT d.*, c.nom AS collaborateur_nom, se.nom AS sous_equipe_nom, up.nom_up AS up_nom,
       ${EQUIPES_NOMS_SUBQUERY} AS equipes_noms
     FROM demande_hors_equipe d
     JOIN collaborateur c ON c.id_collaborateur = d.id_collaborateur
     LEFT JOIN sous_equipe se ON se.id_sous_equipe = d.id_sous_equipe
     LEFT JOIN equipe_hors_up up ON up.id_up = d.id_up
     WHERE d.id_collaborateur = ?
     ORDER BY d.date_reception DESC`,
    [idCollaborateur]
  )
  return rows
}

export async function getDemandeById(id) {
  const [rows] = await pool.query(
    `SELECT d.*, c.nom AS collaborateur_nom, se.nom AS sous_equipe_nom, up.nom_up AS up_nom,
       ${EQUIPES_NOMS_SUBQUERY} AS equipes_noms
     FROM demande_hors_equipe d
     JOIN collaborateur c ON c.id_collaborateur = d.id_collaborateur
     LEFT JOIN sous_equipe se ON se.id_sous_equipe = d.id_sous_equipe
     LEFT JOIN equipe_hors_up up ON up.id_up = d.id_up
     WHERE d.id_demande = ?`,
    [id]
  )
  return rows[0]
}

export async function createDemande({ id_collaborateur, titre, description, date_debut, date_fin, id_sous_equipe, id_up, contact_responsable }) {
  const [result] = await pool.query(
    `INSERT INTO demande_hors_equipe
       (id_collaborateur, titre, description, date_debut, date_fin, id_sous_equipe, id_up, contact_responsable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_collaborateur, titre, description || null, date_debut || null, date_fin || null, id_sous_equipe || null, id_up || null, contact_responsable || null]
  )
  return getDemandeById(result.insertId)
}

// Associe une demande à plusieurs équipes (sous-équipes et/ou équipes hors UP) à
// prévenir — voir demandes.controller.js -> addDemande, qui notifie ensuite chaque
// responsable distinct des équipes retenues.
export async function addEquipesToDemande(idDemande, equipes) {
  if (!equipes || equipes.length === 0) return
  const values = equipes.map((e) => [idDemande, e.type, e.id])
  await pool.query(
    'INSERT IGNORE INTO demande_equipe_notification (id_demande, type_equipe, id_equipe) VALUES ?',
    [values]
  )
}

// Le collaborateur fait évoluer le statut de sa propre activité, comme pour une tâche
// (a_faire / en_cours / faite) — il n'y a plus de validation/refus à obtenir.
export async function updateStatutDemande(id, statut) {
  // Horodate automatiquement la validation quand le statut passe à "faite" (même
  // principe que les tâches — sert à verrouiller le statut une heure après).
  if (statut === 'faite') {
    await pool.query(`UPDATE demande_hors_equipe SET statut = ?, date_validation = NOW() WHERE id_demande = ?`, [statut, id])
  } else {
    await pool.query(`UPDATE demande_hors_equipe SET statut = ?, date_validation = NULL WHERE id_demande = ?`, [statut, id])
  }
  return getDemandeById(id)
}

export async function deleteDemande(id) {
  await pool.query('DELETE FROM demande_hors_equipe WHERE id_demande = ?', [id])
}