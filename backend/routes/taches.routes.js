import { Router } from 'express'
import {
  listTaches,
  listMesTaches,
  addTache,
  editTache,
  removeTache,
  listStatsImplication,
  repartirTaches,
} from '../controllers/taches.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin', 'responsable'), listTaches)
// "Mes tâches" — le collaborateur connecté consulte ses propres tâches.
router.get('/mes-taches', requireAuth, requireRole('collaborateur'), listMesTaches)
router.get('/stats-implication', requireAuth, requireRole('admin'), listStatsImplication)
router.post('/', requireAuth, requireRole('admin', 'responsable'), addTache)
// Répartition équitable des tâches non-assignées d'une sous-équipe (par nb de classes).
router.post('/repartir', requireAuth, requireRole('admin', 'responsable'), repartirTaches)
router.patch('/:id', requireAuth, requireRole('admin', 'responsable', 'collaborateur'), editTache)
router.delete('/:id', requireAuth, requireRole('admin', 'responsable'), removeTache)

export default router