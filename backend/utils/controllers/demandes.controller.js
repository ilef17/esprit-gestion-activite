import {
  getAllDemandes,
  getDemandesByCollaborateur,
  getDemandeById,
  createDemande,
  addEquipesToDemande,
  updateStatutDemande,
  deleteDemande,
} from '../models/demandeHorsEquipe.model.js'
import { getMesSousEquipesAvecResponsable } from '../models/sousEquipe.model.js'
import { getMesEquipesHorsUpAvecResponsable } from '../models/equipeHorsUp.model.js'
import { creerNotification } from '../models/notification.model.js'

const STATUTS_AUTORISES = ['a_faire', 'en_cours', 'faite']

// Passé ce délai après passage à "faite", le statut est verrouillé — même règle que
// pour les tâches (voir taches.controller.js -> estVerrouilleeParDelai).
const DELAI_VERROUILLAGE_FAITE_MS = 60 * 60 * 1000
function estVerrouilleeParDelai(demande) {
  if (demande.statut !== 'faite' || !demande.date_validation) return false
  return Date.now() - new Date(demande.date_validation).getTime() > DELAI_VERROUILLAGE_FAITE_MS
}

// Vue admin (lecture seule) : toutes les activités hors-équipe déclarées.
export async function listDemandes(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const periode = annee_universitaire && semestre ? { annee_universitaire, semestre } : null
    const demandes = await getAllDemandes(periode)
    res.json(demandes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// "Activités hors-équipe" — le collaborateur connecté consulte les siennes.
export async function listMesDemandes(req, res) {
  try {
    const demandes = await getDemandesByCollaborateur(req.user.id)
    res.json(demandes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Le collaborateur déclare une activité réalisée en dehors de sa sous-équipe. Contrairement
// à l'ancien workflow "demande", il ne s'agit pas d'une permission à obtenir : chaque
// responsable des équipes choisies est simplement informé, l'activité est enregistrée
// directement avec le statut "à faire" (comme une tâche). Le collaborateur peut choisir
// plusieurs équipes (sous-équipes et/ou équipes hors UP) à la fois — chacune notifie son
// propre responsable, même si l'activité en elle-même se déroule en dehors de toutes.
export async function addDemande(req, res) {
  try {
    const id_collaborateur = req.user.role === 'collaborateur' ? req.user.id : req.body.id_collaborateur
    const { titre, description, date_debut, date_fin, equipes } = req.body
    if (!id_collaborateur || !String(titre || '').trim()) {
      return res.status(400).json({ message: 'id_collaborateur et titre requis.' })
    }
    if (date_debut && date_fin && new Date(date_debut) > new Date(date_fin)) {
      return res.status(400).json({ message: 'La date de début ne peut pas être après la date de fin.' })
    }

    const equipesDemandees = Array.isArray(equipes)
      ? equipes.filter((e) => e && (e.type === 'sous_equipe' || e.type === 'hors_up') && e.id)
      : []

    // On ne fait confiance qu'aux équipes dont le collaborateur est réellement membre —
    // même contrôle que l'ancien code à équipe unique, appliqué ici à chaque équipe
    // demandée. Toute équipe non trouvée (id invalide, ou appartenance à un autre
    // collaborateur) est silencieusement ignorée plutôt que de faire échouer l'activité.
    const mesSousEquipes = equipesDemandees.some((e) => e.type === 'sous_equipe')
      ? await getMesSousEquipesAvecResponsable(id_collaborateur)
      : []
    const mesEquipesHorsUp = equipesDemandees.some((e) => e.type === 'hors_up')
      ? await getMesEquipesHorsUpAvecResponsable(id_collaborateur)
      : []

    const equipesRetenues = []
    for (const e of equipesDemandees) {
      if (e.type === 'sous_equipe') {
        const equipe = mesSousEquipes.find((se) => se.id_sous_equipe === Number(e.id))
        if (equipe) {
          equipesRetenues.push({
            type: 'sous_equipe', id: equipe.id_sous_equipe, nom: equipe.nom,
            id_responsable: equipe.id_responsable, responsable_nom: equipe.responsable_nom,
          })
        }
      } else {
        const equipe = mesEquipesHorsUp.find((up) => up.id_up === Number(e.id))
        if (equipe) {
          equipesRetenues.push({
            type: 'hors_up', id: equipe.id_up, nom: equipe.nom,
            id_responsable: equipe.id_responsable, responsable_nom: equipe.responsable_nom,
          })
        }
      }
    }

    // Rétro-compatibilité de l'affichage existant (sous_equipe_nom/up_nom) : renseignées
    // seulement quand une seule équipe a été retenue, comme avant le support multi-équipes.
    const equipeUnique = equipesRetenues.length === 1 ? equipesRetenues[0] : null
    const contact_responsable = equipesRetenues.length
      ? [...new Set(equipesRetenues.map((e) => e.responsable_nom).filter(Boolean))].join(', ') || null
      : null

    const created = await createDemande({
      id_collaborateur,
      titre: titre.trim(),
      description: description ? String(description).trim() || null : null,
      date_debut,
      date_fin,
      id_sous_equipe: equipeUnique?.type === 'sous_equipe' ? equipeUnique.id : null,
      id_up: equipeUnique?.type === 'hors_up' ? equipeUnique.id : null,
      contact_responsable,
    })

    if (equipesRetenues.length) {
      await addEquipesToDemande(created.id_demande, equipesRetenues.map((e) => ({ type: e.type, id: e.id })))
    }

    // Une notification par responsable distinct, même s'il gère plusieurs des équipes
    // choisies (pas de doublon).
    const responsablesUniques = new Map()
    for (const e of equipesRetenues) {
      if (e.id_responsable && !responsablesUniques.has(e.id_responsable)) {
        responsablesUniques.set(e.id_responsable, e.responsable_nom)
      }
    }
    for (const id_responsable of responsablesUniques.keys()) {
      creerNotification({
        id_utilisateur: id_responsable,
        type_utilisateur: 'responsable',
        type: 'activite_hors_equipe',
        titre: 'Activité hors-équipe déclarée',
        message: `${created.collaborateur_nom} a signalé une activité en dehors de la sous-équipe : "${created.titre}"`,
        lien_page: 'horsequipe',
      }).catch((err) => console.error('Erreur notification (activité hors-équipe):', err))
    }

    res.status(201).json({ ...created, equipes: equipesRetenues })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Le collaborateur fait évoluer le statut de sa propre activité, comme pour une tâche.
export async function updateStatut(req, res) {
  try {
    const demande = await getDemandeById(req.params.id)
    if (!demande) return res.status(404).json({ message: 'Activité introuvable.' })
    if (req.user.role === 'collaborateur' && demande.id_collaborateur !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres activités.' })
    }
    if (estVerrouilleeParDelai(demande)) {
      return res.status(400).json({ message: 'Le statut "Faite" ne peut plus être modifié une heure après validation.' })
    }
    const { statut } = req.body
    if (!STATUTS_AUTORISES.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' })
    }
    const updated = await updateStatutDemande(req.params.id, statut)
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeDemande(req, res) {
  try {
    await deleteDemande(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}