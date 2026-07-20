import {
  getAllCriteres,
  createCritere,
  updateCritere,
  deleteCritere,
  getTotalPonderation,
} from '../models/critereEvaluation.model.js'

export async function listCriteres(req, res) {
  try {
    const criteres = await getAllCriteres()
    const total = await getTotalPonderation()
    res.json({ criteres, total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function addCritere(req, res) {
  try {
    const { nom } = req.body
    if (!nom) return res.status(400).json({ message: 'Le nom du critère est requis.' })
    const created = await createCritere(req.body)
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function editCritere(req, res) {
  try {
    const updated = await updateCritere(req.params.id, req.body)
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export async function removeCritere(req, res) {
  try {
    await deleteCritere(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
