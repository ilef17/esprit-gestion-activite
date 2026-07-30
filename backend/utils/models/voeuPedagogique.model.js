import pool from '../config/db.js'

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
    date_creation: row.date_creation,
    date_publication: row.date_publication,
    date_cloture: row.date_cloture,
    nb_reponses: row.nb_reponses !== undefined ? Number(row.nb_reponses) : undefined,
  }
}

function mapQuestion(row) {
  if (!row) return null
  return {
    id_question: row.id_question,
    id_campagne: row.id_campagne,
    ordre: row.ordre,
    type: row.type,
    intitule: row.intitule,
    obligatoire: !!row.obligatoire,
    options: parseJsonArray(row.options),
  }
}

function mapModule(row) {
  if (!row) return null
  return {
    id_module: row.id_module,
    id_campagne: row.id_campagne,
    id_question: row.id_question,
    nom: row.nom,
    niveau: row.niveau || null,
    classes: parseJsonArray(row.classes),
  }
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

async function getQuestionsCampagne(idCampagne) {
  const [rows] = await pool.query(
    `SELECT * FROM question_voeu_pedagogique WHERE id_campagne = ? ORDER BY ordre, id_question`,
    [idCampagne]
  )
  return rows.map(mapQuestion)
}

async function getModulesCampagne(idCampagne) {
  const [rows] = await pool.query(
    `SELECT * FROM module_voeu_pedagogique WHERE id_campagne = ? ORDER BY nom`,
    [idCampagne]
  )
  return rows.map(mapModule)
}

// Vue complète d'une campagne : header + questions + modules, utilisée aussi
// bien côté admin (édition) que côté collaborateur (formulaire à remplir).
export async function getCampagne(idCampagne) {
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM reponse_voeu_pedagogique r WHERE r.id_campagne = c.id_campagne) AS nb_reponses
     FROM campagne_voeux_pedagogiques c WHERE c.id_campagne = ?`,
    [idCampagne]
  )
  if (!rows[0]) return null
  const campagne = mapCampagne(rows[0])
  const [questions, modules] = await Promise.all([
    getQuestionsCampagne(idCampagne),
    getModulesCampagne(idCampagne),
  ])
  return { ...campagne, questions, modules }
}

// Dernière campagne publiée (celle visible par les collaborateurs actuellement).
export async function getCampagnePubliee() {
  const [rows] = await pool.query(
    `SELECT id_campagne FROM campagne_voeux_pedagogiques WHERE statut = 'publiee' ORDER BY date_publication DESC LIMIT 1`
  )
  if (!rows[0]) return null
  return getCampagne(rows[0].id_campagne)
}

export async function createCampagne({ titre }) {
  const [result] = await pool.query(
    `INSERT INTO campagne_voeux_pedagogiques (titre) VALUES (?)`,
    [titre || 'Vœux pédagogiques']
  )
  return getCampagne(result.insertId)
}

export async function updateCampagneTitre(idCampagne, { titre }) {
  await pool.query(`UPDATE campagne_voeux_pedagogiques SET titre = ? WHERE id_campagne = ?`, [
    titre || 'Vœux pédagogiques',
    idCampagne,
  ])
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

/* ---------- Admin : construction du formulaire (questions) ---------- */

export async function ajouterQuestion(idCampagne, { type, intitule, obligatoire, options }) {
  const [[{ maxOrdre }]] = await pool.query(
    `SELECT COALESCE(MAX(ordre), -1) AS maxOrdre FROM question_voeu_pedagogique WHERE id_campagne = ?`,
    [idCampagne]
  )
  await pool.query(
    `INSERT INTO question_voeu_pedagogique (id_campagne, ordre, type, intitule, obligatoire, options)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idCampagne, maxOrdre + 1, type, intitule, obligatoire ? 1 : 0, JSON.stringify(options || [])]
  )
  return getCampagne(idCampagne)
}

export async function modifierQuestion(idQuestion, { type, intitule, obligatoire, options }) {
  const [rows] = await pool.query(`SELECT id_campagne FROM question_voeu_pedagogique WHERE id_question = ?`, [idQuestion])
  if (!rows[0]) return null
  await pool.query(
    `UPDATE question_voeu_pedagogique SET type = ?, intitule = ?, obligatoire = ?, options = ? WHERE id_question = ?`,
    [type, intitule, obligatoire ? 1 : 0, JSON.stringify(options || []), idQuestion]
  )
  return getCampagne(rows[0].id_campagne)
}

export async function supprimerQuestion(idQuestion) {
  const [rows] = await pool.query(`SELECT id_campagne FROM question_voeu_pedagogique WHERE id_question = ?`, [idQuestion])
  if (!rows[0]) return null
  await pool.query(`DELETE FROM question_voeu_pedagogique WHERE id_question = ?`, [idQuestion])
  return getCampagne(rows[0].id_campagne)
}

