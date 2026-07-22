import {
  getAllEquipesHorsUp,
  getAllEquipesHorsUpDetaillees,
  getEquipeHorsUpMembres,
  getEquipeHorsUpById,
  createEquipeHorsUp,
  updateEquipeHorsUp,
  deleteEquipeHorsUp,
  addMembreToEquipeHorsUp,
  removeMembreFromEquipeHorsUp,
} from '../models/equipeHorsUp.model.js'
import { getResponsableById } from '../models/responsable.model.js'
import { sendResponsableAssignationEmail } from '../utils/Mailer.js'

export async function listEquipesHorsUp(req, res) {
  try {
    const equipes = await getAllEquipesHorsUp()
    res.json(equipes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function listEquipesHorsUpDetaillees(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const periode = annee_universitaire && semestre ? { annee_universitaire, semestre } : null
    const equipes = await getAllEquipesHorsUpDetaillees(periode)
    res.json(equipes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function getEquipeHorsUp(req, res) {
  try {
    const equipe = await getEquipeHorsUpById(req.params.id)
    if (!equipe) return res.status(404).json({ message: 'Équipe hors UP non trouvée' })
    const membres = await getEquipeHorsUpMembres(req.params.id)
    res.json({ ...equipe, membres })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function addEquipeHorsUp(req, res) {
  try {
    const { nom } = req.body
    if (!nom) return res.status(400).json({ message: "Le nom de l'équipe est requis." })
    const created = await createEquipeHorsUp(req.body)

    // Un responsable peut être choisi dès la création de l'équipe (et pas
    // seulement via une édition ultérieure) — on le notifie dans ce cas aussi.
    if (req.body.id_responsable) {
      const responsable = await getResponsableById(created.id_responsable)
      if (responsable) {
        sendResponsableAssignationEmail({
          to: responsable.email,
          responsableNom: responsable.nom,
          equipeNom: created.nom_up,
          typeEquipe: "l'équipe hors UP",
        }).catch((err) => console.error('Erreur envoi email de désignation responsable:', err))
      }
    }

    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function editEquipeHorsUp(req, res) {
  try {
    const before = await getEquipeHorsUpById(req.params.id)
    const updated = await updateEquipeHorsUp(req.params.id, req.body)

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
          equipeNom: updated.nom_up,
          typeEquipe: "l'équipe hors UP",
        }).catch((err) => console.error('Erreur envoi email de désignation responsable:', err))
      }
    }

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeEquipeHorsUp(req, res) {
  try {
    await deleteEquipeHorsUp(req.params.id)
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
    await addMembreToEquipeHorsUp(req.params.id, id_collaborateur)
    const membres = await getEquipeHorsUpMembres(req.params.id)
    res.status(201).json(membres)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeMembre(req, res) {
  try {
    await removeMembreFromEquipeHorsUp(req.params.id, req.params.idCollaborateur)
    const membres = await getEquipeHorsUpMembres(req.params.id)
    res.json(membres)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}