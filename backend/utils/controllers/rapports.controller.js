import path from 'path'
import { getAllRapports, getRapportById, createRapport, deleteRapport } from '../models/rapport.model.js'
import { REPORTS_DIR } from '../utils/rapportGenerator.js'

export async function listRapports(req, res) {
  try {
    const { annee_universitaire, semestre } = req.query
    const periode = annee_universitaire && semestre ? { annee_universitaire, semestre } : null
    const rapports = await getAllRapports(periode)
    res.json(rapports)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Crée le rapport ET génère le fichier PDF/Excel réel (voir rapport.model.js).
export async function addRapport(req, res) {
  try {
    const { titre } = req.body
    if (!titre) return res.status(400).json({ message: 'Le titre est requis.' })
    const created = await createRapport(req.body)
    if (!created.chemin_fichier) {
      return res.status(201).json({ ...created, warning: "Le rapport a été créé mais la génération du fichier a échoué. Réessayez." })
    }
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Téléchargement du fichier généré.
export async function telechargerRapport(req, res) {
  try {
    const rapport = await getRapportById(req.params.id)
    if (!rapport || !rapport.chemin_fichier) {
      return res.status(404).json({ message: 'Fichier introuvable pour ce rapport.' })
    }
    const filePath = path.join(REPORTS_DIR, rapport.chemin_fichier)
    const ext = rapport.format === 'excel' ? 'xlsx' : 'pdf'
    res.download(filePath, `${rapport.titre}.${ext}`, (err) => {
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

export async function removeRapport(req, res) {
  try {
    await deleteRapport(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}