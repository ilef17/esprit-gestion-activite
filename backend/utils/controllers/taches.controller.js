import {
  getAllTaches,
  getTacheById,
  createTache,
  createTachesEnLot,
  updateTache,
  deleteTache,
  getStatsImplication,
  getTachesNonAssigneesParEquipes,
  compterTachesActivesCollaborateur,
  choisirTachePourCollaborateur,
} from '../models/tache.model.js'
import { getSousEquipesByResponsable, sousEquipeAppartientAuResponsable, getSousEquipeMembres, getSousEquipeById } from '../models/sousEquipe.model.js'
import { getEquipesHorsUpByResponsable, equipeHorsUpAppartientAuResponsable, getEquipeHorsUpMembres, getEquipeHorsUpById } from '../models/equipeHorsUp.model.js'
import pool from '../config/db.js'
import { creerNotification, creerNotificationsEnMasse, getNomAuteur } from '../models/notification.model.js'
import { getEquipesIdsCollaborateur } from '../models/collaborateur.model.js'
import { getParametres } from '../models/parametreSysteme.model.js'
import { sendTachesDisponiblesEmail } from '../utils/Mailer.js'
import { recalculerScoreEquipeAuto } from '../models/evaluationScore.model.js'

// Nombre de mots maximum autorisé pour la raison d'un problème de coordination
// (cahier des charges : 46 mots).
const MAX_MOTS_RAISON_PROBLEME = 46
function compterMots(texte) {
  return String(texte || '').trim().split(/\s+/).filter(Boolean).length
}

// Une fois qu'une tâche est marquée "Faite", le collaborateur ne peut plus revenir en
// arrière au-delà d'une heure — passé ce délai le statut est verrouillé côté serveur
// (le menu déroulant disparaît aussi côté client, voir CollaborateurDashboard.jsx).
const DELAI_VERROUILLAGE_FAITE_MS = 60 * 60 * 1000
function estVerrouilleeParDelai(tache) {
  if (tache.statut !== 'validee' || !tache.date_validation) return false
  return Date.now() - new Date(tache.date_validation).getTime() > DELAI_VERROUILLAGE_FAITE_MS
}

// Notifie le collaborateur qu'une tâche vient de lui être assignée, en précisant
// qui l'a assignée (admin ou responsable — jamais un autre collaborateur).
async function notifierTacheAssignee(tache, auteur) {
  if (!tache?.id_collaborateur) return
  try {
    const nomAuteur = await getNomAuteur(auteur.role, auteur.id)
    await creerNotification({
      id_utilisateur: tache.id_collaborateur,
      type_utilisateur: 'collaborateur',
      type: 'tache_assignee',
      titre: 'Nouvelle tâche assignée',
      message: `${nomAuteur} vous a assigné la tâche "${tache.titre}"`,
      lien_page: 'taches',
    })
  } catch (err) {
    console.error('Erreur notification tâche assignée:', err)
  }
}

// Notifie le responsable de la sous-équipe qu'un collaborateur a signalé un
// problème de coordination sur une tâche — c'était l'événement manquant : aucun
// code n'envoyait jamais de notification à un responsable, uniquement aux
// collaborateurs (tache_assignee) et via les vœux pédagogiques.
async function notifierResponsableProblemeCoordination(tache, idCollaborateur) {
  if (!tache?.id_sous_equipe && !tache?.id_equipe_hors_up) return
  try {
    const equipe = tache.id_equipe_hors_up
      ? await getEquipeHorsUpById(tache.id_equipe_hors_up)
      : await getSousEquipeById(tache.id_sous_equipe)
    if (!equipe?.id_responsable) return
    const [rows] = await pool.query('SELECT nom FROM collaborateur WHERE id_collaborateur = ?', [idCollaborateur])
    const collaborateurNom = rows[0]?.nom || 'Un collaborateur'
    await creerNotification({
      id_utilisateur: equipe.id_responsable,
      type_utilisateur: 'responsable',
      type: 'probleme_coordination',
      titre: 'Problème de coordination signalé',
      message: `${collaborateurNom} a signalé un problème de coordination sur la tâche "${tache.titre}"${tache.raison_probleme ? ` : ${tache.raison_probleme}` : ''}`.slice(0, 255),
      lien_page: 'taches',
    })
  } catch (err) {
    console.error('Erreur notification problème de coordination:', err)
  }
}

