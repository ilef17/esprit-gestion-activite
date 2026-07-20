import {
  getMesNotifications,
  compterNonLues,
  marquerLue,
  marquerToutesLues,
} from '../models/notification.model.js'

// Un seul jeu de routes, partagé par les 3 rôles : le destinataire est toujours
// déduit du token (req.user.id / req.user.role), jamais du corps de la requête.

export async function listMesNotifications(req, res) {
  try {
    const notifications = await getMesNotifications(req.user.id, req.user.role)
    res.json(notifications)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function countNonLues(req, res) {
  try {
    const total = await compterNonLues(req.user.id, req.user.role)
    res.json({ total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function marquerNotificationLue(req, res) {
  try {
    await marquerLue(req.params.id, req.user.id, req.user.role)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function marquerToutesNotificationsLues(req, res) {
  try {
    await marquerToutesLues(req.user.id, req.user.role)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