// Réordonne toutes les questions d'une campagne selon le tableau d'ids fourni.
export async function reordonnerQuestions(idCampagne, idsOrdonnes) {
  await Promise.all(
    idsOrdonnes.map((id, index) =>
      pool.query(`UPDATE question_voeu_pedagogique SET ordre = ? WHERE id_question = ? AND id_campagne = ?`, [
        index,
        id,
        idCampagne,
      ])
    )
  )
  return getCampagne(idCampagne)
}

/* ---------- Admin : construction du formulaire (modules + classes) ---------- */

export async function ajouterModule(idCampagne, { id_question, nom, niveau, classes }) {
  await pool.query(
    `INSERT INTO module_voeu_pedagogique (id_campagne, id_question, nom, niveau, classes) VALUES (?, ?, ?, ?, ?)`,
    [idCampagne, id_question, nom, niveau || null, JSON.stringify(classes || [])]
  )
  return getCampagne(idCampagne)
}

export async function modifierModule(idModule, { nom, niveau, classes }) {
  const [rows] = await pool.query(`SELECT id_campagne FROM module_voeu_pedagogique WHERE id_module = ?`, [idModule])
  if (!rows[0]) return null
  await pool.query(`UPDATE module_voeu_pedagogique SET nom = ?, niveau = ?, classes = ? WHERE id_module = ?`, [
    nom,
    niveau || null,
    JSON.stringify(classes || []),
    idModule,
  ])
  return getCampagne(rows[0].id_campagne)
}

export async function supprimerModule(idModule) {
  const [rows] = await pool.query(`SELECT id_campagne FROM module_voeu_pedagogique WHERE id_module = ?`, [idModule])
  if (!rows[0]) return null
  await pool.query(`DELETE FROM module_voeu_pedagogique WHERE id_module = ?`, [idModule])
  return getCampagne(rows[0].id_campagne)
}

/* ---------- Admin : consultation des réponses ---------- */

async function attachDetails(reponses) {
  if (reponses.length === 0) return reponses
  const ids = reponses.map((r) => r.id_reponse)
  const [rows] = await pool.query(
    `SELECT * FROM reponse_detail_voeu_pedagogique WHERE id_reponse IN (?)`,
    [ids]
  )
  const byReponse = {}
  rows.forEach((row) => {
    if (!byReponse[row.id_reponse]) byReponse[row.id_reponse] = {}
    let valeur = row.valeur
    if (typeof valeur === 'string') {
      try { valeur = JSON.parse(valeur) } catch { /* garde la chaîne brute */ }
    }
    byReponse[row.id_reponse][row.id_question] = valeur
  })
  return reponses.map((r) => ({ ...r, reponses_par_question: byReponse[r.id_reponse] || {} }))
}

export async function getReponsesCampagne(idCampagne) {
  const [rows] = await pool.query(
    `SELECT r.*, c.nom AS collaborateur_nom, c.email AS collaborateur_email
     FROM reponse_voeu_pedagogique r
     JOIN collaborateur c ON c.id_collaborateur = r.id_collaborateur
     WHERE r.id_campagne = ?
     ORDER BY c.nom`,
    [idCampagne]
  )
  const reponses = rows.map((row) => ({
    id_reponse: row.id_reponse,
    id_campagne: row.id_campagne,
    id_collaborateur: row.id_collaborateur,
    collaborateur_nom: row.collaborateur_nom,
    collaborateur_email: row.collaborateur_email,
    date_soumission: row.date_soumission,
    date_modification: row.date_modification,
  }))
  if (reponses.length === 0) return reponses

  const withDetails = await attachDetails(reponses)

  // Sous-équipe(s) de chaque collaborateur ayant répondu — utilisé pour le filtre
  // "par sous-équipe" côté admin (visualisation uniquement).
  const idsCollaborateurs = withDetails.map((r) => r.id_collaborateur)
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
  withDetails.forEach((r) => { r.sous_equipes = sousEquipesParCollaborateur[r.id_collaborateur] || [] })
  return withDetails
}

/* ---------- Collaborateur ---------- */

