import { getAllCollaborateurs } from '../models/collaborateur.model.js'
import {
  getExpertisesByCollaborateur,
  getExpertiseById,
  getAllExpertises,
  addExpertise as addExpertiseModel,
  deleteExpertise as deleteExpertiseModel,
} from '../models/Expertise.model.js'
import {
  getEncadrementsByCollaborateur,
  getEncadrementById,
  addEncadrement as addEncadrementModel,
  deleteEncadrement as deleteEncadrementModel,
  getAllEncadrements,
} from '../models/Encadrement.model.js'
import {
  getActivitesByCollaborateur,
  getActiviteById,
  getAllActivites,
  addActivite as addActiviteModel,
  deleteActivite as deleteActiviteModel,
  TYPES_ACTIVITE,
} from '../models/Activiteacademique.model.js'

// Les 7 catégories affichées en colonnes dans le tableau "Activité école" (admin) et
// "Tous les collègues" (collaborateur). `jury_soutenance` (ancien type) n'a pas sa
// propre colonne : les entrées existantes restent en base mais ne sont plus créées.
const CATEGORIES_ACTIVITE = [
  'membre_jury',
  'president_jury',
  'formation_ete',
  'formation_hiver',
  'formation_printemps',
  'evenement',
  'comite_organisation',
]

function toItem(row) {
  return { id: row.id_activite, titre: row.titre, role: row.role || null, date: row.date_activite }
}

// Les encadrements n'ont pas de date précise (seulement une année universitaire
// libre, ex. "2025/2026") : on l'expose telle quelle pour que le frontend puisse
// filtrer par année (le filtre Année/Semestre s'applique alors juste sur l'année,
// un encadrement restant visible sur les deux semestres de son année).
function toEncadrementItem(row) {
  return {
    id: row.id_encadrement,
    titre: row.nom_etudiant,
    sujet: row.sujet || null,
    type: row.type,
    annee_universitaire: row.annee_universitaire || null,
  }
}

