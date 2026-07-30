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

// Table `annee_universitaire_creee` (voir migration_annee_universitaire_creee.sql /
// ensureAnneeUniversitaireSchema dans ensureSchema.js) : historique permanent, en
// base, de toutes les années universitaires qui ont un jour été créées/actives —
// la même table que celle ajoutée côté application desktop (JavaFX) du collègue,
// pour que les deux bases restent alignées. C'est elle qui corrige le bug où une
// année tout juste définie comme "période active" ne survivait pas à une
// déconnexion/reconnexion : avant, seule `annees_supplementaires` (colonne JSON)
// était utilisée pour peupler les sélecteurs Année, et `updateParametres` (appelé
// par "Rendre cette période active") ne l'alimentait jamais.
async function enregistrerAnneeCreee(annee) {
  if (!annee) return
  await pool.query('INSERT IGNORE INTO annee_universitaire_creee (annee) VALUES (?)', [annee])
}

async function getAnneesCreees() {
  const [rows] = await pool.query('SELECT annee FROM annee_universitaire_creee')
  return rows.map((r) => r.annee)
}

function mapParametres(row, anneesCreees = []) {
  if (!row) return null
  const annees = new Set([...parseAnnees(row.annees_supplementaires), ...anneesCreees])
  return { ...row, annees_supplementaires: Array.from(annees).sort() }
}

export async function getParametres() {
  const [rows] = await pool.query('SELECT * FROM parametre_systeme WHERE id = 1')
  const anneesCreees = await getAnneesCreees()
  if (rows[0]) return mapParametres(rows[0], anneesCreees)
  // Crée la ligne par défaut si elle n'existe pas encore
  await pool.query('INSERT INTO parametre_systeme (id) VALUES (1)')
  const [created] = await pool.query('SELECT * FROM parametre_systeme WHERE id = 1')
  return mapParametres(created[0], anneesCreees)
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
  // La période qu'on vient de rendre active doit rester disponible dans les
  // sélecteurs Année même après déconnexion/reconnexion — voir le commentaire
  // au-dessus de enregistrerAnneeCreee().
  if (data.annee_universitaire !== undefined) {
    await enregistrerAnneeCreee(data.annee_universitaire)
  }
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
  await enregistrerAnneeCreee(annee)
  return getParametres()
}