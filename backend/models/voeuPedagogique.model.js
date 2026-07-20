import pool from '../config/db.js'

// Les 8 questions sont fixes (non stockées en base) — seules les listes de choix
// (modules) et les réponses le sont. Le frontend affiche le texte des questions.

function parseJsonArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mapCampagne(row) {
  if (!row) return null
  return {
    id_campagne: row.id_campagne,
    titre: row.titre,
    statut: row.statut,
    choix_modules: parseJsonArray(row.choix_modules),
    choix_modules_alternance: parseJsonArray(row.choix_modules_alternance),
    choix_modules_international: parseJsonArray(row.choix_modules_international),
    choix_niveau: row.choix_niveau || '',
    choix_niveau_alternance: row.choix_niveau_alternance || '',
    choix_niveau_international: row.choix_niveau_international || '',
    date_creation: row.date_creation,
    date_publication: row.date_publication,
    date_cloture: row.date_cloture,
    nb_reponses: row.nb_reponses !== undefined ? Number(row.nb_reponses) : undefined,
  }
}

function mapReponse(row) {
  if (!row) return null
  return {
    id_reponse: row.id_reponse,
    id_campagne: row.id_campagne,
    id_collaborateur: row.id_collaborateur,
    collaborateur_nom: row.collaborateur_nom,
    collaborateur_email: row.collaborateur_email,
    modules_souhaites: parseJsonArray(row.modules_souhaites),
    alternance: row.alternance,
    modules_alternance: parseJsonArray(row.modules_alternance),
    international: row.international,
    modules_international: parseJsonArray(row.modules_international),
    heures_sup: row.heures_sup,
    nb_heures_sup: row.nb_heures_sup,
    commentaire: row.commentaire,
    date_soumission: row.date_soumission,
    date_modification: row.date_modification,
  }
}

function mapAffectation(row) {
  if (!row) return null
  return {
    id_affectation: row.id_affectation,
    id_reponse: row.id_reponse,
    module: row.module,
    type: row.type,
    niveau: row.niveau,
    classes: parseJsonArray(row.classes),
    date_affectation: row.date_affectation,
  }
}

// Un collaborateur peut être affecté à plusieurs modules pour une même réponse
// (cours normal + alternance, par exemple) — on rattache donc un tableau
// `affectations` à chaque réponse plutôt qu'un champ unique.
async function attachAffectations(reponses) {
  if (reponses.length === 0) return reponses
  const ids = reponses.map((r) => r.id_reponse)
  const [rows] = await pool.query(
    `SELECT * FROM affectation_voeu_pedagogique WHERE id_reponse IN (?) ORDER BY date_affectation`,
    [ids]
  )
  const byReponse = {}
  rows.forEach((row) => {
    if (!byReponse[row.id_reponse]) byReponse[row.id_reponse] = []
    byReponse[row.id_reponse].push(mapAffectation(row))
  })
  return reponses.map((r) => ({ ...r, affectations: byReponse[r.id_reponse] || [] }))
}

async function getReponseAvecAffectations(idReponse) {
  const [rows] = await pool.query(
    `SELECT r.*, c.nom AS collaborateur_nom, c.email AS collaborateur_email
     FROM reponse_voeu_pedagogique r
     JOIN collaborateur c ON c.id_collaborateur = r.id_collaborateur
     WHERE r.id_reponse = ?`,
    [idReponse]
  )
  if (!rows[0]) return null
  const [reponse] = await attachAffectations([mapReponse(rows[0])])
  return reponse
}

/* ---------- Admin : campagnes ---------- */

export async function listCampagnes() {
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM reponse_voeu_pedagogique r WHERE r.id_campagne = c.id_campagne) AS nb_reponses
     FROM campagne_voeux_pedagogiques c
     ORDER BY c.date_creation DESC`
  )
  return rows.map(mapCampagne)
}

export async function getCampagne(idCampagne) {
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM reponse_voeu_pedagogique r WHERE r.id_campagne = c.id_campagne) AS nb_reponses
     FROM campagne_voeux_pedagogiques c WHERE c.id_campagne = ?`,
    [idCampagne]
  )
  return mapCampagne(rows[0])
}

// Dernière campagne publiée (celle visible par les collaborateurs actuellement).
export async function getCampagnePubliee() {
  const [rows] = await pool.query(
    `SELECT * FROM campagne_voeux_pedagogiques WHERE statut = 'publiee' ORDER BY date_publication DESC LIMIT 1`
  )
  return mapCampagne(rows[0])
}