// Liste des professeurs (collaborateurs) avec leur activité école complète, utilisée par
// le tableau principal de la page admin "Activité école" ET par "Tous les collègues"
// côté collaborateur (même endpoint, même données).
export async function listProfesseurs(req, res) {
  try {
    const [collaborateurs, allEncadrements, allExpertises, allActivites] = await Promise.all([
      getAllCollaborateurs(),
      getAllEncadrements(),
      getAllExpertises(),
      getAllActivites(),
    ])

    const encadrementMap = new Map()
    for (const e of allEncadrements) {
      if (!encadrementMap.has(e.id_collaborateur)) encadrementMap.set(e.id_collaborateur, [])
      encadrementMap.get(e.id_collaborateur).push(toEncadrementItem(e))
    }

    const expertisesMap = new Map()
    for (const e of allExpertises) {
      if (!expertisesMap.has(e.id_collaborateur)) expertisesMap.set(e.id_collaborateur, [])
      expertisesMap.get(e.id_collaborateur).push({ id: e.id_expertise, titre: e.libelle })
    }

    // Une entrée par (collaborateur, catégorie) pour retrouver rapidement les 7 tableaux
    // attendus par le tableau de bord admin (membre_jury, president_jury, formation_ete...).
    const activitesMap = new Map()
    for (const a of allActivites) {
      if (!CATEGORIES_ACTIVITE.includes(a.type)) continue // ignore l'ancien type jury_soutenance
      if (!activitesMap.has(a.id_collaborateur)) activitesMap.set(a.id_collaborateur, {})
      const bucket = activitesMap.get(a.id_collaborateur)
      if (!bucket[a.type]) bucket[a.type] = []
      bucket[a.type].push(toItem(a))
    }

    const professeurs = collaborateurs.map((c) => {
      const activites = activitesMap.get(c.id_collaborateur) || {}
      const encadrements = encadrementMap.get(c.id_collaborateur) || []
      const item = {
        id: c.id_collaborateur,
        nom: c.nom,
        email: c.email,
        actif: !!c.actif,
        // Conservé pour compatibilité (total non filtré) ; le frontend filtre désormais
        // sur `encadrements` (itemisé, avec annee_universitaire) pour respecter le filtre période.
        nb_etudiants_encadres: encadrements.length,
        encadrements,
        expertises: expertisesMap.get(c.id_collaborateur) || [],
      }
      for (const type of CATEGORIES_ACTIVITE) {
        item[type] = activites[type] || []
      }
      return item
    })

    res.json(professeurs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Construit le détail complet d'un collaborateur (expertises, encadrements, jury,
// formations, événements, comités) — partagé entre la vue admin (lecture seule, sauf
// expertises), la vue "Tous les collègues" du collaborateur (lecture seule) et sa propre
// page "Mon activité école" (tout modifiable).
async function buildDetail(idCollaborateur) {
  const [expertises, encadrements, activites] = await Promise.all([
    getExpertisesByCollaborateur(idCollaborateur),
    getEncadrementsByCollaborateur(idCollaborateur),
    getActivitesByCollaborateur(idCollaborateur),
  ])
  const detail = { expertises, encadrements }
  for (const type of CATEGORIES_ACTIVITE) {
    detail[type] = activites.filter((a) => a.type === type)
  }
  return detail
}

// Détail d'un professeur pour l'admin. L'admin peut gérer les expertises (voir plus bas)
// mais ne fait que consulter les encadrements / jurys / événements / comités : ceux-ci
// sont renseignés par le collaborateur lui-même, sur sa propre page.
export async function getProfesseurDetail(req, res) {
  try {
    res.json(await buildDetail(req.params.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// "Mon activité école" — le collaborateur connecté consulte (et gère) ses propres données.
// L'id vient toujours du token (req.user.id), jamais d'un paramètre fourni par le client.
export async function getMonActivite(req, res) {
  try {
    res.json(await buildDetail(req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- Expertise : ajoutée par l'admin (pour un professeur donné) ----------
export async function createExpertiseForProfesseur(req, res) {
  try {
    const { libelle } = req.body
    if (!libelle || !libelle.trim()) return res.status(400).json({ message: "Le libellé de l'expertise est requis." })
    const created = await addExpertiseModel(req.params.id, libelle.trim())
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- Expertise : ajoutée par le collaborateur pour lui-même ----------
export async function createMyExpertise(req, res) {
  try {
    const { libelle } = req.body
    if (!libelle || !libelle.trim()) return res.status(400).json({ message: "Le libellé de l'expertise est requis." })
    const created = await addExpertiseModel(req.user.id, libelle.trim())
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Suppression d'une expertise : l'admin peut retirer n'importe quelle expertise,
// le collaborateur ne peut retirer que les siennes.
export async function removeExpertise(req, res) {
  try {
    const expertise = await getExpertiseById(req.params.expertiseId)
    if (!expertise) return res.status(404).json({ message: 'Expertise introuvable.' })
    if (req.user.role === 'collaborateur' && expertise.id_collaborateur !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez retirer que vos propres expertises.' })
    }
    await deleteExpertiseModel(req.params.expertiseId)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- Encadrement : géré uniquement par le collaborateur concerné ----------
export async function createMyEncadrement(req, res) {
  try {
    const { nom_etudiant } = req.body
    if (!nom_etudiant || !nom_etudiant.trim()) return res.status(400).json({ message: "Le nom de l'étudiant est requis." })
    const created = await addEncadrementModel(req.user.id, req.body)
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeMyEncadrement(req, res) {
  try {
    const encadrement = await getEncadrementById(req.params.encadrementId)
    if (!encadrement) return res.status(404).json({ message: 'Encadrement introuvable.' })
    if (encadrement.id_collaborateur !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez retirer que vos propres encadrements.' })
    }
    await deleteEncadrementModel(req.params.encadrementId)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ---------- Activités académiques (jury de soutenance / événement / comité d'organisation) :
// gérées uniquement par le collaborateur concerné ----------
export async function createMyActivite(req, res) {
  try {
    const { type, titre } = req.body
    if (!TYPES_ACTIVITE.includes(type)) return res.status(400).json({ message: "Type d'activité invalide." })
    if (!titre || !titre.trim()) return res.status(400).json({ message: 'Le titre est requis.' })
    const created = await addActiviteModel(req.user.id, req.body)
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeMyActivite(req, res) {
  try {
    const activite = await getActiviteById(req.params.activiteId)
    if (!activite) return res.status(404).json({ message: 'Activité introuvable.' })
    if (activite.id_collaborateur !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez retirer que vos propres activités.' })
    }
    await deleteActiviteModel(req.params.activiteId)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}