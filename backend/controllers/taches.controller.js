import {
  getAllTaches,
  getTacheById,
  createTache,
  updateTache,
  deleteTache,
  getStatsImplication,
  getTachesNonAssignees,
} from '../models/tache.model.js'
import { getSousEquipesByResponsable, sousEquipeAppartientAuResponsable, getSousEquipeMembres, getSousEquipeById } from '../models/sousEquipe.model.js'
import pool from '../config/db.js'
import { getNbClassesParCollaborateur } from '../models/voeuPedagogique.model.js'
import { creerNotification, getNomAuteur } from '../models/notification.model.js'

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
  if (!tache?.id_sous_equipe) return
  try {
    const sousEquipe = await getSousEquipeById(tache.id_sous_equipe)
    if (!sousEquipe?.id_responsable) return
    const [rows] = await pool.query('SELECT nom FROM collaborateur WHERE id_collaborateur = ?', [idCollaborateur])
    const collaborateurNom = rows[0]?.nom || 'Un collaborateur'
    await creerNotification({
      id_utilisateur: sousEquipe.id_responsable,
      type_utilisateur: 'responsable',
      type: 'probleme_coordination',
      titre: 'Problème de coordination signalé',
      message: `${collaborateurNom} a signalé un problème de coordination sur la tâche "${tache.titre}"`,
      lien_page: 'taches',
    })
  } catch (err) {
    console.error('Erreur notification problème de coordination:', err)
  }
}