export async function createCampagne({
  titre, choix_modules, choix_modules_alternance, choix_modules_international,
  choix_niveau, choix_niveau_alternance, choix_niveau_international,
}) {
  const [result] = await pool.query(
    `INSERT INTO campagne_voeux_pedagogiques
      (titre, choix_modules, choix_modules_alternance, choix_modules_international,
       choix_niveau, choix_niveau_alternance, choix_niveau_international)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      titre || 'Vœux pédagogiques',
      JSON.stringify(choix_modules || []),
      JSON.stringify(choix_modules_alternance || []),
      JSON.stringify(choix_modules_international || []),
      choix_niveau || null,
      choix_niveau_alternance || null,
      choix_niveau_international || null,
    ]
  )
  return getCampagne(result.insertId)
}

export async function updateCampagneChoix(idCampagne, {
  titre, choix_modules, choix_modules_alternance, choix_modules_international,
  choix_niveau, choix_niveau_alternance, choix_niveau_international,
}) {
  await pool.query(
    `UPDATE campagne_voeux_pedagogiques
     SET titre = ?, choix_modules = ?, choix_modules_alternance = ?, choix_modules_international = ?,
         choix_niveau = ?, choix_niveau_alternance = ?, choix_niveau_international = ?
     WHERE id_campagne = ?`,
    [
      titre || 'Vœux pédagogiques',
      JSON.stringify(choix_modules || []),
      JSON.stringify(choix_modules_alternance || []),
      JSON.stringify(choix_modules_international || []),
      choix_niveau || null,
      choix_niveau_alternance || null,
      choix_niveau_international || null,
      idCampagne,
    ]
  )
  return getCampagne(idCampagne)
}

export async function publierCampagne(idCampagne) {
  await pool.query(
    `UPDATE campagne_voeux_pedagogiques SET statut = 'publiee', date_publication = NOW() WHERE id_campagne = ?`,
    [idCampagne]
  )
  return getCampagne(idCampagne)
}

export async function cloturerCampagne(idCampagne) {
  await pool.query(
    `UPDATE campagne_voeux_pedagogiques SET statut = 'cloturee', date_cloture = NOW() WHERE id_campagne = ?`,
    [idCampagne]
  )
  return getCampagne(idCampagne)
}

export async function deleteCampagneBrouillon(idCampagne) {
  await pool.query(`DELETE FROM campagne_voeux_pedagogiques WHERE id_campagne = ? AND statut = 'brouillon'`, [idCampagne])
}

/* ---------- Admin : consultation des réponses ---------- */

export async function getReponsesCampagne(idCampagne) {
  const [rows] = await pool.query(
    `SELECT r.*, c.nom AS collaborateur_nom, c.email AS collaborateur_email
     FROM reponse_voeu_pedagogique r
     JOIN collaborateur c ON c.id_collaborateur = r.id_collaborateur
     WHERE r.id_campagne = ?
     ORDER BY c.nom`,
    [idCampagne]
  )
  const reponses = rows.map(mapReponse)
  if (reponses.length === 0) return reponses

  const withAffectations = await attachAffectations(reponses)

  // Sous-équipe(s) de chaque collaborateur ayant répondu — utilisé pour le filtre
  // "par sous-équipe" côté admin. Un collaborateur peut appartenir à plusieurs.
  const idsCollaborateurs = withAffectations.map((r) => r.id_collaborateur)
  const [seRows] = await pool.query(
    `SELECT cs.id_collaborateur, se.id_sous_equipe, se.nom
     FROM collaborateur_sousequipe cs
     JOIN sous_equipe se ON se.id_sous_equipe = cs.id_sous_equipe
     WHERE cs.id_collaborateur IN (?)`,
    [idsCollaborateurs]
  )
  const sousEquipesParCollaborateur = {}
  seRows.forEach((row) => {
    if (!sousEquipesParCollaborateur[row.id_collaborateur]) sousEquipesParCollaborateur[row.id_collaborateur] = []
    sousEquipesParCollaborateur[row.id_collaborateur].push({ id: row.id_sous_equipe, nom: row.nom })
  })
  withAffectations.forEach((r) => { r.sous_equipes = sousEquipesParCollaborateur[r.id_collaborateur] || [] })
  return withAffectations
}

/* ---------- Collaborateur ---------- */

export async function getMaReponse(idCampagne, idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT * FROM reponse_voeu_pedagogique WHERE id_campagne = ? AND id_collaborateur = ?`,
    [idCampagne, idCollaborateur]
  )
  return mapReponse(rows[0])
}

