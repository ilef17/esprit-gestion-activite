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
import dashboardRoutes from './routes/dashboard.routes.js'
import activiteEcoleRoutes from './routes/Activiteecole.routes.js'
import voeuxPedagogiquesRoutes from './routes/voeuxPedagogiques.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import { getParametres } from './models/parametreSysteme.model.js'
import { lancerSauvegarde } from './models/sauvegarde.model.js'
import { getTachesEcheanceProche, marquerRappelEcheanceEnvoye } from './models/tache.model.js'
import { creerNotification } from './models/notification.model.js'
import { ensureNotificationSchema, ensureVoeuxPedagogiquesSchema } from './utils/ensureSchema.js'
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
app.use('/api/dashboard', dashboardRoutes)
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
await ensureVoeuxPedagogiquesSchema()

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

// Rappel d'échéance de tâche (fenêtre <= J-2), tous les jours à 07:00 : notification
// in-app systématique + email si le collaborateur a activé "notifications_email" dans
// son profil. `rappel_echeance_envoye` empêche un double envoi si le cron est relancé.
// Extraite en fonction nommée pour pouvoir être aussi appelée une fois au démarrage
// (voir plus bas) : si le process était down pile à 07:00 (serveur redémarré, machine
// endormie...), on ne veut pas attendre le lendemain — une tâche à échéance du jour
// même risquerait de sortir de la fenêtre avant le prochain tick planifié.
async function envoyerRappelsEcheance() {
  try {
    const taches = await getTachesEcheanceProche()
    const aujourdHui = new Date()
    aujourdHui.setHours(0, 0, 0, 0)
    for (const tache of taches) {
      try {
        // La fenêtre couvre J, J+1 et J+2 (voir getTachesEcheanceProche) : le titre
        // doit refléter le nombre de jours réel, pas toujours "2 jours".
        const dateEcheance = new Date(tache.date_echeance)
        dateEcheance.setHours(0, 0, 0, 0)
        const joursRestants = Math.round((dateEcheance - aujourdHui) / (1000 * 60 * 60 * 24))
        const titre =
          joursRestants <= 0 ? "Échéance aujourd'hui"
          : joursRestants === 1 ? 'Échéance demain'
          : `Échéance dans ${joursRestants} jours`
        await creerNotification({
          id_utilisateur: tache.id_collaborateur,
          type_utilisateur: 'collaborateur',
          type: 'tache_echeance',
          titre,
          message: `La tâche "${tache.titre}" arrive à échéance le ${dateEcheance.toLocaleDateString('fr-FR')}`,
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
}

cron.schedule('0 7 * * *', envoyerRappelsEcheance)

// Filet de sécurité : si le cron de 07:00 a été raté (process down au bon moment,
// comme observé via les logs "missed execution" de node-cron), on rattrape tout de
// suite au démarrage plutôt que d'attendre jusqu'à 24h — une tâche à échéance du
// jour même pourrait sinon sortir définitivement de la fenêtre sans jamais être
// notifiée.
envoyerRappelsEcheance()