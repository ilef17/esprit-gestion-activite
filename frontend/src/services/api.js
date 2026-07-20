import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Attache le token JWT à chaque requête s'il existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


export async function loginRequest({ role, login, password, captchaToken }) {
  const res = await api.post('/auth/login', { role, login, password, captchaToken })
  return res.data
}

export async function signupRequest(payload) {
  const res = await api.post('/auth/signup', payload)
  return res.data
}

export async function getSousEquipes() {
  const res = await api.get('/sous-equipes')
  return res.data
}

/* ---------- Sous-équipes (admin) ---------- */
export async function getSousEquipesDetaillees(annee_universitaire, semestre) {
  const res = await api.get('/sous-equipes/detaillees', { params: { annee_universitaire, semestre } })
  return res.data
}
export async function getSousEquipe(id) {
  const res = await api.get(`/sous-equipes/${id}`)
  return res.data
}
export async function createSousEquipe(payload) {
  const res = await api.post('/sous-equipes', payload)
  return res.data
}
export async function updateSousEquipe(id, payload) {
  const res = await api.put(`/sous-equipes/${id}`, payload)
  return res.data
}
export async function deleteSousEquipe(id) {
  const res = await api.delete(`/sous-equipes/${id}`)
  return res.data
}
export async function getMembresSousEquipe(id) {
  const res = await api.get(`/sous-equipes/${id}/membres`)
  return res.data
}

/* ---------- Responsable (mon équipe / mes tâches) ---------- */
export async function getMesSousEquipes() {
  const res = await api.get('/sous-equipes/mes-sous-equipes')
  return res.data
}
export async function getCollaborateursOptions() {
  const res = await api.get('/users/collaborateurs-options')
  return res.data
}
export async function getTaches(params) {
  const res = await api.get('/taches', { params })
  return res.data
}
export async function updateTache(id, payload) {
  const res = await api.patch(`/taches/${id}`, payload)
  return res.data
}
export async function deleteTache(id) {
  const res = await api.delete(`/taches/${id}`)
  return res.data
}
// Répartition équitable des tâches non-assignées d'une sous-équipe, par nombre
// de classes de chaque collaborateur (vœux pédagogiques) — évite le favoritisme.
export async function repartirTaches(idSousEquipe) {
  const res = await api.post('/taches/repartir', { id_sous_equipe: idSousEquipe })
  return res.data
}

export async function addMembreSousEquipe(id, idCollaborateur) {
  const res = await api.post(`/sous-equipes/${id}/membres`, { id_collaborateur: idCollaborateur })
  return res.data
}
export async function removeMembreSousEquipe(id, idCollaborateur) {
  const res = await api.delete(`/sous-equipes/${id}/membres/${idCollaborateur}`)
  return res.data
}
/* ---------- Équipes hors UP (admin) ---------- */
export async function getEquipesHorsUpDetaillees(annee_universitaire, semestre) {
  const res = await api.get('/equipes-hors-up/detaillees', { params: { annee_universitaire, semestre } })
  return res.data
}
export async function getEquipeHorsUp(id) {
  const res = await api.get(`/equipes-hors-up/${id}`)
  return res.data
}
export async function createEquipeHorsUp(payload) {
  const res = await api.post('/equipes-hors-up', payload)
  return res.data
}
export async function updateEquipeHorsUp(id, payload) {
  const res = await api.put(`/equipes-hors-up/${id}`, payload)
  return res.data
}
export async function deleteEquipeHorsUp(id) {
  const res = await api.delete(`/equipes-hors-up/${id}`)
  return res.data
}
export async function addMembreEquipeHorsUp(id, idCollaborateur) {
  const res = await api.post(`/equipes-hors-up/${id}/membres`, { id_collaborateur: idCollaborateur })
  return res.data
}
export async function removeMembreEquipeHorsUp(id, idCollaborateur) {
  const res = await api.delete(`/equipes-hors-up/${id}/membres/${idCollaborateur}`)
  return res.data
}
/* ---------- Utilisateurs (admin) ---------- */
export async function getUsers(annee_universitaire, semestre) {
  const res = await api.get('/users', { params: { annee_universitaire, semestre } })
  return res.data
}
export async function updateUser(role, id, payload) {
  const res = await api.patch(`/users/${role}/${id}`, payload)
  return res.data
}
export async function deleteUser(role, id) {
  const res = await api.delete(`/users/${role}/${id}`)
  return res.data
}
export async function promoteToResponsable(idCollaborateur) {
  const res = await api.post(`/users/collaborateurs/${idCollaborateur}/promote-responsable`)
  return res.data
}
export async function ensureCollaborateurAccount(idResponsable) {
  const res = await api.post(`/users/responsables/${idResponsable}/ensure-collaborateur`)
  return res.data
}

