import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'
import authRoutes from './routes/auth.routes.js'
import sousEquipesRoutes from './routes/sousEquipes.routes.js'
import equipeHorsUpRoutes from './routes/equipeHorsUp.routes.js'
import usersRoutes from './routes/users.routes.js'
import tachesRoutes from './routes/taches.routes.js'
import criteresRoutes from './routes/criteres.routes.js'
import evaluationsRoutes from './routes/evaluations.routes.js'
import demandesRoutes from './routes/demandes.routes.js'
import rapportsRoutes from './routes/rapports.routes.js'
import parametresRoutes from './routes/parametres.routes.js'
import sauvegardesRoutes from './routes/sauvegardes.routes.js'
import powerbiRoutes from './routes/powerbi.routes.js'
import activiteEcoleRoutes from './routes/Activiteecole.routes.js'
import voeuxPedagogiquesRoutes from './routes/voeuxPedagogiques.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import { getParametres } from './models/parametreSysteme.model.js'
import { lancerSauvegarde } from './models/sauvegarde.model.js'
import { getTachesEcheanceProche, marquerRappelEcheanceEnvoye } from './models/tache.model.js'
import { creerNotification } from './models/notification.model.js'
import { ensureNotificationSchema } from './utils/ensureSchema.js'
import { sendTacheEcheanceEmail } from './utils/Mailer.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/sous-equipes', sousEquipesRoutes)
app.use('/api/equipes-hors-up', equipeHorsUpRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/taches', tachesRoutes)
app.use('/api/criteres', criteresRoutes)
app.use('/api/evaluations', evaluationsRoutes)
app.use('/api/demandes', demandesRoutes)
app.use('/api/rapports', rapportsRoutes)
app.use('/api/parametres', parametresRoutes)
app.use('/api/sauvegardes', sauvegardesRoutes)
app.use('/api/powerbi', powerbiRoutes)
app.use('/api/activite-ecole', activiteEcoleRoutes)
app.use('/api/voeux-pedagogiques', voeuxPedagogiquesRoutes)
app.use('/api/notifications', notificationsRoutes)

app.get('/', (req, res) => {
  res.send('ARP API is running')
})

const PORT = process.env.PORT || 5000

// Provisionne automatiquement la table `notification` et les colonnes associées
// avant d'accepter des requêtes — évite toute migration SQL manuelle.
await ensureNotificationSchema()

app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur http://localhost:${PORT}`)
})

// Sauvegarde automatique quotidienne (02:00) — n'agit que si "Sauvegarde
// automatique" est activé dans Paramètres. Le déclenchement manuel reste
// toujours disponible depuis la page Sauvegardes, quel que soit ce réglage.
cron.schedule('0 2 * * *', async () => {
  try {
    const parametres = await getParametres()
    if (!parametres.sauvegarde_auto) return
    const resultat = await lancerSauvegarde({ type: 'automatique' })
    if (resultat.statut === 'echec') {
      console.error('Sauvegarde automatique échouée:', resultat.message_erreur)
    } else {
      console.log('Sauvegarde automatique créée:', resultat.nom_fichier)
    }
  } catch (err) {
    console.error('Erreur planificateur de sauvegarde:', err)
  }
})

// Rappel d'échéance de tâche (J-2), tous les jours à 07:00 : notification in-app
// systématique + email si le collaborateur a activé "notifications_email" dans son
// profil. `rappel_echeance_envoye` empêche un double envoi si le cron est relancé.
cron.schedule('0 7 * * *', async () => {
  try {
    const taches = await getTachesEcheanceProche()
    for (const tache of taches) {
      try {
        await creerNotification({
          id_utilisateur: tache.id_collaborateur,
          type_utilisateur: 'collaborateur',
          type: 'tache_echeance',
          titre: "Échéance dans 2 jours",
          message: `La tâche "${tache.titre}" arrive à échéance le ${new Date(tache.date_echeance).toLocaleDateString('fr-FR')}`,
          lien_page: 'taches',
        })
        if (tache.notifications_email && tache.collaborateur_email) {
          await sendTacheEcheanceEmail({
            to: tache.collaborateur_email,
            collaborateurNom: tache.collaborateur_nom,
            titre: tache.titre,
            dateEcheance: tache.date_echeance,
          })
        }
        await marquerRappelEcheanceEnvoye(tache.id_tache)
      } catch (err) {
        console.error(`Erreur rappel échéance tâche #${tache.id_tache}:`, err)
      }
    }
  } catch (err) {
    console.error('Erreur planificateur de rappel d\'échéance:', err)
  }
})