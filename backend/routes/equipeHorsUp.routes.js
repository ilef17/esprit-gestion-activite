import { Router } from 'express'
import {
  listEquipesHorsUp,
  listEquipesHorsUpDetaillees,
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

// Admin
router.get('/detaillees', requireAuth, requireRole('admin'), listEquipesHorsUpDetaillees)
router.get('/:id', requireAuth, requireRole('admin'), getEquipeHorsUp)
router.post('/', requireAuth, requireRole('admin'), addEquipeHorsUp)
router.put('/:id', requireAuth, requireRole('admin'), editEquipeHorsUp)
router.delete('/:id', requireAuth, requireRole('admin'), removeEquipeHorsUp)
router.post('/:id/membres', requireAuth, requireRole('admin'), addMembre)
router.delete('/:id/membres/:idCollaborateur', requireAuth, requireRole('admin'), removeMembre)

export default router