/* ---------- Mot de passe oublié ---------- */
export async function forgotPassword(role, email) {
  const res = await api.post('/auth/forgot-password', { role, email })
  return res.data
}
export async function verifyResetCode(pendingToken, code) {
  const res = await api.post('/auth/verify-reset-code', { pendingToken, code })
  return res.data
}
export async function resetPassword(resetToken, password) {
  const res = await api.post('/auth/reset-password', { resetToken, password })
  return res.data
}

/* ---------- Demandes hors-équipe (admin) ---------- */
export async function getDemandes(annee_universitaire, semestre) {
  const res = await api.get('/demandes', { params: { annee_universitaire, semestre } })
  return res.data
}
export async function envoyerVerificationDemande(id, destinataire_verification) {
  const res = await api.patch(`/demandes/${id}/envoyer`, { destinataire_verification })
  return res.data
}
export async function validerDemande(id) {
  const res = await api.patch(`/demandes/${id}/valider`)
  return res.data
}
export async function refuserDemande(id) {
  const res = await api.patch(`/demandes/${id}/refuser`)
  return res.data
}

/* ---------- Évaluation ---------- */
export async function getCriteres() {
  const res = await api.get('/criteres')
  return res.data
}
export async function createCritere(payload) {
  const res = await api.post('/criteres', payload)
  return res.data
}
export async function updateCritere(id, payload) {
  const res = await api.put(`/criteres/${id}`, payload)
  return res.data
}
export async function deleteCritere(id) {
  const res = await api.delete(`/criteres/${id}`)
  return res.data
}
export async function getScores(params) {
  const res = await api.get('/evaluations', { params })
  return res.data
}
export async function getGrilleNotes(idEquipe, type = 'up') {
  const res = await api.get('/evaluations/grille', { params: { sous_equipe: idEquipe, type } })
  return res.data
}
export async function calculerScores(idEquipe, notes, type = 'up') {
  const res = await api.post('/evaluations/calculer', { id_sous_equipe: idEquipe, notes, type })
  return res.data
}
/* ---------- Rapports ---------- */
export async function getRapports(annee_universitaire, semestre) {
  const res = await api.get('/rapports', { params: { annee_universitaire, semestre } })
  return res.data
}
export async function createRapport(payload) {
  const res = await api.post('/rapports', payload)
  return res.data
}
export async function telechargerRapportFichier(id) {
  return api.get(`/rapports/${id}/fichier`, { responseType: 'blob' })
}
export async function getStatsImplication(annee_universitaire, semestre) {
  const res = await api.get('/taches/stats-implication', { params: { annee_universitaire, semestre } })
  return res.data
}
export async function createTache(payload) {
  const res = await api.post('/taches', payload)
  return res.data
}

/* ---------- Mes tâches (collaborateur) ---------- */
export async function getMesTaches() {
  const res = await api.get('/taches/mes-taches')
  return res.data
}
export async function updateMaTache(id, statut, membreConcerne) {
  const res = await api.patch(`/taches/${id}`, { statut, membre_concerne: membreConcerne })
  return res.data
}

/* ---------- Mes demandes hors-équipe (collaborateur) ---------- */
export async function getMesDemandes() {
  const res = await api.get('/demandes/mes-demandes')
  return res.data
}
export async function creerDemande(payload) {
  const res = await api.post('/demandes', payload)
  return res.data
}

/* ---------- Sauvegardes ---------- */
export async function getSauvegardes() {
  const res = await api.get('/sauvegardes')
  return res.data
}
export async function creerSauvegarde() {
  const res = await api.post('/sauvegardes')
  return res.data
}
export async function verifierSauvegarde(id) {
  const res = await api.get(`/sauvegardes/${id}/verifier`)
  return res.data
}
export async function telechargerSauvegardeFichier(id) {
  return api.get(`/sauvegardes/${id}/fichier`, { responseType: 'blob' })
}
export async function deleteSauvegarde(id) {
  const res = await api.delete(`/sauvegardes/${id}`)
  return res.data
}

/* ---------- Paramètres ---------- */
export async function getParametres() {
  const res = await api.get('/parametres')
  return res.data
}
export async function updateParametres(payload) {
  const res = await api.put('/parametres', payload)
  return res.data
}

/* ---------- Activité école (admin — vue globale + gestion des expertises) ---------- */
export async function getProfesseurs() {
  const res = await api.get('/activite-ecole/professeurs')
  return res.data
}
export async function getProfesseurDetail(id) {
  const res = await api.get(`/activite-ecole/professeurs/${id}`)
  return res.data
}
export async function addExpertiseAdmin(idProfesseur, libelle) {
  const res = await api.post(`/activite-ecole/professeurs/${idProfesseur}/expertises`, { libelle })
  return res.data
}
// Suppression d'une expertise : utilisable par l'admin (n'importe laquelle) ou par le
// collaborateur propriétaire (vérifié côté serveur).
export async function deleteExpertise(id) {
  const res = await api.delete(`/activite-ecole/expertises/${id}`)
  return res.data
}

