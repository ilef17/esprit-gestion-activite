import { Router } from 'express'
import {
  listTaches,
  listMesTaches,
  addTache,
  addTachesEnLot,
  editTache,
  removeTache,
  listStatsImplication,
  listTachesDisponibles,
  choisirTache,
} from '../controllers/taches.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin', 'responsable'), listTaches)
// "Mes tâches" — le collaborateur connecté consulte ses propres tâches.
router.get('/mes-taches', requireAuth, requireRole('collaborateur'), listMesTaches)
// Pool de tâches non assignées ouvertes à l'équipe du collaborateur, et prise en main.
router.get('/disponibles', requireAuth, requireRole('collaborateur'), listTachesDisponibles)
router.post('/:id/choisir', requireAuth, requireRole('collaborateur'), choisirTache)
router.get('/stats-implication', requireAuth, requireRole('admin'), listStatsImplication)
router.post('/', requireAuth, requireRole('admin', 'responsable'), addTache)
// Publication groupée : une liste entière de tâches en un seul envoi (une seule notif/e-mail).
router.post('/lot', requireAuth, requireRole('admin', 'responsable'), addTachesEnLot)
router.patch('/:id', requireAuth, requireRole('admin', 'responsable', 'collaborateur'), editTache)
router.delete('/:id', requireAuth, requireRole('admin', 'responsable'), removeTache)

export default router