import pool from '../config/db.js'
import { getStatsImplication } from '../models/tache.model.js'
import { getScores } from '../models/evaluationScore.model.js'

// Ces 4 endpoints exposent des données à plat (pas de JSON imbriqué), au
// format attendu par le connecteur "Web" de Power BI Desktop
// (Accueil > Obtenir les données > Web). Ils sont volontairement en lecture
// seule et protégés par clé API (voir middleware/apiKey.middleware.js) plutôt
// que par JWT, puisque Power BI Desktop ne peut pas exécuter le flux de
// connexion normal de l'app.

export async function feedCollaborateurs(req, res) {
  try {
    const stats = await getStatsImplication()
    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function feedSousEquipes(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        se.id_sous_equipe, se.nom, se.statut,
        r.nom AS responsable,
        COUNT(DISTINCT cs.id_collaborateur) AS membres_count,
        COUNT(t.id_tache) AS taches_total,
        SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) AS taches_validees,
        ROUND(100 * SUM(CASE WHEN t.statut = 'validee' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id_tache), 0)) AS avancement_pct
      FROM sous_equipe se
      LEFT JOIN responsable r ON r.id_responsable = se.id_responsable
      LEFT JOIN collaborateur_sousequipe cs ON cs.id_sous_equipe = se.id_sous_equipe
      LEFT JOIN tache t ON t.id_sous_equipe = se.id_sous_equipe
      GROUP BY se.id_sous_equipe
      ORDER BY se.nom
    `)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function feedTaches(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id_tache, t.titre, t.statut, t.date_creation, t.date_echeance, t.date_validation,
        c.nom AS collaborateur_nom,
        se.nom AS sous_equipe_nom
      FROM tache t
      LEFT JOIN collaborateur c ON c.id_collaborateur = t.id_collaborateur
      LEFT JOIN sous_equipe se ON se.id_sous_equipe = t.id_sous_equipe
      ORDER BY t.date_creation DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function feedEvaluations(req, res) {
  try {
    const scores = await getScores()
    // detail_json aplati ferait perdre son sens colonne par colonne dans Power BI —
    // on l'omet du flux, la note globale suffit pour un tableau croisé dynamique.
    res.json(scores.map(({ detail_json, ...rest }) => rest))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
