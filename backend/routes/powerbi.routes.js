import { Router } from 'express'
import {
  feedCollaborateurs,
  feedSousEquipes,
  feedTaches,
  feedEvaluations,
} from '../controllers/powerbi.controller.js'
import { requireApiKey } from '../middleware/apiKey.middleware.js'

const router = Router()

router.get('/collaborateurs', requireApiKey, feedCollaborateurs)
router.get('/sous-equipes', requireApiKey, feedSousEquipes)
router.get('/taches', requireApiKey, feedTaches)
router.get('/evaluations', requireApiKey, feedEvaluations)

export default router
