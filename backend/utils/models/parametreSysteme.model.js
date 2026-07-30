import pool from '../config/db.js'

function parseAnnees(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mapParametres(row) {
  if (!row) return null
  return { ...row, annees_supplementaires: parseAnnees(row.annees_supplementaires) }
}

export async function getParametres() {
  const [rows] = await pool.query('SELECT * FROM parametre_systeme WHERE id = 1')
  if (rows[0]) return mapParametres(rows[0])
  // Crée la ligne par défaut si elle n'existe pas encore
  await pool.query('INSERT INTO parametre_systeme (id) VALUES (1)')
  const [created] = await pool.query('SELECT * FROM parametre_systeme WHERE id = 1')
  return mapParametres(created[0])
}

export async function updateParametres(data) {
  await getParametres() // s'assure que la ligne existe
  const fields = []
  const values = []
  for (const key of [
    'annee_universitaire',
    'semestre_actif',
    'mail_verification_auto',
    'validation_auto',
    'notifications_email',
    'sauvegarde_auto',
    'limite_taches_collaborateur',
  ]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(typeof data[key] === 'boolean' ? (data[key] ? 1 : 0) : data[key])
    }
  }
  if (fields.length === 0) return getParametres()
  await pool.query(`UPDATE parametre_systeme SET ${fields.join(', ')} WHERE id = 1`, values)
  return getParametres()
}

// Ajoute une année universitaire (ex. "2027/2028") à la liste des années
// sélectionnables dans le filtre, en plus de la fenêtre générée automatiquement
// autour de l'année courante. Dédupliquée, triée.
export async function ajouterAnneeSupplementaire(annee) {
  const actuel = await getParametres()
  const annees = new Set(actuel.annees_supplementaires)
  annees.add(annee)
  const triees = Array.from(annees).sort()
  await pool.query('UPDATE parametre_systeme SET annees_supplementaires = ? WHERE id = 1', [JSON.stringify(triees)])
  return getParametres()
}