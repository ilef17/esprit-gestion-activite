import { Router } from 'express'
import {
  listEquipesHorsUp,
  listEquipesHorsUpDetaillees,
  listMembresEquipeHorsUp,
  listMesEquipesHorsUp,
  listMesEquipesHorsUpCollaborateur,
  getEquipeHorsUp,
  addEquipeHorsUp,
  editEquipeHorsUp,
  removeEquipeHorsUp,
  addMembre,
  removeMembre,
} from '../controllers/equipeHorsUp.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Publique — mêmes conventions que sous-equipes
router.get('/', listEquipesHorsUp)

// Responsable — ses propres équipes hors UP (déclarée avant '/:id' pour ne pas être capturée par lui)
router.get('/mes-equipes-hors-up', requireAuth, requireRole('responsable'), listMesEquipesHorsUp)

// Collaborateur — ses équipes hors UP (avec responsable), utilisée par le formulaire
// "Nouvelle activité hors-équipe" en plus de ses sous-équipes. Déclarée avant '/:id'
// (route admin générique) pour ne pas être capturée par elle.
router.get('/mes-equipes-collaborateur', requireAuth, requireRole('collaborateur'), listMesEquipesHorsUpCollaborateur)

// Ouverte à tout utilisateur authentifié (même convention que sous-equipes/:id/membres)
router.get('/:id/membres', requireAuth, listMembresEquipeHorsUp)

// Admin
router.get('/detaillees', requireAuth, requireRole('admin'), listEquipesHorsUpDetaillees)
router.get('/:id', requireAuth, requireRole('admin'), getEquipeHorsUp)
router.post('/', requireAuth, requireRole('admin'), addEquipeHorsUp)
router.put('/:id', requireAuth, requireRole('admin'), editEquipeHorsUp)
router.delete('/:id', requireAuth, requireRole('admin'), removeEquipeHorsUp)

// Gestion des membres — admin (toute équipe) ou responsable (uniquement la sienne,
// vérifié dans le contrôleur), même convention que pour les sous-équipes.
router.post('/:id/membres', requireAuth, requireRole('admin', 'responsable'), addMembre)
router.delete('/:id/membres/:idCollaborateur', requireAuth, requireRole('admin', 'responsable'), removeMembre)

export default router