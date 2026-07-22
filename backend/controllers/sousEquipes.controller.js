import {
  getAllSousEquipes,
  getAllSousEquipesDetaillees,
  getSousEquipeMembres,
  getSousEquipeById,
  createSousEquipe,
  updateSousEquipe,
  deleteSousEquipe,
  addMembreToSousEquipe,
  removeMembreFromSousEquipe,
  getSousEquipesByResponsable,
  sousEquipeAppartientAuResponsable,
} from '../models/sousEquipe.model.js'
import { getResponsableById } from '../models/responsable.model.js'
import { sendResponsableAssignationEmail } from '../utils/Mailer.js'

// Liste simple (publique — utilisée par la page d'inscription)
export async function listSousEquipes(req, res) {
  try {
    const sousEquipes = await getAllSousEquipes()
    res.json(sousEquipes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Liste enrichie (admin) : responsable, membres, avancement
export async function listSousEquipesDetaillees(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const periode = annee_universitaire && semestre ? { annee_universitaire, semestre } : null
    const sousEquipes = await getAllSousEquipesDetaillees(periode)
    res.json(sousEquipes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function getSousEquipe(req, res) {
  try {
    const sousEquipe = await getSousEquipeById(req.params.id)
    if (!sousEquipe) return res.status(404).json({ message: 'Sous-équipe non trouvée' })
    const membres = await getSousEquipeMembres(req.params.id)
    res.json({ ...sousEquipe, membres })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Liste des membres d'une sous-équipe — ouverte à tout utilisateur authentifié
// (contrairement à getSousEquipe qui est réservé à l'admin), utilisée par le
// collaborateur pour choisir "le membre concerné" en cas de problème de
// coordination sur une de ses tâches.
export async function listMembresSousEquipe(req, res) {
  try {
    const membres = await getSousEquipeMembres(req.params.id)
    res.json(membres)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Sous-équipe(s) du responsable connecté — utilisée par son propre dashboard.
export async function listMesSousEquipes(req, res) {
  try {
    const sousEquipes = await getSousEquipesByResponsable(req.user.id)
    res.json(sousEquipes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function addSousEquipe(req, res) {
  try {
    const { nom } = req.body
    if (!nom) return res.status(400).json({ message: 'Le nom de la sous-équipe est requis.' })
    const created = await createSousEquipe(req.body)

    // Un responsable peut être choisi dès la création de la sous-équipe (et pas
    // seulement via une édition ultérieure) — on le notifie dans ce cas aussi.
    if (req.body.id_responsable) {
      const responsable = await getResponsableById(created.id_responsable)
      if (responsable) {
        sendResponsableAssignationEmail({
          to: responsable.email,
          responsableNom: responsable.nom,
          equipeNom: created.nom,
          typeEquipe: 'la sous-équipe',
        }).catch((err) => console.error('Erreur envoi email de désignation responsable:', err))
      }
    }

    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function editSousEquipe(req, res) {
  try {
    const before = await getSousEquipeById(req.params.id)
    const updated = await updateSousEquipe(req.params.id, req.body)

    // Nouvelle désignation (ou changement) de responsable : on notifie le
    // responsable par e-mail. On ne notifie pas si id_responsable est absent du
    // corps de la requête (édition d'un autre champ) ou inchangé. Number(...) car
    // le front envoie une chaîne ("12") alors que MySQL renvoie un entier.
    const idResponsableChanged =
      req.body.id_responsable !== undefined &&
      req.body.id_responsable &&
      Number(req.body.id_responsable) !== Number(before?.id_responsable)
    if (idResponsableChanged) {
      const responsable = await getResponsableById(updated.id_responsable)
      if (responsable) {
        sendResponsableAssignationEmail({
          to: responsable.email,
          responsableNom: responsable.nom,
          equipeNom: updated.nom,
          typeEquipe: 'la sous-équipe',
        }).catch((err) => console.error('Erreur envoi email de désignation responsable:', err))
      }
    }

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeSousEquipe(req, res) {
  try {
    await deleteSousEquipe(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function addMembre(req, res) {
  try {
    const { id_collaborateur } = req.body
    if (!id_collaborateur) return res.status(400).json({ message: 'id_collaborateur requis.' })
    if (req.user.role === 'responsable') {
      const ok = await sousEquipeAppartientAuResponsable(req.params.id, req.user.id)
      if (!ok) return res.status(403).json({ message: "Cette sous-équipe ne vous est pas assignée." })
    }
    await addMembreToSousEquipe(req.params.id, id_collaborateur)
    const membres = await getSousEquipeMembres(req.params.id)
    res.status(201).json(membres)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeMembre(req, res) {
  try {
    if (req.user.role === 'responsable') {
      const ok = await sousEquipeAppartientAuResponsable(req.params.id, req.user.id)
      if (!ok) return res.status(403).json({ message: "Cette sous-équipe ne vous est pas assignée." })
    }
    await removeMembreFromSousEquipe(req.params.id, req.params.idCollaborateur)
    const membres = await getSousEquipeMembres(req.params.id)
    res.json(membres)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}