export async function getMaReponse(idCampagne, idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT * FROM reponse_voeu_pedagogique WHERE id_campagne = ? AND id_collaborateur = ?`,
    [idCampagne, idCollaborateur]
  )
  if (!rows[0]) return null
  const [reponse] = await attachDetails([
    {
      id_reponse: rows[0].id_reponse,
      id_campagne: rows[0].id_campagne,
      id_collaborateur: rows[0].id_collaborateur,
      date_soumission: rows[0].date_soumission,
      date_modification: rows[0].date_modification,
    },
  ])
  return reponse
}

// `reponsesParQuestion` : { [id_question]: valeur }
export async function upsertMaReponse(idCampagne, idCollaborateur, reponsesParQuestion) {
  const [existing] = await pool.query(
    `SELECT id_reponse FROM reponse_voeu_pedagogique WHERE id_campagne = ? AND id_collaborateur = ?`,
    [idCampagne, idCollaborateur]
  )

  let idReponse
  if (existing[0]) {
    idReponse = existing[0].id_reponse
    await pool.query(`UPDATE reponse_voeu_pedagogique SET date_modification = NOW() WHERE id_reponse = ?`, [idReponse])
  } else {
    const [result] = await pool.query(
      `INSERT INTO reponse_voeu_pedagogique (id_campagne, id_collaborateur) VALUES (?, ?)`,
      [idCampagne, idCollaborateur]
    )
    idReponse = result.insertId
  }

  const entries = Object.entries(reponsesParQuestion)
  for (const [idQuestion, valeur] of entries) {
    await pool.query(
      `INSERT INTO reponse_detail_voeu_pedagogique (id_reponse, id_question, valeur)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)`,
      [idReponse, idQuestion, JSON.stringify(valeur)]
    )
  }

  return getMaReponse(idCampagne, idCollaborateur)
}

/* ---------- Admin : affectation des classes ---------- */

// Vue "pool" pour la page d'affectation : pour chaque module de la campagne,
// la liste des classes encore disponibles et celles déjà affectées (avec à qui).
export async function getPoolAffectation(idCampagne) {
  const modules = await getModulesCampagne(idCampagne)
  if (modules.length === 0) return []

  const idsModules = modules.map((m) => m.id_module)
  const [affectations] = await pool.query(
    `SELECT a.id_affectation, a.id_module, a.classe, a.id_reponse, a.date_affectation,
            r.id_collaborateur, c.nom AS collaborateur_nom
     FROM affectation_voeu_pedagogique a
     JOIN reponse_voeu_pedagogique r ON r.id_reponse = a.id_reponse
     JOIN collaborateur c ON c.id_collaborateur = r.id_collaborateur
     WHERE a.id_module IN (?)`,
    [idsModules]
  )
  const affectationsParModule = {}
  affectations.forEach((row) => {
    if (!affectationsParModule[row.id_module]) affectationsParModule[row.id_module] = []
    affectationsParModule[row.id_module].push({
      id_affectation: row.id_affectation,
      classe: row.classe,
      id_reponse: row.id_reponse,
      collaborateur_nom: row.collaborateur_nom,
      date_affectation: row.date_affectation,
    })
  })

  return modules.map((m) => {
    const affectees = affectationsParModule[m.id_module] || []
    const classesAffectees = new Set(affectees.map((a) => a.classe))
    return {
      id_module: m.id_module,
      id_question: m.id_question,
      nom: m.nom,
      niveau: m.niveau,
      classes_disponibles: m.classes.filter((cl) => !classesAffectees.has(cl)),
      classes_affectees: affectees,
    }
  })
}

// Utilisé pour notifier le bon collaborateur après une affectation.
export async function getInfosReponse(idReponse) {
  const [rows] = await pool.query(
    `SELECT r.id_collaborateur FROM reponse_voeu_pedagogique r WHERE r.id_reponse = ?`,
    [idReponse]
  )
  if (!rows[0]) return null
  return { id_collaborateur: rows[0].id_collaborateur }
}

export async function affecterClasse({ id_reponse, id_module, classe }) {
  await pool.query(
    `INSERT INTO affectation_voeu_pedagogique (id_reponse, id_module, classe) VALUES (?, ?, ?)`,
    [id_reponse, id_module, classe]
  )
}

export async function retirerAffectation(idAffectation) {
  const [rows] = await pool.query(
    `SELECT a.*, r.id_campagne FROM affectation_voeu_pedagogique a
     JOIN reponse_voeu_pedagogique r ON r.id_reponse = a.id_reponse
     WHERE a.id_affectation = ?`,
    [idAffectation]
  )
  if (!rows[0]) return null
  await pool.query(`DELETE FROM affectation_voeu_pedagogique WHERE id_affectation = ?`, [idAffectation])
  return rows[0]
}

/* ---------- Collaborateur : consultation de ses classes affectées ---------- */
export async function getClassesAffecteesCollaborateur(idCollaborateur) {
  const [rows] = await pool.query(
    `SELECT a.id_affectation, a.classe, a.date_affectation,
            m.nom AS module, m.niveau AS niveau, cg.titre AS campagne_titre
     FROM affectation_voeu_pedagogique a
     JOIN module_voeu_pedagogique m ON m.id_module = a.id_module
     JOIN reponse_voeu_pedagogique r ON r.id_reponse = a.id_reponse
     JOIN campagne_voeux_pedagogiques cg ON cg.id_campagne = r.id_campagne
     WHERE r.id_collaborateur = ?
     ORDER BY a.date_affectation DESC`,
    [idCollaborateur]
  )
  return rows.map((row) => ({
    id_affectation: row.id_affectation,
    module: row.module,
    niveau: row.niveau,
    classe: row.classe,
    date_affectation: row.date_affectation,
    campagne_titre: row.campagne_titre,
  }))
}