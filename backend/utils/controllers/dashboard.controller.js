import pool from '../config/db.js'
import { getBornesPeriode } from '../utils/periode.js'

// Ces endpoints reproduisent les mesures/pages construites dans Power BI,
// mais directement dans l'app — chacun applique le même filtrage par rôle
// que la RLS Power BI (responsable → sa seule équipe, collaborateur → lui-même).

function periodeWhere(annee_universitaire, semestre, alias = 't') {
  if (!annee_universitaire) return { clause: '', params: [] }
  if (semestre) {
    const { debut, fin } = getBornesPeriode(annee_universitaire, semestre)
    return { clause: `AND ${alias}.date_creation >= ? AND ${alias}.date_creation < ?`, params: [debut, fin] }
  }
  const { debut, fin } = getBornesPeriode(annee_universitaire, 'annuel')
  return { clause: `AND ${alias}.date_creation >= ? AND ${alias}.date_creation < ?`, params: [debut, fin] }
}

/* ---------- Vue globale (Admin) ---------- */
export async function getVueGlobale(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const { clause, params } = periodeWhere(annee_universitaire, semestre)

    const [[kpis]] = await pool.query(`
      SELECT
        COUNT(*) AS total_taches,
        SUM(CASE WHEN statut = 'validee' THEN 1 ELSE 0 END) AS taches_validees,
        SUM(CASE WHEN statut != 'validee' AND date_echeance < CURDATE() THEN 1 ELSE 0 END) AS taches_retard,
        COUNT(DISTINCT id_collaborateur) AS collaborateurs_actifs,
        ROUND(SUM(CASE WHEN statut = 'validee' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS taux_avancement
      FROM tache t
      WHERE 1=1 ${clause}
    `, params)

    const [[{ nb_sous_equipes }]] = await pool.query(`SELECT COUNT(*) AS nb_sous_equipes FROM sous_equipe`)

    const [parStatut] = await pool.query(`
      SELECT statut, COUNT(*) AS total
      FROM tache t
      WHERE 1=1 ${clause}
      GROUP BY statut
    `, params)

    const [parSousEquipe] = await pool.query(`
      SELECT se.nom, t.statut, COUNT(*) AS total
      FROM tache t
      JOIN sous_equipe se ON se.id_sous_equipe = t.id_sous_equipe
      WHERE 1=1 ${clause}
      GROUP BY se.nom, t.statut
    `, params)

    res.json({ ...kpis, nb_sous_equipes, par_statut: parStatut, par_sous_equipe: parSousEquipe })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Par collaborateur (Admin) ---------- */
export async function getParCollaborateur(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const { clause, params } = periodeWhere(annee_universitaire, semestre)

    const [rows] = await pool.query(`
      SELECT
        c.identifiant_esprit, c.nom,
        COUNT(t.id_tache) AS total_taches,
        SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) AS taches_validees,
        ROUND(SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id_tache), 0), 2) AS taux_avancement,
        (SELECT ROUND(AVG(score), 2) FROM evaluation_score es WHERE es.id_collaborateur = c.id_collaborateur) AS score_moyen
      FROM collaborateur c
      LEFT JOIN tache t ON t.id_collaborateur = c.id_collaborateur ${clause.replace('t.', 't.')}
      GROUP BY c.id_collaborateur
      ORDER BY taux_avancement DESC
    `, params)

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Par sous-équipe (Admin, et Responsable filtré à sa propre équipe) ---------- */
export async function getParSousEquipe(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const { clause, params } = periodeWhere(annee_universitaire, semestre)

    let responsableFilterUP = ''
    let responsableFilterHorsUp = ''
    const responsableParamsUP = []
    const responsableParamsHorsUp = []
    if (req.user.role === 'responsable') {
      responsableFilterUP = 'AND se.id_responsable = ?'
      responsableFilterHorsUp = 'AND eh.id_responsable = ?'
      responsableParamsUP.push(req.user.id)
      responsableParamsHorsUp.push(req.user.id)
    }

    // nb_collaborateurs vient de la table de membership réelle de chaque type d'équipe
    // (collaborateur_sousequipe / collaborateur_equipe_hors_up), pas des tâches — un
    // membre sans tâche assignée reste un membre. Les équipes hors UP ont maintenant
    // leurs propres tâches (tache.id_equipe_hors_up), donc total_taches/taux sont
    // calculés en miroir du côté UP plutôt que fixés à 0/NULL.
    const [rows] = await pool.query(`
      SELECT
        'UP' AS type,
        se.nom AS sous_equipe, r.nom AS responsable,
        COUNT(t.id_tache) AS total_taches,
        ROUND(SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id_tache), 0), 2) AS taux_avancement,
        (SELECT COUNT(*) FROM collaborateur_sousequipe cs WHERE cs.id_sous_equipe = se.id_sous_equipe) AS nb_collaborateurs
      FROM sous_equipe se
      LEFT JOIN responsable r ON r.id_responsable = se.id_responsable
      LEFT JOIN tache t ON t.id_sous_equipe = se.id_sous_equipe ${clause}
      WHERE 1=1 ${responsableFilterUP}
      GROUP BY se.id_sous_equipe, se.nom, r.nom

      UNION ALL

      SELECT
        'Hors UP' AS type,
        eh.nom_up AS sous_equipe, r2.nom AS responsable,
        COUNT(t.id_tache) AS total_taches,
        ROUND(SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id_tache), 0), 2) AS taux_avancement,
        (SELECT COUNT(*) FROM collaborateur_equipe_hors_up c WHERE c.id_up = eh.id_up) AS nb_collaborateurs
      FROM equipe_hors_up eh
      LEFT JOIN responsable r2 ON r2.id_responsable = eh.id_responsable
      LEFT JOIN tache t ON t.id_equipe_hors_up = eh.id_up ${clause}
      WHERE 1=1 ${responsableFilterHorsUp}
      GROUP BY eh.id_up, eh.nom_up, r2.nom
    `, [...params, ...responsableParamsUP, ...params, ...responsableParamsHorsUp])

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- État d'avancement (Admin) ---------- */
export async function getEtatAvancement(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const { clause, params } = periodeWhere(annee_universitaire, semestre)

    const [parMois] = await pool.query(`
      SELECT DATE_FORMAT(date_validation, '%Y-%m') AS mois, COUNT(*) AS taches_validees
      FROM tache t
      WHERE statut = 'validee' AND date_validation IS NOT NULL ${clause}
      GROUP BY mois ORDER BY mois
    `, params)

    const [aVenir] = await pool.query(`
      SELECT t.titre, t.statut, t.date_echeance, c.nom AS collaborateur,
        COALESCE(se.nom, eh.nom_up) AS sous_equipe
      FROM tache t
      LEFT JOIN collaborateur c ON c.id_collaborateur = t.id_collaborateur
      LEFT JOIN sous_equipe se ON se.id_sous_equipe = t.id_sous_equipe
      LEFT JOIN equipe_hors_up eh ON eh.id_up = t.id_equipe_hors_up
      WHERE t.statut != 'validee' ${clause}
      ORDER BY t.date_echeance ASC
      LIMIT 20
    `, params)

    res.json({ par_mois: parMois, a_venir: aVenir })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

/* ---------- Mon espace (Collaborateur — toujours filtré sur req.user.id) ---------- */
export async function getMonEspace(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const { clause, params } = periodeWhere(annee_universitaire, semestre)

    const [[kpis]] = await pool.query(`
      SELECT
        COUNT(*) AS total_taches,
        SUM(CASE WHEN statut = 'validee' THEN 1 ELSE 0 END) AS taches_validees,
        ROUND(SUM(CASE WHEN statut = 'validee' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS taux_avancement
      FROM tache t
      WHERE id_collaborateur = ? ${clause}
    `, [req.user.id, ...params])

    const [[{ score_moyen }]] = await pool.query(
      `SELECT ROUND(AVG(score), 2) AS score_moyen FROM evaluation_score WHERE id_collaborateur = ?`,
      [req.user.id]
    )

    const [mesTaches] = await pool.query(`
      SELECT titre, statut, priorite, date_echeance
      FROM tache t WHERE id_collaborateur = ? ${clause}
      ORDER BY date_echeance ASC
    `, [req.user.id, ...params])

    const [mesDemandes] = await pool.query(`
      SELECT titre, statut, date_reception
      FROM demande_hors_equipe WHERE id_collaborateur = ?
      ORDER BY date_reception DESC
    `, [req.user.id])

    res.json({ ...kpis, score_moyen, mes_taches: mesTaches, mes_demandes: mesDemandes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}