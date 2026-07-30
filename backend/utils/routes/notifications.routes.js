import { Router } from 'express'
import {
  listMesNotifications,
  countNonLues,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
} from '../controllers/notifications.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

// Pas de requireRole ici : les 3 rôles (admin, responsable, collaborateur) ont
// leurs propres notifications et utilisent exactement les mêmes routes.
router.get('/', requireAuth, listMesNotifications)
router.get('/non-lues', requireAuth, countNonLues)
router.patch('/:id/lue', requireAuth, marquerNotificationLue)
router.patch('/marquer-toutes-lues', requireAuth, marquerToutesNotificationsLues)

export default router