export async function upsertMaReponse(idCampagne, idCollaborateur, payload) {
  const {
    modules_souhaites, alternance, modules_alternance,
    international, modules_international,
    heures_sup, nb_heures_sup, commentaire,
  } = payload

  const [existing] = await pool.query(
    `SELECT id_reponse FROM reponse_voeu_pedagogique WHERE id_campagne = ? AND id_collaborateur = ?`,
    [idCampagne, idCollaborateur]
  )

  const values = [
    JSON.stringify(modules_souhaites || []),
    alternance,
    JSON.stringify(modules_alternance || []),
    international,
    JSON.stringify(modules_international || []),
    heures_sup,
    heures_sup === 'oui' ? (nb_heures_sup || null) : null,
    commentaire || null,
  ]

  if (existing[0]) {
    await pool.query(
      `UPDATE reponse_voeu_pedagogique SET
        modules_souhaites = ?, alternance = ?, modules_alternance = ?,
        international = ?, modules_international = ?,
        heures_sup = ?, nb_heures_sup = ?, commentaire = ?,
        date_modification = NOW()
       WHERE id_campagne = ? AND id_collaborateur = ?`,
      [...values, idCampagne, idCollaborateur]
    )
  } else {
    await pool.query(
      `INSERT INTO reponse_voeu_pedagogique
        (id_campagne, id_collaborateur, modules_souhaites, alternance, modules_alternance,
         international, modules_international, heures_sup, nb_heures_sup, commentaire)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [idCampagne, idCollaborateur, ...values]
    )
  }

  return getMaReponse(idCampagne, idCollaborateur)
}

/* ---------- Admin : affectation d'un collaborateur à un module ---------- */
// Une réponse peut recevoir plusieurs affectations (le collaborateur peut
// enseigner plusieurs modules, dans une ou plusieurs catégories à la fois :
// cours normal, alternance, international).
export async function ajouterAffectation(idReponse, { module, type, niveau, classes }) {
  await pool.query(
    `INSERT INTO affectation_voeu_pedagogique (id_reponse, module, type, niveau, classes)
     VALUES (?, ?, ?, ?, ?)`,
    [idReponse, module, type || null, niveau || null, JSON.stringify(classes || [])]
  )
  return getReponseAvecAffectations(idReponse)
}

export async function supprimerAffectation(idAffectation) {
  const [rows] = await pool.query(
    `SELECT id_reponse FROM affectation_voeu_pedagogique WHERE id_affectation = ?`,
    [idAffectation]
  )
  if (!rows[0]) return null
  await pool.query(`DELETE FROM affectation_voeu_pedagogique WHERE id_affectation = ?`, [idAffectation])
  return getReponseAvecAffectations(rows[0].id_reponse)
}

/* ---------- Répartition équitable des tâches (par nombre de classes) ---------- */
// Pour chaque collaborateur donné, calcule son nombre de classes (dédupliquées
// entre toutes ses affectations de vœux pédagogiques, toutes campagnes confondues).
// Sert de "poids" pour répartir les tâches proportionnellement à la charge
// d'enseignement réelle de chacun (cahier des charges : pas de favoritisme).
export async function getNbClassesParCollaborateur(idsCollaborateurs) {
  const resultat = {}
  idsCollaborateurs.forEach((id) => { resultat[id] = 0 })
  if (idsCollaborateurs.length === 0) return resultat

  const [rows] = await pool.query(
    `SELECT r.id_collaborateur, a.classes
     FROM affectation_voeu_pedagogique a
     JOIN reponse_voeu_pedagogique r ON r.id_reponse = a.id_reponse
     WHERE r.id_collaborateur IN (?)`,
    [idsCollaborateurs]
  )

  const classesParCollaborateur = {}
  rows.forEach((row) => {
    if (!classesParCollaborateur[row.id_collaborateur]) classesParCollaborateur[row.id_collaborateur] = new Set()
    parseJsonArray(row.classes).forEach((c) => classesParCollaborateur[row.id_collaborateur].add(c))
  })

  idsCollaborateurs.forEach((id) => {
    resultat[id] = classesParCollaborateur[id] ? classesParCollaborateur[id].size : 0
  })
  return resultat
}

/* ---------- Collaborateur : consultation de ses affectations ---------- */
export async function getAffectationsCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT a.id_affectation, a.module, a.type, a.niveau, a.classes, a.date_affectation,
            c.titre AS campagne_titre
     FROM affectation_voeu_pedagogique a
     JOIN reponse_voeu_pedagogique r ON r.id_reponse = a.id_reponse
     JOIN campagne_voeux_pedagogiques c ON c.id_campagne = r.id_campagne
     WHERE r.id_collaborateur = ?
     ORDER BY a.date_affectation DESC`,
    [idCollaborateur]
  )
  return rows.map((row) => ({
    id_affectation: row.id_affectation,
    module: row.module,
    type: row.type,
    niveau: row.niveau,
    classes: parseJsonArray(row.classes),
    date_affectation: row.date_affectation,
    campagne_titre: row.campagne_titre,
  }))
}