// Notifie le responsable de la sous-équipe qu'un collaborateur vient de terminer
// (valider) une de ses tâches — même principe que ci-dessus.
async function notifierResponsableTacheValidee(tache, idCollaborateur) {
  if (!tache?.id_sous_equipe) return
  try {
    const sousEquipe = await getSousEquipeById(tache.id_sous_equipe)
    if (!sousEquipe?.id_responsable) return
    const [rows] = await pool.query('SELECT nom FROM collaborateur WHERE id_collaborateur = ?', [idCollaborateur])
    const collaborateurNom = rows[0]?.nom || 'Un collaborateur'
    await creerNotification({
      id_utilisateur: sousEquipe.id_responsable,
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

export async function listTaches(req, res) {
  try {
    const { collaborateur } = req.query
    let sousEquipeId = req.query.sous_equipe

    // Un responsable ne voit que les tâches de sa (ses) propre(s) sous-équipe(s).
    if (req.user.role === 'responsable') {
      const mesEquipes = await getSousEquipesByResponsable(req.user.id)
      const mesIds = mesEquipes.map((e) => e.id)
      if (sousEquipeId && !mesIds.includes(Number(sousEquipeId))) {
        return res.status(403).json({ message: "Cette sous-équipe ne vous est pas assignée." })
      }
      if (!sousEquipeId) sousEquipeId = mesIds[0]
    }

    const taches = await getAllTaches({ sousEquipeId, collaborateurId: collaborateur })
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
      const ok = await sousEquipeAppartientAuResponsable(req.body.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: "Cette sous-équipe ne vous est pas assignée." })
    }
    const created = await createTache(req.body)
    notifierTacheAssignee(created, { id: req.user.id, role: req.user.role })
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
      const ok = await sousEquipeAppartientAuResponsable(tache.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: 'Vous ne pouvez modifier que les tâches de votre équipe.' })
      const updated = await updateTache(req.params.id, req.body)
      if (req.body.id_collaborateur !== undefined && req.body.id_collaborateur !== tache.id_collaborateur) {
        notifierTacheAssignee(updated, { id: req.user.id, role: req.user.role })
      }
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
      const { statut, membre_concerne } = req.body
      if (!STATUTS_AUTORISES_COLLABORATEUR.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide.' })
      }
      if (statut === 'probleme_coordination' && !String(membre_concerne || '').trim()) {
        return res.status(400).json({ message: 'Veuillez préciser le membre concerné.' })
      }
      const updated = await updateTache(req.params.id, {
        statut,
        membre_concerne: statut === 'probleme_coordination' ? membre_concerne.trim() : null,
      })
      if (statut === 'probleme_coordination') {
        notifierResponsableProblemeCoordination(updated, req.user.id)
      }
      if (statut === 'validee') {
        notifierResponsableTacheValidee(updated, req.user.id)
      }
      return res.json(updated)
    }
    const tacheAvant = await getTacheById(req.params.id)
    const updated = await updateTache(req.params.id, req.body)
    if (req.body.id_collaborateur !== undefined && req.body.id_collaborateur !== tacheAvant?.id_collaborateur) {
      notifierTacheAssignee(updated, { id: req.user.id, role: req.user.role })
    }
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeTache(req, res) {
  try {
    if (req.user.role === 'responsable') {
      const tache = await getTacheById(req.params.id)
      if (!tache) return res.status(404).json({ message: 'Tâche introuvable.' })
      const ok = await sousEquipeAppartientAuResponsable(tache.id_sous_equipe, req.user.id)
      if (!ok) return res.status(403).json({ message: 'Vous ne pouvez supprimer que les tâches de votre équipe.' })
    }
    await deleteTache(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Répartit un nombre total de tâches entre des "poids" (nombre de classes de
// chaque collaborateur), proportionnellement, en gardant la somme exacte
// (méthode du plus grand reste — évite les écarts d'arrondi qui favoriseraient
// quelqu'un). Si tout le monde a un poids de 0 (personne n'a encore de classes
// renseignées), on retombe sur une répartition strictement égale.
function repartirProportionnellement(poids, total) {
  const sommePoids = poids.reduce((s, p) => s + p, 0)
  const effectif = poids.length
  if (effectif === 0 || total === 0) return poids.map(() => 0)

  const poidsEffectifs = sommePoids > 0 ? poids : poids.map(() => 1)
  const sommeEffective = sommePoids > 0 ? sommePoids : effectif

  const bruts = poidsEffectifs.map((p) => (p / sommeEffective) * total)
  const base = bruts.map((b) => Math.floor(b))
  let resteADistribuer = total - base.reduce((s, b) => s + b, 0)

  const ordreParReste = bruts
    .map((b, i) => ({ i, frac: b - Math.floor(b) }))
    .sort((a, b) => b.frac - a.frac)

  for (let k = 0; k < resteADistribuer; k++) {
    base[ordreParReste[k % effectif].i] += 1
  }
  return base
}

// Répartition équitable : distribue toutes les tâches non-assignées d'une
// sous-équipe entre ses membres, proportionnellement au nombre de classes de
// chacun (issu des vœux pédagogiques), pour qu'aucun collaborateur ne soit
// sur- ou sous-chargé par rapport aux autres.
export async function repartirTaches(req, res) {
  try {
    const idSousEquipe = req.body.id_sous_equipe || req.query.sous_equipe
    if (!idSousEquipe) return res.status(400).json({ message: 'id_sous_equipe est requis.' })

    if (req.user.role === 'responsable') {
      const ok = await sousEquipeAppartientAuResponsable(idSousEquipe, req.user.id)
      if (!ok) return res.status(403).json({ message: "Cette sous-équipe ne vous est pas assignée." })
    }

    const membres = await getSousEquipeMembres(idSousEquipe)
    if (membres.length === 0) {
      return res.status(400).json({ message: "Cette sous-équipe n'a aucun membre à qui assigner des tâches." })
    }

    const taches = await getTachesNonAssignees(idSousEquipe)
    if (taches.length === 0) {
      return res.status(400).json({ message: 'Aucune tâche non assignée à répartir.' })
    }

    const ids = membres.map((m) => m.id_collaborateur)
    const nbClassesParId = await getNbClassesParCollaborateur(ids)
    const poids = ids.map((id) => nbClassesParId[id] || 0)
    const quantites = repartirProportionnellement(poids, taches.length)

    // Distribue les tâches (dans l'ordre de création) selon les quantités calculées.
    let curseur = 0
    const affectations = []
    for (let i = 0; i < membres.length; i++) {
      const nb = quantites[i]
      const tachesPourLui = taches.slice(curseur, curseur + nb)
      curseur += nb
      for (const t of tachesPourLui) {
        const updated = await updateTache(t.id_tache, { id_collaborateur: membres[i].id_collaborateur })
        notifierTacheAssignee(updated, { id: req.user.id, role: req.user.role })
      }
      affectations.push({
        id_collaborateur: membres[i].id_collaborateur,
        nom: membres[i].nom,
        nb_classes: poids[i],
        nb_taches_assignees: nb,
      })
    }

    res.json({ affectations, total_taches_reparties: taches.length })
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