// Notifie le responsable de la sous-équipe qu'un collaborateur vient de terminer
// (valider) une de ses tâches — même principe que ci-dessus.
async function notifierResponsableTacheValidee(tache, idCollaborateur) {
  if (!tache?.id_sous_equipe && !tache?.id_equipe_hors_up) return
  try {
    const equipe = tache.id_equipe_hors_up
      ? await getEquipeHorsUpById(tache.id_equipe_hors_up)
      : await getSousEquipeById(tache.id_sous_equipe)
    if (!equipe?.id_responsable) return
    const [rows] = await pool.query('SELECT nom FROM collaborateur WHERE id_collaborateur = ?', [idCollaborateur])
    const collaborateurNom = rows[0]?.nom || 'Un collaborateur'
    await creerNotification({
      id_utilisateur: equipe.id_responsable,
      type_utilisateur: 'responsable',
      type: 'tache_validee',
      titre: 'Tâche terminée',
      message: `${collaborateurNom} a terminé la tâche "${tache.titre}"`,
      lien_page: 'taches',
    })
  } catch (err) {
    console.error('Erreur notification tâche terminée:', err)
  }
}

// Notifie (in-app + e-mail) tous les membres d'une sous-équipe / équipe hors UP qu'une
// tâche non assignée vient d'être publiée par le responsable et peut être choisie
// librement dans le pool commun (voir listTachesDisponibles / choisirTache).
async function notifierEquipeNouvellesTaches(tache, auteur) {
  if (tache.id_collaborateur || (!tache.id_sous_equipe && !tache.id_equipe_hors_up)) return
  try {
    const equipe = tache.id_equipe_hors_up
      ? await getEquipeHorsUpById(tache.id_equipe_hors_up)
      : await getSousEquipeById(tache.id_sous_equipe)
    const equipeNom = equipe?.nom || equipe?.nom_up || 'votre équipe'
    const membres = tache.id_equipe_hors_up
      ? await getEquipeHorsUpMembres(tache.id_equipe_hors_up)
      : await getSousEquipeMembres(tache.id_sous_equipe)
    const actifs = membres.filter((m) => m.actif)
    if (actifs.length === 0) return

    await creerNotificationsEnMasse(actifs.map((m) => m.id_collaborateur), {
      type_utilisateur: 'collaborateur',
      type: 'taches_disponibles',
      titre: 'Nouvelles tâches à choisir',
      message: `Une nouvelle tâche ("${tache.titre}") est disponible pour ${equipeNom} — vous pouvez la choisir depuis "Mes tâches".`,
      lien_page: 'taches',
    })

    for (const m of actifs) {
      if (m.email && m.notifications_email) {
        sendTachesDisponiblesEmail({ to: m.email, nom: m.nom, equipeNom, nbTaches: 1 }).catch((err) => {
          console.error('Erreur e-mail tâches disponibles:', err)
        })
      }
    }
  } catch (err) {
    console.error('Erreur notification tâches disponibles:', err)
  }
}

// Variante "lot" de notifierEquipeNouvellesTaches : au lieu d'un envoi par tâche
// (un e-mail par tâche si le responsable en crée plusieurs à la suite), regroupe
// toute la liste publiée en une seule notification in-app + un seul e-mail par
// membre, avec le nombre total et les titres.
async function notifierEquipeNouvellesTachesEnLot(taches, auteur) {
  const premiere = taches[0]
  if (!premiere || (!premiere.id_sous_equipe && !premiere.id_equipe_hors_up)) return
  try {
    const equipe = premiere.id_equipe_hors_up
      ? await getEquipeHorsUpById(premiere.id_equipe_hors_up)
      : await getSousEquipeById(premiere.id_sous_equipe)
    const equipeNom = equipe?.nom || equipe?.nom_up || 'votre équipe'
    const membres = premiere.id_equipe_hors_up
      ? await getEquipeHorsUpMembres(premiere.id_equipe_hors_up)
      : await getSousEquipeMembres(premiere.id_sous_equipe)
    const actifs = membres.filter((m) => m.actif)
    if (actifs.length === 0) return

    const nbTaches = taches.length
    const titres = taches.map((t) => t.titre)
    const messageListe = nbTaches > 1
      ? `${nbTaches} nouvelles tâches sont disponibles pour ${equipeNom} — vous pouvez les choisir depuis "Mes tâches".`
      : `Une nouvelle tâche ("${titres[0]}") est disponible pour ${equipeNom} — vous pouvez la choisir depuis "Mes tâches".`

    await creerNotificationsEnMasse(actifs.map((m) => m.id_collaborateur), {
      type_utilisateur: 'collaborateur',
      type: 'taches_disponibles',
      titre: nbTaches > 1 ? 'Nouvelles tâches à choisir' : 'Nouvelle tâche à choisir',
      message: messageListe,
      lien_page: 'taches',
    })

    for (const m of actifs) {
      if (m.email && m.notifications_email) {
        sendTachesDisponiblesEmail({ to: m.email, nom: m.nom, equipeNom, nbTaches, titres }).catch((err) => {
          console.error('Erreur e-mail tâches disponibles (lot):', err)
        })
      }
    }
  } catch (err) {
    console.error('Erreur notification tâches disponibles (lot):', err)
  }
}