/* ---------- Mon activité école (collaborateur — self-service complet) ---------- */
export async function getMonActiviteEcole() {
  const res = await api.get('/activite-ecole/moi')
  return res.data
}
export async function addMonExpertise(libelle) {
  const res = await api.post('/activite-ecole/moi/expertises', { libelle })
  return res.data
}
export async function addMonEncadrement(payload) {
  const res = await api.post('/activite-ecole/moi/encadrements', payload)
  return res.data
}
export async function deleteMonEncadrement(id) {
  const res = await api.delete(`/activite-ecole/encadrements/${id}`)
  return res.data
}
export async function addMonActiviteAcademique(payload) {
  const res = await api.post('/activite-ecole/moi/activites', payload)
  return res.data
}
export async function deleteMonActiviteAcademique(id) {
  const res = await api.delete(`/activite-ecole/activites/${id}`)
  return res.data
}

/* ---------- Notifications (les 3 rôles) ---------- */
export async function getMesNotifications() {
  const res = await api.get('/notifications')
  return res.data
}
export async function getNotificationsNonLues() {
  const res = await api.get('/notifications/non-lues')
  return res.data
}
export async function marquerNotificationLue(id) {
  const res = await api.patch(`/notifications/${id}/lue`)
  return res.data
}
export async function marquerToutesNotificationsLues() {
  const res = await api.patch('/notifications/marquer-toutes-lues')
  return res.data
}

/* ---------- Vœux pédagogiques (admin) ---------- */
export async function getCampagnesVoeuxPedagogiques() {
  const res = await api.get('/voeux-pedagogiques/campagnes')
  return res.data
}
export async function getCampagneVoeuxPedagogiques(id) {
  const res = await api.get(`/voeux-pedagogiques/campagnes/${id}`)
  return res.data
}
export async function createCampagneVoeuxPedagogiques(payload) {
  const res = await api.post('/voeux-pedagogiques/campagnes', payload)
  return res.data
}
export async function updateCampagneVoeuxPedagogiques(id, payload) {
  const res = await api.put(`/voeux-pedagogiques/campagnes/${id}`, payload)
  return res.data
}
export async function publierCampagneVoeuxPedagogiques(id) {
  const res = await api.post(`/voeux-pedagogiques/campagnes/${id}/publier`)
  return res.data
}
export async function cloturerCampagneVoeuxPedagogiques(id) {
  const res = await api.post(`/voeux-pedagogiques/campagnes/${id}/cloturer`)
  return res.data
}
export async function deleteCampagneVoeuxPedagogiques(id) {
  const res = await api.delete(`/voeux-pedagogiques/campagnes/${id}`)
  return res.data
}
export async function getReponsesCampagneVoeuxPedagogiques(id) {
  const res = await api.get(`/voeux-pedagogiques/campagnes/${id}/reponses`)
  return res.data
}
export async function ajouterAffectationVoeuxPedagogiques(idReponse, payload) {
  const res = await api.post(`/voeux-pedagogiques/reponses/${idReponse}/affectations`, payload)
  return res.data
}
export async function supprimerAffectationVoeuxPedagogiques(idAffectation) {
  const res = await api.delete(`/voeux-pedagogiques/affectations/${idAffectation}`)
  return res.data
}

/* ---------- Vœux pédagogiques (collaborateur) ---------- */
export async function getMonQuestionnaireVoeuxPedagogiques() {
  const res = await api.get('/voeux-pedagogiques/mon-questionnaire')
  return res.data
}
export async function saveMaReponseVoeuxPedagogiques(payload) {
  const res = await api.put('/voeux-pedagogiques/ma-reponse', payload)
  return res.data
}
export async function getMesAffectationsVoeuxPedagogiques() {
  const res = await api.get('/voeux-pedagogiques/mes-affectations')
  return res.data
}

/* ---------- Mon profil (collaborateur) ---------- */
export async function getMonProfil() {
  const res = await api.get('/users/me')
  return res.data
}
export async function updateMesPreferences(payload) {
  const res = await api.patch('/users/me/preferences', payload)
  return res.data
}
export async function updateMonProfilIdentite(payload) {
  const res = await api.patch('/users/me/profil', payload)
  return res.data
}
export async function changerMonMotDePasse(payload) {
  const res = await api.patch('/users/me/mot-de-passe', payload)
  return res.data
}

export default api