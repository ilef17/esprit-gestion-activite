import path from 'path'
import {
  getAllSauvegardes,
  getSauvegardeById,
  lancerSauvegarde,
  verifierSauvegarde,
  deleteSauvegarde,
} from '../models/sauvegarde.model.js'
import { BACKUPS_DIR } from '../utils/backupGenerator.js'

export async function listSauvegardes(req, res) {
  try {
    const sauvegardes = await getAllSauvegardes()
    res.json(sauvegardes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Déclenchement manuel — bouton "Sauvegarder maintenant" côté admin.
export async function creerSauvegardeManuelle(req, res) {
  try {
    const sauvegarde = await lancerSauvegarde({ type: 'manuelle' })
    if (sauvegarde.statut === 'echec') {
      return res.status(502).json({ message: sauvegarde.message_erreur, sauvegarde })
    }
    res.status(201).json(sauvegarde)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function telechargerSauvegarde(req, res) {
  try {
    const sauvegarde = await getSauvegardeById(req.params.id)
    if (!sauvegarde || sauvegarde.statut !== 'ok') {
      return res.status(404).json({ message: 'Fichier de sauvegarde introuvable.' })
    }
    const filePath = path.join(BACKUPS_DIR, sauvegarde.nom_fichier)
    res.download(filePath, sauvegarde.nom_fichier, (err) => {
      if (err && !res.headersSent) {
        console.error(err)
        res.status(404).json({ message: 'Fichier introuvable sur le serveur.' })
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Recalcule le hash du fichier et le compare à celui pris au moment de la
// sauvegarde — "contrôle d'intégrité des données" demandé dans le cahier des charges.
export async function verifierIntegriteSauvegarde(req, res) {
  try {
    const resultat = await verifierSauvegarde(req.params.id)
    if (!resultat) return res.status(404).json({ message: 'Sauvegarde introuvable.' })
    res.json(resultat)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeSauvegarde(req, res) {
  try {
    await deleteSauvegarde(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