export async function listTaches(req, res) {
  try {
    const { collaborateur } = req.query
    let sousEquipeId = req.query.sous_equipe
    let equipeHorsUpId = req.query.equipe_hors_up

    // Un responsable ne voit que les tâches de sa (ses) propre(s) équipe(s).
    if (req.user.role === 'responsable') {
      if (equipeHorsUpId) {
        const ok = await equipeHorsUpAppartientAuResponsable(equipeHorsUpId, req.user.id)
        if (!ok) return res.status(403).json({ message: "Cette équipe hors UP ne vous est pas assignée." })
      } else {
        const mesEquipes = await getSousEquipesByResponsable(req.user.id)
        const mesIds = mesEquipes.map((e) => e.id)
        if (sousEquipeId && !mesIds.includes(Number(sousEquipeId))) {
          return res.status(403).json({ message: "Cette sous-équipe ne vous est pas assignée." })
        }
        if (!sousEquipeId) sousEquipeId = mesIds[0]
      }
    }

    const taches = await getAllTaches({ sousEquipeId, equipeHorsUpId, collaborateurId: collaborateur })
    res.json(taches)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// "Mes tâches" — le collaborateur connecté consulte ses propres tâches.
export async function listMesTaches(req, res) {
  try {
    const taches = await getAllTaches({ collaborateurId: req.user.id })
    res.json(taches)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function addTache(req, res) {
  try {
    const { titre } = req.body
    if (!titre) return res.status(400).json({ message: 'Le titre est requis.' })
    if (req.user.role === 'responsable') {
      const ok = req.body.id_equipe_hors_up
        ? await equipeHorsUpAppartientAuResponsable(req.body.id_equipe_hors_up, req.user.id)
        : await sousEquipeAppartientAuResponsable(req.body.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: "Cette équipe ne vous est pas assignée." })
    }
    const created = await createTache(req.body)
    if (created.id_collaborateur) {
      notifierTacheAssignee(created, { id: req.user.id, role: req.user.role })
    } else {
      notifierEquipeNouvellesTaches(created, { id: req.user.id, role: req.user.role })
    }
    // Le score d'implication dépend du nombre de tâches de l'équipe (moyenne) et,
    // si la tâche est directement assignée, du nombre de tâches du collaborateur —
    // on recalcule tout de suite plutôt que d'attendre une action manuelle.
    await recalculerScoreEquipeAuto(created.id_sous_equipe, 'up')
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Nombre max de tâches qu'un responsable peut publier en une seule liste — garde-fou
// raisonnable, évite un abus/typo (ex. collage accidentel d'un gros texte).
const MAX_TACHES_PAR_LOT = 50

// Publication groupée : le responsable crée une liste entière de tâches non
// assignées en un seul envoi. Toutes les tâches vont dans la même équipe, et
// l'équipe ne reçoit qu'une seule notification/e-mail récapitulatif (au lieu
// d'un par tâche avec addTache).
export async function addTachesEnLot(req, res) {
  try {
    const { taches } = req.body
    if (!Array.isArray(taches) || taches.length === 0) {
      return res.status(400).json({ message: 'La liste de tâches est vide.' })
    }
    if (taches.length > MAX_TACHES_PAR_LOT) {
      return res.status(400).json({ message: `Vous ne pouvez pas publier plus de ${MAX_TACHES_PAR_LOT} tâches en une seule liste.` })
    }
    const sansTitre = taches.some((t) => !String(t?.titre || '').trim())
    if (sansTitre) {
      return res.status(400).json({ message: 'Chaque tâche de la liste doit avoir un titre.' })
    }

    if (req.user.role === 'responsable') {
      const ok = req.body.id_equipe_hors_up
        ? await equipeHorsUpAppartientAuResponsable(req.body.id_equipe_hors_up, req.user.id)
        : await sousEquipeAppartientAuResponsable(req.body.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: "Cette équipe ne vous est pas assignée." })
    }

    const aCreer = taches.map((t) => ({
      titre: String(t.titre).trim(),
      description: t.description ? String(t.description).trim() : null,
      priorite: t.priorite || 'moyenne',
      date_echeance: t.date_echeance || null,
      id_collaborateur: null,
      id_sous_equipe: req.body.id_equipe_hors_up ? null : req.body.id_sous_equipe,
      id_equipe_hors_up: req.body.id_equipe_hors_up || null,
      statut: 'a_faire',
    }))
    const created = await createTachesEnLot(aCreer)
    notifierEquipeNouvellesTachesEnLot(created, { id: req.user.id, role: req.user.role })
    await recalculerScoreEquipeAuto(req.body.id_equipe_hors_up ? null : req.body.id_sous_equipe, 'up')
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Statuts que le collaborateur est autorisé à choisir lui-même pour ses tâches
// (cahier des charges : En cours, Faite, Problème de coordination).
const STATUTS_AUTORISES_COLLABORATEUR = ['en_cours', 'validee', 'probleme_coordination']

export async function editTache(req, res) {
  try {
    // Un responsable ne peut modifier que les tâches de sa propre sous-équipe
    // (titre, description, priorité, échéance, assignation, statut).
    if (req.user.role === 'responsable') {
      const tache = await getTacheById(req.params.id)
      if (!tache) return res.status(404).json({ message: 'Tâche introuvable.' })
      const ok = tache.id_equipe_hors_up
        ? await equipeHorsUpAppartientAuResponsable(tache.id_equipe_hors_up, req.user.id)
        : await sousEquipeAppartientAuResponsable(tache.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: 'Vous ne pouvez modifier que les tâches de votre équipe.' })
      const updated = await updateTache(req.params.id, req.body)
      if (req.body.id_collaborateur !== undefined && req.body.id_collaborateur !== tache.id_collaborateur) {
        notifierTacheAssignee(updated, { id: req.user.id, role: req.user.role })
      }
      await recalculerScoreEquipeAuto(tache.id_sous_equipe, 'up')
      return res.json(updated)
    }
    // Un collaborateur ne peut modifier que le statut (et le membre concerné en cas
    // de problème de coordination) de ses propres tâches — jamais le titre,
    // l'échéance ou la réaffectation à quelqu'un d'autre.
    if (req.user.role === 'collaborateur') {
      const tache = await getTacheById(req.params.id)
      if (!tache) return res.status(404).json({ message: 'Tâche introuvable.' })
      if (tache.id_collaborateur !== req.user.id) {
        return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres tâches.' })
      }
      if (estVerrouilleeParDelai(tache)) {
        return res.status(400).json({ message: 'Le statut "Faite" ne peut plus être modifié une heure après validation.' })
      }
      const { statut, membre_concerne, raison_probleme } = req.body
      if (!STATUTS_AUTORISES_COLLABORATEUR.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide.' })
      }
      if (statut === 'probleme_coordination') {
        if (!String(membre_concerne || '').trim()) {
          return res.status(400).json({ message: 'Veuillez préciser le membre concerné.' })
        }
        const raison = String(raison_probleme || '').trim()
        if (!raison) {
          return res.status(400).json({ message: 'Veuillez expliquer le problème.' })
        }
        if (compterMots(raison) > MAX_MOTS_RAISON_PROBLEME) {
          return res.status(400).json({ message: `La raison ne doit pas dépasser ${MAX_MOTS_RAISON_PROBLEME} mots.` })
        }
      }
      const updated = await updateTache(req.params.id, {
        statut,
        membre_concerne: statut === 'probleme_coordination' ? membre_concerne.trim() : null,
        raison_probleme: statut === 'probleme_coordination' ? String(raison_probleme).trim() : null,
      })
      if (statut === 'probleme_coordination') {
        notifierResponsableProblemeCoordination(updated, req.user.id)
      }
      if (statut === 'validee') {
        notifierResponsableTacheValidee(updated, req.user.id)
      }
      await recalculerScoreEquipeAuto(tache.id_sous_equipe, 'up')
      return res.json(updated)
    }
    const tacheAvant = await getTacheById(req.params.id)
    const updated = await updateTache(req.params.id, req.body)
    if (req.body.id_collaborateur !== undefined && req.body.id_collaborateur !== tacheAvant?.id_collaborateur) {
      notifierTacheAssignee(updated, { id: req.user.id, role: req.user.role })
    }
    await recalculerScoreEquipeAuto(tacheAvant?.id_sous_equipe, 'up')
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeTache(req, res) {
  try {
    const tache = await getTacheById(req.params.id)
    if (req.user.role === 'responsable') {
      if (!tache) return res.status(404).json({ message: 'Tâche introuvable.' })
      const ok = tache.id_equipe_hors_up
        ? await equipeHorsUpAppartientAuResponsable(tache.id_equipe_hors_up, req.user.id)
        : await sousEquipeAppartientAuResponsable(tache.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: 'Vous ne pouvez supprimer que les tâches de votre équipe.' })
    }
    await deleteTache(req.params.id)
    await recalculerScoreEquipeAuto(tache?.id_sous_equipe, 'up')
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Liste des tâches non assignées ouvertes au collaborateur connecté — celles de sa
// ou ses sous-équipes / équipes hors UP, qu'il peut choisir lui-même dans la limite
// de tâches actives autorisée.
export async function listTachesDisponibles(req, res) {
  try {
    const { sousEquipeIds, equipeHorsUpIds } = await getEquipesIdsCollaborateur(req.user.id)
    const taches = await getTachesNonAssigneesParEquipes({ sousEquipeIds, equipeHorsUpIds })
    const [parametres, actives] = await Promise.all([
      getParametres(),
      compterTachesActivesCollaborateur(req.user.id),
    ])
    const limite = parametres.limite_taches_collaborateur ?? 3
    res.json({ taches, limite, taches_actives: actives, places_restantes: Math.max(0, limite - actives) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Le collaborateur choisit lui-même une tâche non assignée du pool commun de son
// équipe, dans la limite de tâches "à faire"/"en cours" qu'il a le droit de cumuler.
export async function choisirTache(req, res) {
  try {
    const tache = await getTacheById(req.params.id)
    if (!tache) return res.status(404).json({ message: 'Tâche introuvable.' })
    if (tache.id_collaborateur) {
      return res.status(400).json({ message: 'Cette tâche a déjà été prise par quelqu\'un d\'autre.' })
    }
    const { sousEquipeIds, equipeHorsUpIds } = await getEquipesIdsCollaborateur(req.user.id)
    const appartient = tache.id_equipe_hors_up
      ? equipeHorsUpIds.includes(tache.id_equipe_hors_up)
      : sousEquipeIds.includes(tache.id_sous_equipe)
    if (!appartient) {
      return res.status(403).json({ message: "Cette tâche n'est pas disponible pour votre équipe." })
    }

    const parametres = await getParametres()
    const limite = parametres.limite_taches_collaborateur ?? 3
    const actives = await compterTachesActivesCollaborateur(req.user.id)
    if (actives >= limite) {
      return res.status(400).json({ message: `Vous avez déjà ${actives} tâche(s) en cours — terminez-en une avant d'en choisir une nouvelle (limite : ${limite}).` })
    }

    const assignee = await choisirTachePourCollaborateur(req.params.id, req.user.id)
    if (!assignee) {
      return res.status(409).json({ message: 'Cette tâche vient d\'être prise par quelqu\'un d\'autre.' })
    }
    // Le nombre de tâches du collaborateur (et donc son ratio d'implication) vient
    // de changer — recalcule immédiatement le score de son équipe.
    await recalculerScoreEquipeAuto(tache.id_sous_equipe, 'up')
    res.json(assignee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function listStatsImplication(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const stats = await getStatsImplication(annee_universitaire, semestre)
    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}