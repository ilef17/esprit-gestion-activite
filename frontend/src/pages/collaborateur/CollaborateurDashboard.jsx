import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import NotificationBell from '../../components/NotificationBell.jsx'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import { warningPeriode } from '../../utils/dateValidation.js'
import StatsDashboard from '../../components/dashboard/StatsDashboard.jsx'
import {
  getMonActiviteEcole,
  addMonExpertise,
  deleteExpertise,
  addMonEncadrement,
  deleteMonEncadrement,
  addMonActiviteAcademique,
  deleteMonActiviteAcademique,
  getProfesseurs,
  getProfesseurDetail,
  getMesTaches,
  updateMaTache,
  getTachesDisponibles,
  choisirTache,
  getMesDemandes,
  creerDemande,
  updateStatutDemande,
  getMesEquipesAvecResponsable,
  getMesEquipesHorsUpAvecResponsable,
  getMembresSousEquipe,
  getMonProfil,
  updateMesPreferences,
  updateMonProfilIdentite,
  changerMonMotDePasse,
  getMonQuestionnaireVoeuxPedagogiques,
  saveMaReponseVoeuxPedagogiques,
  getMesAffectationsVoeuxPedagogiques,
  getParametres,
} from '../../services/api.js'
import './collaborateur.css'

function relativeDays(dateStr) {
  if (!dateStr) return ''
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return "Reçue aujourd'hui"
  if (days === 1) return 'Reçue hier'
  return `Reçue il y a ${days}j`
}

// Cahier des charges : le collaborateur ne peut choisir que ces 3 statuts pour ses tâches.
const TACHE_STATUTS = [
  { value: 'en_cours', label: 'En cours', cls: 'encours' },
  { value: 'validee', label: 'Faite', cls: 'validee' },
  { value: 'probleme_coordination', label: 'Problème de coordination', cls: 'nonrealisee' },
]
function tacheStatutMeta(statut) {
  return TACHE_STATUTS.find((s) => s.value === statut) || { value: 'a_faire', label: 'À faire', cls: 'gray' }
}

const PRIORITE_LABELS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' }

const DEMANDE_STATUTS = {
  a_faire: { label: 'À faire', cls: 'gray' },
  en_cours: { label: 'En cours', cls: 'encours' },
  faite: { label: 'Faite', cls: 'validee' },
}

function formatDateShortFr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateHeureShortFr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ACTIVITE_LABELS = {
  membre_jury: 'Membre de jury',
  president_jury: 'Président de jury',
  formation_ete: "Formation d'été",
  formation_hiver: "Formation d'hiver",
  formation_printemps: 'Formation de printemps',
  evenement: 'Événement',
  comite_organisation: "Comité d'organisation",
}

function initials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

const Icon = {
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>),
  eye: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  task: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>),
  requests: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 4h16v16H4z"/><path d="M4 9h16"/><path d="M9 4v16"/></svg>),
  eval: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 2l2.4 6.9L22 9l-5.6 4.9L18 22l-6-3.7L6 22l1.6-8.1L2 9l7.6-.1z"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>),
  academic: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/></svg>),
  profile: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>),
  poll: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 17V9"/><path d="M15 17V5"/><path d="M4 17v-4"/><path d="M4 21h16"/></svg>),
  students: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.3"/></svg>),
  gavel: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="m14 5 5 5"/><path d="m3 21 6-6"/><path d="m9.5 8.5 6 6"/><path d="M14.5 4.5 19.5 9.5"/><path d="M6.5 12.5 11.5 17.5"/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18"/><path d="M8 2.5v4"/><path d="M16 2.5v4"/></svg>),
  flag: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M5 3v18"/><path d="M5 4h11l-2.5 4L16 12H5"/></svg>),
  removeX: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>),
  award: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/></svg>),
  book: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>),
  building: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="4" y="3" width="16" height="18" rx="1.2"/><path d="M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01"/></svg>),
}

// Icône + couleur de badge pour chacune des 7 catégories d'activité école
// (mêmes catégories que les colonnes du tableau admin "Activité école").
const ACTIVITE_ICONS = {
  membre_jury: { icon: <Icon.gavel />, color: 'red' },
  president_jury: { icon: <Icon.gavel />, color: 'red' },
  formation_ete: { icon: <Icon.academic />, color: 'amber' },
  formation_hiver: { icon: <Icon.academic />, color: 'blue' },
  formation_printemps: { icon: <Icon.academic />, color: 'green' },
  evenement: { icon: <Icon.calendar />, color: 'green' },
  comite_organisation: { icon: <Icon.flag />, color: 'blue' },
}

// Période Année/Semestre — mêmes options et même règle par défaut que le filtre
// du tableau de bord admin (septembre→janvier = S1, février→août = S2), pour
// rester cohérent dans toute l'application. La liste des années (anneesOptions)
// n'est plus figée ici : elle est calculée dans le composant à partir des
// paramètres système (mêmes années que celles vues/ajoutées par l'admin).
const SEMESTRE_OPTIONS = [
  { value: 'S1', label: 'Semestre 1' },
  { value: 'S2', label: 'Semestre 2' },
]
function periodeParDefaut() {
  const now = new Date()
  const mois = now.getMonth() + 1
  const anneeDebut = mois >= 9 ? now.getFullYear() : now.getFullYear() - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}

// Même règle de découpage que le backend (utils/periode.js), appliquée côté client pour
// filtrer les demandes hors-équipe (date_reception) et les activités école (date_activite),
// qui n'ont pas de colonnes annee_universitaire/semestre dédiées comme les tâches.
function periodeDeDate(dateStr) {
  // Lit directement les composants année/mois de la chaîne ISO (YYYY-MM-DD…) plutôt
  // que de passer par un objet Date, pour éviter un décalage de jour/mois dû à la
  // conversion de fuseau horaire (ex. une date stockée à minuit UTC qui basculerait
  // sur le jour précédent une fois interprétée dans le fuseau du navigateur).
  const m = typeof dateStr === 'string' && dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let annee, mois
  if (m) {
    annee = Number(m[1])
    mois = Number(m[2])
  } else {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return null
    annee = d.getFullYear()
    mois = d.getMonth() + 1
  }
  const anneeDebut = mois >= 9 ? annee : annee - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}
// Une entrée sans date reste toujours visible, quel que soit le filtre (même logique que
// pour les tâches sans annee_universitaire/semestre enregistrés).
function estDansPeriode(dateStr, filtreAnnee, filtreSemestre) {
  if (!dateStr) return true
  const p = periodeDeDate(dateStr)
  if (!p) return true
  return p.annee === filtreAnnee && p.semestre === filtreSemestre
}

// Les encadrements n'ont qu'une année universitaire libre (pas de semestre) : un
// encadrement reste donc visible sur les deux semestres de son année. Sans année
// renseignée, il reste toujours visible (même logique que les entrées sans date).
function estDansAnnee(anneeUniversitaire, filtreAnnee) {
  if (!anneeUniversitaire) return true
  return anneeUniversitaire === filtreAnnee
}

const NAV_TABS = [
  { page: 'taches', label: 'Mes tâches', icon: 'task' },
  { page: 'horsequipe', label: 'Activités hors-équipe', icon: 'requests' },
  { page: 'voeux-pedagogiques', label: 'Vœux pédagogiques', icon: 'poll' },
  { page: 'classes-affectees', label: 'Classes affectées', icon: 'book' },
  { page: 'activite-ecole', label: 'Activité école', icon: 'academic' },
  { page: 'profil', label: 'Mon profil', icon: 'profile' },
]

function CollaborateurDashboard() {
  const { user, role, logout, updateUser } = useAuth()
  const [toastMsg, setToastMsg] = useState(null)
  const [activePage, setActivePage] = useState('taches')

  // Mode sombre — persisté localement, appliqué en ajoutant/retirant la classe "dark"
  // sur le conteneur racine (toutes les couleurs sont des variables CSS sur .admin-root).
  const [dark, setDark] = useState(() => localStorage.getItem('arp_theme') === 'dark')
  useEffect(() => {
    localStorage.setItem('arp_theme', dark ? 'dark' : 'light')
  }, [dark])
  const toggleDark = useCallback(() => setDark((d) => !d), [])

  // Filtre Année / Semestre du tableau de bord — même logique que le filtre
  // équivalent du tableau de bord admin.
  const defautPeriode = useMemo(periodeParDefaut, [])
  const [filtreAnnee, setFiltreAnnee] = useState(defautPeriode.annee)
  const [filtreSemestre, setFiltreSemestre] = useState(defautPeriode.semestre)

  // Paramètres système (dont la période active définie par l'admin, et les
  // années universitaires supplémentaires qu'il a ajoutées) — mêmes données
  // que celles lues par le tableau de bord admin.
  const [params, setParams] = useState(null)

  // Liste des années universitaires proposées dans le sélecteur : identique
  // au calcul du tableau de bord admin (fenêtre autour de l'année courante +
  // années ajoutées par l'admin via Paramètres), pour que collaborateur et
  // responsable voient toujours les mêmes années que l'admin.
  const anneesOptions = useMemo(() => {
    const debut = Number(defautPeriode.annee.split('/')[0])
    const annees = new Set()
    for (let i = 2; i >= -2; i--) annees.add(`${debut + i}/${debut + i + 1}`)
    ;(params?.annees_supplementaires || []).forEach((a) => annees.add(a))
    return Array.from(annees).sort().reverse()
  }, [defautPeriode.annee, params])

  // Au premier chargement, on cale le filtre consulté sur la période *active*
  // du système (définie par l'admin) plutôt que sur la date du jour, pour que
  // collaborateur/responsable retombent sur la bonne période par défaut.
  const periodeSyncedRef = useRef(false)
  useEffect(() => {
    getParametres()
      .then((data) => {
        setParams(data)
        if (!periodeSyncedRef.current && data?.annee_universitaire && data?.semestre_actif) {
          periodeSyncedRef.current = true
          setFiltreAnnee(data.annee_universitaire)
          setFiltreSemestre(data.semestre_actif)
        }
      })
      .catch((err) => console.error('Erreur chargement paramètres:', err))
  }, [])

  // Tant que la période consultée (filtreAnnee/filtreSemestre) ne correspond pas
  // à la période active du système, la page passe en lecture seule (aucune
  // création/modification possible) — même règle que côté admin.
  const periodeEstActive = !params || (filtreAnnee === params.annee_universitaire && filtreSemestre === params.semestre_actif)

  // Les tâches sont chargées ici (et non dans MesTaches) pour pouvoir afficher
  // le nombre de tâches en cours sous forme de pastille sur l'onglet de navigation.
  const [taches, setTaches] = useState([])
  const [tachesLoading, setTachesLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  // Nombre de demandes hors-équipe, utilisé par la carte KPI "Activités hors-équipe"
  // affichée sur la page Mes tâches.
  const [demandesCount, setDemandesCount] = useState(0)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const refreshTaches = useCallback(() => (
    getMesTaches()
      .then((data) => setTaches(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de vos tâches') })
      .finally(() => setTachesLoading(false))
  ), [showToast])

  useEffect(() => {
    if (role !== 'collaborateur') return
    refreshTaches()
  }, [role, refreshTaches])

  // Rafraîchissement périodique — évite d'avoir à recharger la page pour voir
  // apparaître de nouvelles tâches publiées par le responsable (même principe que
  // le compteur de notifications, voir NotificationBell.jsx).
  useEffect(() => {
    if (role !== 'collaborateur') return
    const id = setInterval(refreshTaches, 20000)
    return () => clearInterval(id)
  }, [role, refreshTaches])

  useEffect(() => {
    if (role !== 'collaborateur') return
    getMesDemandes()
      .then((data) => setDemandesCount(Array.isArray(data) ? data.length : 0))
      .catch((err) => console.error('Erreur chargement demandes:', err))
  }, [role])

  const changerStatutTache = useCallback(async (id, statut, membreConcerne, raisonProbleme) => {
    setSavingId(id)
    // Mise à jour optimiste
    setTaches((prev) => prev.map((t) => (t.id_tache === id ? { ...t, statut, membre_concerne: membreConcerne || null, raison_probleme: raisonProbleme || null } : t)))
    try {
      await updateMaTache(id, statut, membreConcerne, raisonProbleme)
      showToast('Statut mis à jour ✓')
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut')
      refreshTaches()
    } finally {
      setSavingId(null)
    }
  }, [showToast, refreshTaches])

  const tachesEnCoursCount = taches.filter((t) => t.statut === 'en_cours').length

  const collabName = user?.nom || 'Collaborateur'

  if (role !== 'collaborateur') {
    return (
      <div className={`admin-root${dark ? ' dark' : ''}`}>
        <div className="content" style={{ padding: '28px 32px 60px' }}>
          <div className="page-head">
            <h2>Tableau de bord</h2>
            <p>Bienvenue, {collabName}.</p>
          </div>
          <div className="card">
            <div className="card-head">
              <div><h2>Votre espace</h2><div className="hint">Aucune information supplémentaire pour le moment</div></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-root${dark ? ' dark' : ''}`}>
      <div className="app app-horizontal">
        <nav className="topnav">
          <div className="topnav-left">
            <EspritLogo full />
            <div className="topnav-links">
              {NAV_TABS.map((item) => {
                const IconCmp = Icon[item.icon]
                const showBadge = item.page === 'taches' && tachesEnCoursCount > 0
                return (
                  <a
                    key={item.page}
                    href="#"
                    className={activePage === item.page ? 'active' : ''}
                    onClick={(e) => { e.preventDefault(); setActivePage(item.page) }}
                  >
                    <IconCmp />
                    {item.label}
                    {showBadge && <span className="badge">{tachesEnCoursCount}</span>}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="topnav-right">
            <select
              className="select-chip"
              value={filtreAnnee}
              onChange={(e) => setFiltreAnnee(e.target.value)}
              title="Filtrer par année universitaire"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
            >
              {anneesOptions.map((a) => <option key={a} value={a}>{a.replace('/', ' / ')}</option>)}
            </select>
            <select
              className="select-chip"
              value={filtreSemestre}
              onChange={(e) => setFiltreSemestre(e.target.value)}
              title="Filtrer par semestre"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
            >
              {SEMESTRE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <NotificationBell onNavigate={setActivePage} />
            <div className="role-chip-inline">COLLABORATEUR</div>
            <div className="avatar sm" title="Se déconnecter" style={{ cursor: 'pointer' }} onClick={logout}>{initials(collabName)}</div>
          </div>
        </nav>

        <main className="main">
          <div className="content">
            {!periodeEstActive && activePage !== 'profil' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, background: 'var(--amber-tint, #FEF3C7)',
                color: '#9A6600', border: '1px solid #F5D68A', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600,
              }}>
                🔒 Période archivée ({filtreAnnee} · {filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'}) — lecture seule, aucune création ni modification possible. La période active est {params?.annee_universitaire} · {params?.semestre_actif === 'S1' ? 'Semestre 1' : 'Semestre 2'}.
              </div>
            )}
            {activePage === 'profil' ? (
              <MonProfil user={user} showToast={showToast} dark={dark} onToggleDark={toggleDark} updateUser={updateUser} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
            ) : (
            <fieldset disabled={!periodeEstActive} style={{ border: 0, margin: 0, padding: 0 }}>
            {activePage === 'taches' && (
              <>
                <MesTachesHub
                  showToast={showToast}
                  taches={taches}
                  loading={tachesLoading}
                  savingId={savingId}
                  changerStatut={changerStatutTache}
                  currentUserId={user?.id_collaborateur}
                  demandesCount={demandesCount}
                  filtreAnnee={filtreAnnee}
                  filtreSemestre={filtreSemestre}
                  onTacheChoisie={refreshTaches}
                />
                <div className="card">
                  <div className="card-head"><div><h2>Statistiques (Power BI natif)</h2><div className="hint">Mon espace</div></div></div>
                  <div style={{ padding: '0 20px 20px' }}><StatsDashboard scope="mon-espace" annee={filtreAnnee} semestre={filtreSemestre} /></div>
                </div>
              </>
            )}
            {activePage === 'horsequipe' && <ActivitesHorsEquipe showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />}
            {activePage === 'voeux-pedagogiques' && <VoeuxPedagogiquesCollab showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />}
            {activePage === 'classes-affectees' && <ClassesAffectees showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />}
            {activePage === 'activite-ecole' && (
              <>
                <MonActiviteEcole showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} anneesOptions={anneesOptions} />
                <div style={{ marginTop: 24 }}>
                  <ActiviteEcoleTousLesCollegues showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} currentUserId={user?.id_collaborateur} />
                </div>
              </>
            )}
            </fieldset>
            )}
          </div>
        </main>
      </div>

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <span>{toastMsg}</span>
      </div>
    </div>
  )
}

/* ================= MES TÂCHES — vue d'ensemble (3 onglets) =================
   Consolide, en lecture seule, les 3 volets de l'implication du collaborateur :
   ses tâches, ses demandes hors-équipe et son activité école — filtrables par
   année/semestre. La saisie elle-même (nouvelle demande, nouvelle activité)
   reste sur les pages dédiées de la barre de navigation. */
const MES_TACHES_SOUS_ONGLETS = [
  { key: 'mes-taches', label: 'Mes tâches' },
  { key: 'horsequipe', label: 'Activités hors-équipe' },
  { key: 'activite-ecole', label: 'Activité école' },
]

function MesTachesHub({ showToast, taches, loading, savingId, changerStatut, currentUserId, demandesCount, filtreAnnee, filtreSemestre, onTacheChoisie }) {
  const [sousOnglet, setSousOnglet] = useState('mes-taches')

  return (
    <>
      <div className="page-head">
        <h2>Mes tâches</h2>
        <p>Vue d'ensemble de votre implication : tâches assignées, demandes hors-équipe et activité école.</p>
      </div>
      <div className="tab-pills" style={{ marginBottom: 18 }}>
        {MES_TACHES_SOUS_ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={`tab-pill ${sousOnglet === o.key ? 'active' : ''}`}
            onClick={() => setSousOnglet(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {sousOnglet === 'mes-taches' && (
        <MesTaches
          showToast={showToast}
          taches={taches}
          loading={loading}
          savingId={savingId}
          changerStatut={changerStatut}
          currentUserId={currentUserId}
          demandesCount={demandesCount}
          filtreAnnee={filtreAnnee}
          filtreSemestre={filtreSemestre}
          onTacheChoisie={onTacheChoisie}
        />
      )}
      {sousOnglet === 'horsequipe' && (
        <DemandesApercu showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
      )}
      {sousOnglet === 'activite-ecole' && (
        <ActiviteEcoleApercu showToast={showToast} filtreAnnee={filtreAnnee} filtreSemestre={filtreSemestre} />
      )}
    </>
  )
}

/* ---------- Onglet "Activités hors-équipe" de Mes tâches (lecture seule) ----------
   Même liste que la page "Activités hors-équipe", sans le formulaire de saisie —
   la déclaration d'une nouvelle activité se fait uniquement depuis cette page dédiée. */
function DemandesApercu({ showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [demandes, setDemandes] = useState([])
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    getMesDemandes()
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de vos activités') })
      .finally(() => setLoading(false))
  }, [showToast])

  // Re-rendu périodique (sans re-fetch) pour recalculer, à la minute près, quel statut
  // "Faite" a dépassé le délai d'une heure et doit perdre son menu déroulant.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const demandesFiltrees = demandes.filter((d) => estDansPeriode(d.date_reception, filtreAnnee, filtreSemestre))

  const changerStatut = async (id, statut) => {
    setSavingId(id)
    // Mise à jour optimiste — le badge change immédiatement, sans réactualisation.
    setDemandes((prev) => prev.map((d) => (
      d.id_demande === id ? { ...d, statut, date_validation: statut === 'faite' ? new Date().toISOString() : null } : d
    )))
    try {
      await updateStatutDemande(id, statut)
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la mise à jour du statut')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Activités hors-équipe</h2>
          <div className="hint">
            {loading ? 'Chargement…' : `${demandesFiltrees.length} activité${demandesFiltrees.length > 1 ? 's' : ''} sur la période sélectionnée`}
          </div>
        </div>
      </div>
      <div className="list">
        {demandesFiltrees.map((d) => (
          <div className="list-item" key={d.id_demande}>
            <div className="body">
              <div className="title">{d.titre}</div>
              <div className="desc">
                {d.equipes_noms ? `${d.equipes_noms} · ` : d.sous_equipe_nom ? `${d.sous_equipe_nom} · ` : d.up_nom ? `${d.up_nom} · ` : ''}{relativeDays(d.date_reception)}
              </div>
            </div>
            {estDemandeVerrouilleeParDelai(d) ? (
              <span className="badge validee" title="Le statut ne peut plus être modifié une heure après validation">
                Faite ✓ (verrouillée)
              </span>
            ) : (
              <select
                className="status-select"
                value={d.statut}
                disabled={savingId === d.id_demande}
                onChange={(e) => changerStatut(d.id_demande, e.target.value)}
              >
                {Object.entries(DEMANDE_STATUTS).map(([value, s]) => (
                  <option key={value} value={value}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        {!loading && demandesFiltrees.length === 0 && (
          <div className="list-item"><div className="body"><div className="desc">Aucune activité sur cette période</div></div></div>
        )}
      </div>
    </div>
  )
}

/* ---------- Onglet "Activité école" de Mes tâches (lecture seule) ----------
   Résumé de sa propre activité école (les 7 catégories), filtré par année/semestre.
   La saisie se fait uniquement depuis la page dédiée "Activité école" (onglet "Mon
   activité école"). */
function ActiviteEcoleApercu({ showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({
    expertises: [], encadrements: [],
    membre_jury: [], president_jury: [],
    formation_ete: [], formation_hiver: [], formation_printemps: [],
    evenement: [], comite_organisation: [],
  })

  const refresh = useCallback(() => (
    getMonActiviteEcole()
      .then(setDetail)
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de votre activité école') })
      .finally(() => setLoading(false))
  ), [showToast])

  useEffect(() => { refresh() }, [refresh])

  // Rafraîchissement périodique — pour voir apparaître, sans recharger la page, une
  // activité ajoutée depuis l'onglet "Activité école".
  useEffect(() => {
    const id = setInterval(refresh, 20000)
    return () => clearInterval(id)
  }, [refresh])

  const sectionsFiltrees = Object.keys(ACTIVITE_LABELS).map((type) => ({
    type,
    list: (detail[type] || []).filter((a) => estDansPeriode(a.date_activite, filtreAnnee, filtreSemestre)),
  }))
  const totalFiltre = sectionsFiltrees.reduce((sum, s) => sum + s.list.length, 0)

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Activité école</h2>
          <div className="hint">{loading ? 'Chargement…' : `${totalFiltre} entrée${totalFiltre > 1 ? 's' : ''} sur la période sélectionnée`}</div>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)' }}>Chargement…</div>
      ) : (
        <div className="ae-body">
          {sectionsFiltrees.filter((s) => s.list.length > 0).map(({ type, list }) => {
            const { icon: sectionIcon, color: sectionColor } = ACTIVITE_ICONS[type]
            return (
              <div className="ae-section" key={type}>
                <div className="ae-section-head">
                  <div className={`ae-icon ${sectionColor}`}>{sectionIcon}</div>
                  <h3>{ACTIVITE_LABELS[type]}</h3>
                  <span className="ae-count">{list.length}</span>
                </div>
                <div className="ae-list">
                  {list.map((a) => (
                    <div key={a.id_activite} className="ae-row">
                      <div className="ae-row-main">
                        <div className="title">{a.titre}</div>
                        {type === 'evenement' && a.role && <span className="ae-date-chip">{a.role}</span>}
                        {a.date_activite && <span className="ae-date-chip"><Icon.calendar />{formatDateShortFr(a.date_activite)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {totalFiltre === 0 && <div className="ae-empty" style={{ padding: '0 20px 20px' }}>Aucune activité sur cette période</div>}
        </div>
      )}
    </div>
  )
}

/* ================= MES TÂCHES (branché à l'API des tâches) ================= */
// Un collaborateur pouvant appartenir à plusieurs sous-équipes, un filtre par
// équipe est proposé au-dessus de la liste.
// Passé ce délai après validation, le statut "Faite" est verrouillé (même règle que
// côté serveur, voir taches.controller.js -> estVerrouilleeParDelai).
const DELAI_VERROUILLAGE_FAITE_MS = 60 * 60 * 1000
const MAX_MOTS_RAISON_PROBLEME = 46
function compterMots(texte) {
  return String(texte || '').trim().split(/\s+/).filter(Boolean).length
}
function estVerrouilleeParDelai(t) {
  if (t.statut !== 'validee' || !t.date_validation) return false
  return Date.now() - new Date(t.date_validation).getTime() > DELAI_VERROUILLAGE_FAITE_MS
}
// Même règle pour les activités hors-équipe : verrouillées une heure après passage à "faite".
function estDemandeVerrouilleeParDelai(d) {
  if (d.statut !== 'faite' || !d.date_validation) return false
  return Date.now() - new Date(d.date_validation).getTime() > DELAI_VERROUILLAGE_FAITE_MS
}

function MesTaches({ showToast, taches, loading, savingId, changerStatut, currentUserId, demandesCount, filtreAnnee, filtreSemestre, onTacheChoisie }) {
  const [equipeFiltre, setEquipeFiltre] = useState('toutes')
  // Ligne d'édition ouverte pour préciser le membre concerné + la raison (statut "Problème de coordination")
  const [coordEdit, setCoordEdit] = useState(null) // { id, idSousEquipe, value, raison }
  // Cache des membres par sous-équipe, pour remplir le menu déroulant "membre concerné"
  const [membresParEquipe, setMembresParEquipe] = useState({})
  const [membresLoading, setMembresLoading] = useState(false)
  // Filtre déclenché par les cartes KPI "Tâches en cours" / "Tâches réalisées" :
  // cliquer une carte filtre la liste sur ce statut, recliquer la même carte retire le filtre.
  const [statutFiltre, setStatutFiltre] = useState(null) // null | 'en_cours' | 'validee'
  const toggleStatutFiltre = (statut) => setStatutFiltre((prev) => (prev === statut ? null : statut))

  // Re-rendu périodique (sans re-fetch) uniquement pour recalculer, à la minute près,
  // quelles tâches "Faite" ont dépassé le délai d'une heure et doivent perdre leur menu.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const equipes = Array.from(new Set(taches.map((t) => t.sous_equipe_nom).filter(Boolean))).sort()

  // Le filtre Année/Semestre du haut de page s'applique en plus du filtre par équipe et du
  // filtre de statut (cartes KPI). Les tâches sans période enregistrée (anciennes données,
  // avant migration) restent visibles quel que soit le filtre, pour ne rien faire disparaître
  // silencieusement.
  const tachesFiltrees = taches
    .filter((t) => equipeFiltre === 'toutes' || t.sous_equipe_nom === equipeFiltre)
    .filter((t) => !statutFiltre || t.statut === statutFiltre)
    .filter((t) => !t.annee_universitaire || t.annee_universitaire === filtreAnnee)
    .filter((t) => !t.semestre || t.semestre === filtreSemestre)

  const enCours = taches.filter((t) => t.statut === 'en_cours').length
  const validees = taches.filter((t) => t.statut === 'validee').length

  const chargerMembres = useCallback((idSousEquipe) => {
    if (!idSousEquipe || membresParEquipe[idSousEquipe]) return
    setMembresLoading(true)
    getMembresSousEquipe(idSousEquipe)
      .then((data) => setMembresParEquipe((prev) => ({ ...prev, [idSousEquipe]: Array.isArray(data) ? data : [] })))
      .catch((err) => { console.error(err); showToast("Erreur lors du chargement des membres de l'équipe") })
      .finally(() => setMembresLoading(false))
  }, [membresParEquipe, showToast])

  const onChangeStatut = (t, value) => {
    if (value === 'probleme_coordination') {
      setCoordEdit({ id: t.id_tache, idSousEquipe: t.id_sous_equipe, value: t.membre_concerne || '', raison: t.raison_probleme || '' })
      chargerMembres(t.id_sous_equipe)
      return
    }
    setCoordEdit((prev) => (prev?.id === t.id_tache ? null : prev))
    changerStatut(t.id_tache, value)
  }

  const nbMotsRaison = compterMots(coordEdit?.raison)

  const confirmerCoordination = (id) => {
    const membre = (coordEdit?.value || '').trim()
    if (!membre) { showToast('Veuillez préciser le membre concerné'); return }
    const raison = (coordEdit?.raison || '').trim()
    if (!raison) { showToast('Veuillez expliquer le problème'); return }
    if (compterMots(raison) > MAX_MOTS_RAISON_PROBLEME) {
      showToast(`La raison ne doit pas dépasser ${MAX_MOTS_RAISON_PROBLEME} mots`)
      return
    }
    changerStatut(id, 'probleme_coordination', membre, raison)
    setCoordEdit(null)
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 760 }}>
        <div
          className={`kpi clickable${statutFiltre === 'en_cours' ? ' active' : ''}`}
          role="button"
          tabIndex={0}
          title={statutFiltre === 'en_cours' ? 'Cliquez pour retirer le filtre' : 'Filtrer sur les tâches en cours'}
          onClick={() => toggleStatutFiltre('en_cours')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatutFiltre('en_cours') } }}
        >
          <div className="top"><div className="icon-wrap blue"><Icon.clock /></div></div><div className="num">{enCours}</div><div className="label">Tâches en cours</div>
        </div>
        <div
          className={`kpi clickable${statutFiltre === 'validee' ? ' active' : ''}`}
          role="button"
          tabIndex={0}
          title={statutFiltre === 'validee' ? 'Cliquez pour retirer le filtre' : 'Filtrer sur les tâches réalisées'}
          onClick={() => toggleStatutFiltre('validee')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatutFiltre('validee') } }}
        >
          <div className="top"><div className="icon-wrap green"><Icon.task /></div></div><div className="num">{validees}</div><div className="label">Tâches réalisées</div>
        </div>
        <div className="kpi"><div className="top"><div className="icon-wrap red"><Icon.requests /></div></div><div className="num">{demandesCount}</div><div className="label">Activités hors-équipe</div></div>
      </div>

      <TachesDisponibles showToast={showToast} onChoisie={onTacheChoisie} />

      <div className="card">
        <div className="card-head">
          <div><h2>Mes tâches</h2><div className="hint">{loading ? 'Chargement…' : `${tachesFiltrees.length} tâche${tachesFiltrees.length > 1 ? 's' : ''} assignée${tachesFiltrees.length > 1 ? 's' : ''}`}</div></div>
          {equipes.length > 0 && (
            <select
              className="status-select"
              value={equipeFiltre}
              onChange={(e) => setEquipeFiltre(e.target.value)}
              title="Filtrer par sous-équipe"
            >
              <option value="toutes">Toutes les équipes</option>
              {equipes.map((nom) => <option key={nom} value={nom}>{nom}</option>)}
            </select>
          )}
        </div>
        <div className="list">
          {tachesFiltrees.map((t) => {
            const isEditingCoord = coordEdit?.id === t.id_tache
            const membresEquipe = (membresParEquipe[t.id_sous_equipe] || []).filter((m) => m.id_collaborateur !== currentUserId)
            const verrouillee = estVerrouilleeParDelai(t)
            return (
              <div className="list-item" key={t.id_tache} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div className="body">
                    <div className="title">{t.titre}</div>
                    {t.description && <div className="desc">{t.description}</div>}
                    <div className="meta">
                      {t.date_echeance && <span>Échéance : {formatDateShortFr(t.date_echeance)}</span>}
                      {t.priorite && <span className={`badge ${t.priorite}`}>{PRIORITE_LABELS[t.priorite] || 'Moyenne'}</span>}
                      {t.sous_equipe_nom && <span>{t.sous_equipe_nom}</span>}
                      {t.statut === 'a_refaire' && <span className="badge nonrealisee">À refaire</span>}
                      {t.statut === 'probleme_coordination' && t.membre_concerne && (
                        <span>Membre concerné : {t.membre_concerne}</span>
                      )}
                    </div>
                    {t.statut === 'probleme_coordination' && t.raison_probleme && (
                      <div className="desc" style={{ marginTop: 4 }}>« {t.raison_probleme} »</div>
                    )}
                  </div>
                  {verrouillee ? (
                    <span className="badge validee" title="Le statut ne peut plus être modifié une heure après validation">
                      Faite ✓ (verrouillée)
                    </span>
                  ) : (
                    <select
                      className="status-select"
                      value={isEditingCoord ? 'probleme_coordination' : (t.statut === 'a_faire' ? '' : t.statut)}
                      disabled={savingId === t.id_tache}
                      onChange={(e) => onChangeStatut(t, e.target.value)}
                    >
                      {t.statut === 'a_faire' && !isEditingCoord && <option value="" disabled>À faire</option>}
                      {TACHE_STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  )}
                </div>
                {isEditingCoord && (
                  <div className="coord-field open" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    <select
                      value={coordEdit.value}
                      onChange={(e) => setCoordEdit({ ...coordEdit, value: e.target.value })}
                      disabled={membresLoading}
                      autoFocus
                    >
                      <option value="" disabled>
                        {membresLoading ? 'Chargement des membres…' : 'Choisir le membre concerné'}
                      </option>
                      {membresEquipe.map((m) => (
                        <option key={m.id_collaborateur} value={m.nom}>{m.nom}</option>
                      ))}
                    </select>
                    <div>
                      <textarea
                        rows={2}
                        placeholder="Expliquez brièvement le problème (46 mots maximum)"
                        value={coordEdit.raison}
                        onChange={(e) => setCoordEdit({ ...coordEdit, raison: e.target.value })}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                      <div className="hint" style={{ textAlign: 'right', color: nbMotsRaison > MAX_MOTS_RAISON_PROBLEME ? 'var(--red)' : undefined }}>
                        {nbMotsRaison} / {MAX_MOTS_RAISON_PROBLEME} mots
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" type="button" onClick={() => confirmerCoordination(t.id_tache)}>Confirmer</button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCoordEdit(null)}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {!loading && tachesFiltrees.length === 0 && (
            <div className="list-item"><div className="body"><div className="desc">Aucune tâche assignée pour le moment</div></div></div>
          )}
        </div>
      </div>
    </>
  )
}

/* ---------- Pool de tâches non assignées, ouvertes au choix du collaborateur ----------
   Le responsable publie des tâches sans les assigner à quelqu'un en particulier ; tous
   les membres de l'équipe en sont notifiés (in-app + e-mail) et peuvent en choisir une,
   dans la limite du nombre de tâches actives ("à faire"/"en cours") qu'ils ont le droit
   de cumuler en même temps. */
function TachesDisponibles({ showToast, onChoisie }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ taches: [], limite: 3, taches_actives: 0, places_restantes: 0 })
  const [selectedId, setSelectedId] = useState('')
  const [choosing, setChoosing] = useState(false)

  const refresh = useCallback(() => (
    getTachesDisponibles()
      .then((d) => setData(d && typeof d === 'object' ? d : { taches: [], limite: 3, taches_actives: 0, places_restantes: 0 }))
      .catch((err) => console.error('Erreur chargement des tâches disponibles:', err))
      .finally(() => setLoading(false))
  ), [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 20000)
    return () => clearInterval(id)
  }, [refresh])

  // Si la tâche sélectionnée disparaît de la liste (prise par quelqu'un d'autre,
  // rafraîchissement périodique…), on réinitialise la sélection.
  useEffect(() => {
    if (selectedId && !data.taches.some((t) => String(t.id_tache) === String(selectedId))) {
      setSelectedId('')
    }
  }, [data.taches, selectedId])

  const tacheSelectionnee = data.taches.find((t) => String(t.id_tache) === String(selectedId))

  const choisir = async () => {
    if (!tacheSelectionnee) return
    if (data.places_restantes <= 0) {
      showToast(`Limite atteinte (${data.limite} tâches actives maximum) — terminez-en une avant d'en choisir une nouvelle`)
      return
    }
    setChoosing(true)
    try {
      await choisirTache(tacheSelectionnee.id_tache)
      showToast(`Tâche "${tacheSelectionnee.titre}" ajoutée à vos tâches ✓`)
      setSelectedId('')
      // Rafraîchit la liste des tâches disponibles (celle-ci disparaît) ET la liste
      // "Mes tâches" du parent, pour qu'elle apparaisse immédiatement sans recharger la page.
      await Promise.all([refresh(), onChoisie ? onChoisie() : Promise.resolve()])
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la prise en charge de la tâche')
      await refresh()
    } finally {
      setChoosing(false)
    }
  }

  if (!loading && data.taches.length === 0) return null

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Tâches disponibles à choisir</h2>
          <div className="hint">
            {loading
              ? 'Chargement…'
              : `${data.taches.length} tâche${data.taches.length > 1 ? 's' : ''} publiée${data.taches.length > 1 ? 's' : ''} par votre responsable · ${data.places_restantes} place${data.places_restantes > 1 ? 's' : ''} disponible${data.places_restantes > 1 ? 's' : ''} (max ${data.limite} tâches actives)`}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ flex: '1 1 260px' }}
          >
            <option value="">— Sélectionnez une tâche —</option>
            {data.taches.map((t) => (
              <option key={t.id_tache} value={t.id_tache}>
                {t.titre}{t.date_echeance ? ` · Échéance : ${formatDateShortFr(t.date_echeance)}` : ''}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={!tacheSelectionnee || choosing || data.places_restantes <= 0}
            onClick={choisir}
            title={data.places_restantes <= 0 ? 'Limite de tâches actives atteinte' : 'Choisir cette tâche'}
          >
            {choosing ? 'Prise en charge…' : 'Choisir'}
          </button>
        </div>
        {tacheSelectionnee && (
          <div className="list-item" style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
            <div className="body">
              <div className="title">{tacheSelectionnee.titre}</div>
              {tacheSelectionnee.description && <div className="desc">{tacheSelectionnee.description}</div>}
              <div className="meta">
                {tacheSelectionnee.date_echeance && <span>Échéance : {formatDateShortFr(tacheSelectionnee.date_echeance)}</span>}
                {tacheSelectionnee.priorite && <span className={`badge ${tacheSelectionnee.priorite}`}>{PRIORITE_LABELS[tacheSelectionnee.priorite] || 'Moyenne'}</span>}
                {tacheSelectionnee.sous_equipe_nom && <span>{tacheSelectionnee.sous_equipe_nom}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= ACTIVITÉS HORS-ÉQUIPE (branché à l'API des demandes) ================= */
/* Dropdown à choix multiple (fermé par défaut, comme un <select>) — utilisé pour
   choisir plusieurs équipes (sous-équipes et/ou équipes hors UP) à la fois dans le
   formulaire "Nouvelle activité hors-équipe". `groups` : [{ label, options: [{ value, label }] }]. */
function EquipesMultiSelect({ groups, selected, onToggle }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allOptions = groups.flatMap((g) => g.options)
  const selectedLabels = selected
    .map((v) => allOptions.find((o) => o.value === v)?.label)
    .filter(Boolean)

  return (
    <div className="multiselect" ref={wrapRef}>
      <button
        type="button"
        className={`multiselect-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selectedLabels.length ? '' : 'placeholder'}>
          {selectedLabels.length === 0
            ? '— Choisir une ou plusieurs équipes —'
            : selectedLabels.length <= 2
              ? selectedLabels.join(', ')
              : `${selectedLabels.length} équipes sélectionnées`}
        </span>
        <svg className="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="multiselect-panel">
          {allOptions.length === 0 && (
            <div className="multiselect-empty">Vous n'appartenez à aucune sous-équipe ni équipe hors UP pour le moment.</div>
          )}
          {groups.map((g) => (g.options.length > 0 ? (
            <div key={g.label}>
              <div className="multiselect-group-label">{g.label}</div>
              {g.options.map((o) => (
                <label key={o.value} className="multiselect-option">
                  <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          ) : null))}
        </div>
      )}
    </div>
  )
}

function ActivitesHorsEquipe({ showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [demandes, setDemandes] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [mesEquipes, setMesEquipes] = useState([])
  const [mesEquipesHorsUp, setMesEquipesHorsUp] = useState([])

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  // Chaque entrée est "se-<id>" (sous-équipe) ou "up-<id>" (équipe hors UP) — le
  // collaborateur peut cocher plusieurs équipes à la fois, de l'un ou l'autre type ;
  // chacune notifiera son propre responsable.
  const [equipesChoisies, setEquipesChoisies] = useState([])

  const refresh = useCallback(() => (
    getMesDemandes()
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de vos activités') })
      .finally(() => setLoading(false))
  ), [showToast])

  useEffect(() => { refresh() }, [refresh])

  // Rafraîchissement périodique — pour voir apparaître, sans recharger la page, une
  // éventuelle activité créée depuis un autre appareil du même compte.
  useEffect(() => {
    const id = setInterval(refresh, 20000)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    getMesEquipesAvecResponsable()
      .then((data) => setMesEquipes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement de mes sous-équipes:', err))
    getMesEquipesHorsUpAvecResponsable()
      .then((data) => setMesEquipesHorsUp(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement de mes équipes hors UP:', err))
  }, [])

  const demandesFiltrees = demandes.filter((d) => estDansPeriode(d.date_reception, filtreAnnee, filtreSemestre))

  const toggleEquipe = (value) => {
    setEquipesChoisies((prev) => (
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    ))
  }

  // Résout chaque "se-<id>"/"up-<id>" coché en objet équipe complet (avec responsable),
  // pour l'affichage et pour construire le payload envoyé au serveur.
  const equipesResolues = equipesChoisies
    .map((value) => {
      const [type, idRaw] = value.split('-')
      if (type === 'se') return mesEquipes.find((e) => String(e.id_sous_equipe) === idRaw)
      if (type === 'up') return mesEquipesHorsUp.find((e) => String(e.id_up) === idRaw)
      return null
    })
    .filter(Boolean)
  const responsablesAPrevenir = [...new Set(equipesResolues.map((e) => e.responsable_nom).filter(Boolean))]
  const avertissementDate = warningPeriode(dateDebut, dateFin)

  const soumettre = async () => {
    if (!titre.trim()) { showToast('Le titre est requis'); return }
    if (dateDebut && dateFin && new Date(dateDebut) > new Date(dateFin)) {
      showToast('La date de début ne peut pas être après la date de fin')
      return
    }
    setSubmitting(true)
    try {
      const created = await creerDemande({
        titre: titre.trim(),
        description: description.trim() || null,
        date_debut: dateDebut || null,
        date_fin: dateFin || null,
        equipes: equipesChoisies.map((value) => {
          const [type, idRaw] = value.split('-')
          return { type: type === 'se' ? 'sous_equipe' : 'hors_up', id: idRaw }
        }),
      })
      // Ajout optimiste — pas besoin d'actualiser la page pour la voir apparaître.
      setDemandes((prev) => [created, ...prev])
      setTitre(''); setDescription(''); setDateDebut(''); setDateFin(''); setEquipesChoisies([])
      showToast(responsablesAPrevenir.length
        ? `${responsablesAPrevenir.join(', ')} a${responsablesAPrevenir.length > 1 ? 'ont' : ''} été informé(e)(s) ✓`
        : 'Activité enregistrée ✓')
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'enregistrement de l'activité")
    } finally {
      setSubmitting(false)
    }
  }

  const changerStatut = async (id, statut) => {
    setSavingId(id)
    // Mise à jour optimiste — le badge change immédiatement, sans réactualisation.
    setDemandes((prev) => prev.map((d) => (
      d.id_demande === id ? { ...d, statut, date_validation: statut === 'faite' ? new Date().toISOString() : null } : d
    )))
    try {
      await updateStatutDemande(id, statut)
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la mise à jour du statut')
      refresh()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Activités hors-équipe</h2>
        <p>Déclarez une intervention, collaboration, publication ou séminaire réalisé en dehors de votre sous-équipe. Les responsables choisis sont simplement informés — il n'y a rien à valider.</p>
      </div>
      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Nouvelle activité hors-équipe</h2><div className="hint">Intervention externe, collaboration, publication, séminaire…</div></div></div>
            <div className="form-grid">
              <div className="field full">
                <label>Titre</label>
                <input type="text" placeholder="Ex. Intervention lors du séminaire IEEE Tunisie" value={titre} onChange={(e) => setTitre(e.target.value)} />
              </div>
              <div className="field full">
                <label>Description</label>
                <input type="text" placeholder="Ex. Partenariat institution externe" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="field full">
                <label>Équipe(s) concernée(s)</label>
                <EquipesMultiSelect
                  groups={[
                    { label: 'Sous-équipes', options: mesEquipes.map((e) => ({ value: `se-${e.id_sous_equipe}`, label: e.nom })) },
                    { label: 'Équipes hors UP', options: mesEquipesHorsUp.map((e) => ({ value: `up-${e.id_up}`, label: e.nom })) },
                  ]}
                  selected={equipesChoisies}
                  onToggle={toggleEquipe}
                />
                {equipesResolues.length > 0 && (
                  <div className="multiselect-chips">
                    {equipesResolues.map((e) => {
                      const value = e.id_sous_equipe !== undefined ? `se-${e.id_sous_equipe}` : `up-${e.id_up}`
                      return (
                        <span className="multiselect-chip" key={value}>
                          {e.nom}
                          <button type="button" onClick={() => toggleEquipe(value)} aria-label={`Retirer ${e.nom}`}>×</button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="field full">
                <label>Responsable(s) à prévenir</label>
                <input type="text" value={responsablesAPrevenir.length ? responsablesAPrevenir.join(', ') : '—'} disabled readOnly />
              </div>
              <div className="field">
                <label>Date de début</label>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div className="field">
                <label>Date de fin</label>
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
              {avertissementDate && (
                <div className="field full"><div className="date-warning">⚠ {avertissementDate}</div></div>
              )}
              <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="button" disabled={submitting} onClick={soumettre}>
                  {submitting ? 'Envoi…' : "Déclarer l'activité"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Mes activités</h2><div className="hint">{loading ? 'Chargement…' : `${demandesFiltrees.length} activité${demandesFiltrees.length > 1 ? 's' : ''} sur la période sélectionnée`}</div></div>
            </div>
            <div className="list">
              {demandesFiltrees.map((d) => (
                <div className="list-item" key={d.id_demande}>
                  <div className="body">
                    <div className="title">{d.titre}</div>
                    <div className="desc">
                      {d.equipes_noms ? `${d.equipes_noms} · ` : d.sous_equipe_nom ? `${d.sous_equipe_nom} · ` : d.up_nom ? `${d.up_nom} · ` : ''}{relativeDays(d.date_reception)}
                    </div>
                  </div>
                  {estDemandeVerrouilleeParDelai(d) ? (
                    <span className="badge validee" title="Le statut ne peut plus être modifié une heure après validation">
                      Faite ✓ (verrouillée)
                    </span>
                  ) : (
                    <select
                      className="status-select"
                      value={d.statut}
                      disabled={savingId === d.id_demande}
                      onChange={(e) => changerStatut(d.id_demande, e.target.value)}
                    >
                      {Object.entries(DEMANDE_STATUTS).map(([value, s]) => (
                        <option key={value} value={value}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              {!loading && demandesFiltrees.length === 0 && (
                <div className="list-item"><div className="body"><div className="desc">Aucune activité sur cette période</div></div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= VŒUX PÉDAGOGIQUES (formulaire dynamique construit par l'admin) =================
   L'admin crée un formulaire (questions + modules/classes) par campagne dans le tableau de
   bord Admin ; le collaborateur répond ici, puis l'admin affecte les classes selon les
   réponses (chaque classe affectée à un module disparaît ensuite du pool disponible). */

function ModulePicker({ items, selected, onToggle, disabled, empty, labelFor }) {
  if (!items || items.length === 0) {
    return <div className="hint">{empty || 'Aucune option proposée pour le moment.'}</div>
  }
  return (
    <div>
      {items.map((m) => {
        const isSelected = selected.includes(m)
        return (
          <div
            key={m}
            className={`vow-chip${isSelected ? ' selected' : ''}`}
            onClick={() => !disabled && onToggle(m)}
            style={disabled ? { cursor: 'default', opacity: 0.75 } : undefined}
          >
            <div className="left"><span className="rank">{isSelected ? '✓' : ''}</span>{labelFor ? labelFor(m) : m}</div>
          </div>
        )
      })}
    </div>
  )
}

function SingleChoicePicker({ items, value, onChange, disabled, empty }) {
  if (!items || items.length === 0) {
    return <div className="hint">{empty || 'Aucune option proposée pour le moment.'}</div>
  }
  return (
    <div>
      {items.map((m) => {
        const isSelected = value === m
        return (
          <div
            key={m}
            className={`vow-chip${isSelected ? ' selected' : ''}`}
            onClick={() => !disabled && onChange(m)}
            style={disabled ? { cursor: 'default', opacity: 0.75 } : undefined}
          >
            <div className="left"><span className="rank">{isSelected ? '✓' : ''}</span>{m}</div>
          </div>
        )
      })}
    </div>
  )
}

function estReponseVide(valeur) {
  return valeur === undefined || valeur === null || valeur === '' || (Array.isArray(valeur) && valeur.length === 0)
}

function VoeuxQuestionField({ question, valeur, onChange, disabled, nomsModules, niveauxParModule }) {
  if (question.type === 'texte') {
    return (
      <textarea
        disabled={disabled}
        value={valeur || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Votre réponse…"
      />
    )
  }
  if (question.type === 'choix_unique') {
    return <SingleChoicePicker items={question.options} value={valeur || ''} onChange={onChange} disabled={disabled} />
  }
  if (question.type === 'choix_multiple') {
    const selection = Array.isArray(valeur) ? valeur : []
    return (
      <ModulePicker
        items={question.options}
        selected={selection}
        onToggle={(v) => onChange(selection.includes(v) ? selection.filter((x) => x !== v) : [...selection, v])}
        disabled={disabled}
      />
    )
  }
  if (question.type === 'modules') {
    const selection = Array.isArray(valeur) ? valeur : []
    return (
      <ModulePicker
        items={nomsModules}
        selected={selection}
        onToggle={(v) => onChange(selection.includes(v) ? selection.filter((x) => x !== v) : [...selection, v])}
        disabled={disabled}
        empty="Aucun module proposé pour le moment."
        labelFor={(nom) => (niveauxParModule?.[nom] ? `${nom} — ${niveauxParModule[nom]}` : nom)}
      />
    )
  }
  return null
}

function VoeuxReponseAffichage({ valeur, niveauxParModule }) {
  if (estReponseVide(valeur)) return <span className="reponse-empty">Aucune réponse</span>
  if (Array.isArray(valeur)) {
    return <>{valeur.map((v) => (
      <span key={v} className="classe-chip">{niveauxParModule?.[v] ? `${v} — ${niveauxParModule[v]}` : v}</span>
    ))}</>
  }
  return <span className="reponse-value">{String(valeur)}</span>
}

function VoeuxPedagogiquesCollab({ showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [campagne, setCampagne] = useState(null)
  const [reponse, setReponse] = useState(null)
  const [valeurs, setValeurs] = useState({})
  const [saving, setSaving] = useState(false)
  // Le formulaire ne reste ouvert que tant qu'il n'y a pas encore de réponse
  // enregistrée ; une fois envoyé, on repasse en résumé (bouton "Modifier"
  // pour le rouvrir), au lieu de laisser le formulaire visible en permanence.
  const [editing, setEditing] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    return getMonQuestionnaireVoeuxPedagogiques()
      .then((data) => {
        const c = data?.campagne || null
        const r = data?.reponse || null
        setCampagne(c)
        setReponse(r)
        setEditing(!r)
        setValeurs(r?.reponses_par_question || {})
      })
      .catch((err) => { console.error(err); showToast?.('Erreur lors du chargement du questionnaire') })
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { load() }, [load])

  const setValeur = (idQuestion, v) => setValeurs((prev) => ({ ...prev, [idQuestion]: v }))

  // Verrouillage 24h après le premier envoi — au-delà, l'admin peut affecter
  // les collaborateurs sans qu'ils continuent à modifier leurs réponses.
  const heuresDepuisEnvoi = reponse?.date_soumission
    ? (Date.now() - new Date(reponse.date_soumission).getTime()) / 36e5
    : null
  const reponsesVerrouillees = heuresDepuisEnvoi !== null && heuresDepuisEnvoi >= 24
  // Date/heure exacte au-delà de laquelle les réponses seront verrouillées —
  // affichée à l'avance pour prévenir le collaborateur, avant même le verrouillage.
  const dateLimiteModif = reponse?.date_soumission
    ? new Date(new Date(reponse.date_soumission).getTime() + 24 * 3600 * 1000)
    : null

  const submit = () => {
    if (!campagne) return
    if (reponsesVerrouillees) { showToast?.('Vos réponses sont verrouillées 24h après leur envoi et ne sont plus modifiables'); return }
    for (const q of campagne.questions) {
      if (q.obligatoire && estReponseVide(valeurs[q.id_question])) {
        showToast?.(`Merci de répondre à : "${q.intitule}"`)
        return
      }
    }
    setSaving(true)
    saveMaReponseVoeuxPedagogiques({ id_campagne: campagne.id_campagne, reponses: valeurs })
      .then(() => { showToast?.('Réponses enregistrées ✓'); load() })
      .catch((err) => { console.error(err); showToast?.(err.response?.data?.message || "Erreur lors de l'enregistrement") })
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="page-head">
        <h2>Vœux pédagogiques</h2>
        <p>Chargement…</p>
      </div>
    )
  }

  if (!campagne) {
    return (
      <div className="page-head">
        <h2>Vœux pédagogiques</h2>
        <p>Aucun questionnaire n'est ouvert pour le moment. Revenez plus tard.</p>
      </div>
    )
  }

  const questionsTriees = [...(campagne.questions || [])].sort((a, b) => a.ordre - b.ordre)
  const modulesParQuestion = (idQuestion) => (campagne.modules || []).filter((m) => m.id_question === idQuestion)
  const nomsModulesParQuestion = (idQuestion) => modulesParQuestion(idQuestion).map((m) => m.nom)
  const niveauxParModuleParQuestion = (idQuestion) =>
    Object.fromEntries(modulesParQuestion(idQuestion).map((m) => [m.nom, m.niveau]))

  return (
    <>
      <div className="page-head">
        <h2>{campagne.titre || 'Vœux pédagogiques'}</h2>
        <p>
          {reponse
            ? (editing
              ? 'Vous pouvez modifier vos réponses tant que le questionnaire reste ouvert.'
              : (reponsesVerrouillees
                ? 'Vos réponses ont bien été envoyées et sont désormais verrouillées.'
                : 'Vos réponses ont bien été envoyées.'))
            : 'Répondez aux questions ci-dessous. Vous aurez 24h après l\'envoi pour les modifier, ensuite elles seront verrouillées.'}
        </p>
        {reponse && !reponsesVerrouillees && dateLimiteModif && (
          <p style={{ color: 'var(--text-faint)', fontSize: 12.5, marginTop: 4 }}>
            ⏳ Modifiable jusqu'au {formatDateHeureShortFr(dateLimiteModif)} — passé ce délai, vos réponses seront verrouillées.
          </p>
        )}
        {campagne.date_creation && !estDansPeriode(campagne.date_creation, filtreAnnee, filtreSemestre) && (
          <p style={{ color: 'var(--amber, #B45309)', fontSize: 12.5, marginTop: 4 }}>
            Ce questionnaire a été créé hors de la période sélectionnée ({filtreAnnee} · {filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'}) — il reste affiché car c'est le questionnaire actuellement ouvert.
          </p>
        )}
      </div>

      {reponse && !editing && (
        <div className="card">
          <div className="card-head"><div><h2>Mes réponses</h2><div className="hint">{reponsesVerrouillees ? 'Envoyées — verrouillées 24h après l\'envoi, elles ne sont plus modifiables.' : `Envoyées — modifiables jusqu'au ${formatDateHeureShortFr(dateLimiteModif)}.`}</div></div></div>
          <div className="reponses-grid">
            {questionsTriees.map((q) => (
              <div key={q.id_question} className={`reponse-item${q.type === 'texte' ? ' full' : ''}`}>
                <div className="reponse-label">{q.intitule}</div>
                <div className="reponse-value"><VoeuxReponseAffichage valeur={valeurs[q.id_question]} niveauxParModule={q.type === 'modules' ? niveauxParModuleParQuestion(q.id_question) : undefined} /></div>
              </div>
            ))}
          </div>
          <div style={{ padding: '4px 20px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {reponsesVerrouillees ? (
              <span style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>
                Envoyées le {formatDateShortFr(reponse.date_soumission)} — verrouillées depuis, non modifiables.
              </span>
            ) : (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Modifier mes réponses</button>
                <span style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>
                  ⏳ Modifiable jusqu'au {formatDateHeureShortFr(dateLimiteModif)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {editing && (
        <>
          {questionsTriees.length === 0 && (
            <div className="card"><div style={{ padding: 20 }} className="hint">Ce formulaire ne contient aucune question pour le moment.</div></div>
          )}
          {questionsTriees.map((q) => (
            <div className="card" key={q.id_question}>
              <div className="card-head"><div><h2>{q.intitule}{q.obligatoire && <span style={{ color: 'var(--red)' }}> *</span>}</h2></div></div>
              <div style={{ padding: '0 20px 16px' }}>
                <VoeuxQuestionField
                  question={q}
                  valeur={valeurs[q.id_question]}
                  onChange={(v) => setValeur(q.id_question, v)}
                  disabled={reponsesVerrouillees}
                  nomsModules={nomsModulesParQuestion(q.id_question)}
                  niveauxParModule={niveauxParModuleParQuestion(q.id_question)}
                />
              </div>
            </div>
          ))}

          <div className="card">
            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {reponse && <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()}>Annuler</button>}
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={submit}>
                {saving ? 'Enregistrement…' : (reponse ? 'Mettre à jour mes réponses' : 'Envoyer mes réponses')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

/* ================= CLASSES AFFECTÉES (page dédiée : une ligne par module, toutes ses
   classes affectées regroupées en puces — alimentée par les mêmes affectations que
   l'onglet Affectation du builder admin, voir getMesAffectationsVoeuxPedagogiques) ================= */
function ClassesAffectees({ showToast, filtreAnnee, filtreSemestre }) {
  const [affectations, setAffectations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMesAffectationsVoeuxPedagogiques()
      .then((data) => setAffectations(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast?.('Erreur lors du chargement des classes affectées') })
      .finally(() => setLoading(false))
  }, [showToast])

  // Comme les activités école, chaque affectation est rattachée à une période via sa
  // date d'affectation — filtrée sur le sélecteur Année/Semestre en haut de page.
  const affectationsFiltrees = affectations.filter((a) => estDansPeriode(a.date_affectation, filtreAnnee, filtreSemestre))

  // Regroupées par module + niveau : une ligne par module avec toutes ses classes.
  const parModule = {}
  affectationsFiltrees.forEach((a) => {
    const cle = `${a.module}::${a.niveau || ''}`
    if (!parModule[cle]) parModule[cle] = { module: a.module, niveau: a.niveau, classes: [] }
    parModule[cle].classes.push(a.classe)
  })
  const lignes = Object.values(parModule).sort((a, b) => (a.module || '').localeCompare(b.module || ''))

  return (
    <>
      <div className="page-head">
        <h2>Classes affectées</h2>
        <p>Les classes qui vous ont été affectées suite à vos vœux pédagogiques.</p>
      </div>
      <div className="card affectations-card">
        <div className="card-head">
          <div>
            <h2>Mes affectations</h2>
            <div className="hint">
              {affectationsFiltrees.length} affectation{affectationsFiltrees.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {loading && <div className="hint" style={{ padding: 20 }}>Chargement…</div>}
        {!loading && (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Niveau</th>
                  <th>Classes</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={`${l.module}::${l.niveau}`}>
                    <td>
                      <div className="module-cell">
                        <span className="module-dot" aria-hidden="true">{(l.module || '?').trim().charAt(0).toUpperCase()}</span>
                        <span className="module-name">{l.module}</span>
                      </div>
                    </td>
                    <td>{l.niveau || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {l.classes.map((c) => <span key={c} className="classe-chip">{c}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
                {lignes.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucune classe affectée sur cette période</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

/* ================= MON PROFIL (branché à l'API : identité, sous-équipes, responsable,
   dernier score et préférences persistées) ================= */
function MonProfil({ user, showToast, dark, onToggleDark, updateUser, filtreAnnee, filtreSemestre }) {
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(null) // 'notifications_email' | 'profil_visible' | null

  const name = profil?.nom || user?.nom || 'Collaborateur'
  const email = profil?.email || user?.email

  useEffect(() => {
    getMonProfil(filtreAnnee, filtreSemestre)
      .then(setProfil)
      .catch((err) => {
        console.error('Erreur chargement du profil:', err)
        showToast?.('Erreur lors du chargement de votre profil')
      })
      .finally(() => setLoading(false))
  }, [showToast, filtreAnnee, filtreSemestre])

  const togglePref = async (key) => {
    if (!profil) return
    const nextValue = !profil[key]
    setProfil((p) => ({ ...p, [key]: nextValue })) // optimiste
    setSavingPref(key)
    try {
      const updated = await updateMesPreferences({ [key]: nextValue }, filtreAnnee, filtreSemestre)
      // Fusion avec l'état existant (et non remplacement) : si la réponse ne renvoie pas
      // certains champs (ex. mes_scores), on ne veut pas les perdre côté UI.
      setProfil((p) => ({ ...p, ...updated }))
    } catch (err) {
      console.error(err)
      setProfil((p) => ({ ...p, [key]: !nextValue })) // rollback
      showToast?.("Erreur lors de la mise à jour de vos préférences")
    } finally {
      setSavingPref(null)
    }
  }

  /* ---------- Édition identité (nom / email) ---------- */
  const [editingIdentite, setEditingIdentite] = useState(false)
  const [nomInput, setNomInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [savingIdentite, setSavingIdentite] = useState(false)

  const ouvrirEditionIdentite = () => {
    setNomInput(name)
    setEmailInput(email || '')
    setEditingIdentite(true)
  }

  const annulerEditionIdentite = () => setEditingIdentite(false)

  const enregistrerIdentite = async () => {
    const nom = nomInput.trim()
    const emailPropre = emailInput.trim()
    if (!nom || !emailPropre) { showToast?.('Le nom et l\'email sont requis'); return }
    setSavingIdentite(true)
    try {
      const updated = await updateMonProfilIdentite({ nom, email: emailPropre }, filtreAnnee, filtreSemestre)
      setProfil((p) => ({ ...p, ...updated }))
      updateUser?.({ nom: updated.nom, email: updated.email })
      setEditingIdentite(false)
      showToast?.('Profil mis à jour ✓')
    } catch (err) {
      console.error(err)
      showToast?.(err?.response?.data?.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setSavingIdentite(false)
    }
  }

  /* ---------- Changement de mot de passe ---------- */
  const [editingPassword, setEditingPassword] = useState(false)
  const [pwActuel, setPwActuel] = useState('')
  const [pwNouveau, setPwNouveau] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const annulerEditionPassword = () => {
    setEditingPassword(false)
    setPwActuel(''); setPwNouveau(''); setPwConfirm('')
  }

  const enregistrerPassword = async () => {
    if (!pwActuel || !pwNouveau) { showToast?.('Merci de remplir tous les champs'); return }
    if (!isPasswordStrong(pwNouveau)) { showToast?.(PASSWORD_RULES_MESSAGE); return }
    if (pwNouveau !== pwConfirm) { showToast?.('La confirmation ne correspond pas au nouveau mot de passe'); return }
    setSavingPassword(true)
    try {
      await changerMonMotDePasse({ mot_de_passe_actuel: pwActuel, nouveau_mot_de_passe: pwNouveau })
      showToast?.('Mot de passe mis à jour ✓')
      annulerEditionPassword()
    } catch (err) {
      console.error(err)
      showToast?.(err?.response?.data?.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setSavingPassword(false)
    }
  }

  const scores = profil?.mes_scores || []
  const historique = profil?.historique_scores || []

  // Pivote les lignes plates (une par équipe × période) en une ligne par période,
  // une colonne par équipe — format attendu par le LineChart recharts ci-dessous.
  const HISTORIQUE_COULEURS = ['#E4032E', '#0d1b6b', '#2196f3', '#f5a623', '#8bc34a']
  const equipesHistorique = []
  const periodesMap = {}
  historique.forEach((h) => {
    const nomEquipe = h.equipe_nom || 'Équipe'
    if (!equipesHistorique.includes(nomEquipe)) equipesHistorique.push(nomEquipe)
    const label = `${h.semestre === 'S1' ? 'S1' : 'S2'} ${h.annee_universitaire}`
    if (!periodesMap[label]) periodesMap[label] = { periode: label }
    periodesMap[label][nomEquipe] = Number(h.score)
  })
  const historiqueData = Object.values(periodesMap)

  return (
    <>
      <div className="card">
        <div className="profile-hero">
          <div className="avatar">{initials(name)}</div>
          <div style={{ flex: 1 }}>
            <div className="pname">{name}</div>
            <div className="prole">Collaborateur{email ? ` · ${email}` : ''}</div>
          </div>
          {!editingIdentite && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={ouvrirEditionIdentite}>Modifier</button>
          )}
        </div>

        {editingIdentite ? (
          <div className="form-grid">
            <div className="field">
              <label>Nom complet</label>
              <input type="text" value={nomInput} onChange={(e) => setNomInput(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </div>
            <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" type="button" disabled={savingIdentite} onClick={annulerEditionIdentite}>Annuler</button>
              <button className="btn btn-primary" type="button" disabled={savingIdentite} onClick={enregistrerIdentite}>
                {savingIdentite ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {email && <div className="info-row"><span className="k">Email</span><span className="v">{email}</span></div>}
            <div className="info-row"><span className="k">Sous-équipes</span><span className="v">{loading ? '…' : (profil?.sous_equipes || '—')}</span></div>
            <div className="info-row"><span className="k">Responsable</span><span className="v">{loading ? '…' : (profil?.responsables || '—')}</span></div>
          </>
        )}
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Mon score</h2><div className="hint">{loading ? 'Chargement…' : (scores.length ? `${scores.length} équipe${scores.length > 1 ? 's' : ''} sur la période sélectionnée` : 'Aucune évaluation calculée pour cette période')}</div></div></div>
            {scores.length === 0 && !loading && (
              <div style={{ padding: '0 20px 16px', color: 'var(--text-faint)', fontSize: 12.5 }}>Aucune évaluation calculée pour cette période</div>
            )}
            {scores.map((s) => {
              const pct = Math.max(0, Math.min(100, (Number(s.score) / 20) * 100))
              const tier = s.score >= 14 ? 'validee' : s.score >= 10 ? 'refaire' : 'nonrealisee'
              return (
                <div className="list-item" key={s.id_score}>
                  <div className="avatar sm">{initials(s.equipe_nom || 'Équipe')}</div>
                  <div className="body" style={{ flex: 1 }}>
                    <div className="title">{s.equipe_nom || 'Équipe'}</div>
                    <div className="desc">{s.semestre === 'S1' ? 'Semestre 1' : 'Semestre 2'} {s.annee_universitaire}</div>
                    <div className="progress-row" style={{ marginTop: 6 }}>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                  </div>
                  <span className={`badge ${tier}`} style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 13, alignSelf: 'center' }}>{s.score}/20</span>
                </div>
              )
            })}
          </div>

          <div className="card">
            <div className="card-head">
              <div><h2>Historique</h2><div className="hint">Évolution de votre score, toutes périodes confondues</div></div>
            </div>
            {historiqueData.length < 2 ? (
              <div style={{ padding: '0 20px 16px', color: 'var(--text-faint)', fontSize: 12.5 }}>
                Pas encore assez de périodes évaluées pour afficher une évolution.
              </div>
            ) : (
              <div style={{ padding: '0 20px 20px', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historiqueData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    {equipesHistorique.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
                    {equipesHistorique.map((nom, i) => (
                      <Line
                        key={nom}
                        type="monotone"
                        dataKey={nom}
                        stroke={HISTORIQUE_COULEURS[i % HISTORIQUE_COULEURS.length]}
                        strokeWidth={2}
                        connectNulls
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <div><h2>Mot de passe</h2><div className="hint">Modifiez votre mot de passe de connexion</div></div>
              {!editingPassword && (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditingPassword(true)}>Modifier</button>
              )}
            </div>
            {editingPassword && (
              <div className="form-grid">
                <div className="field full">
                  <label>Mot de passe actuel</label>
                  <input type="password" value={pwActuel} onChange={(e) => setPwActuel(e.target.value)} autoFocus />
                </div>
                <div className="field full">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={pwNouveau} onChange={(e) => setPwNouveau(e.target.value)} />
                  {pwNouveau && (
                    <ul className="password-checklist">
                      {getPasswordChecklist(pwNouveau).map((rule) => (
                        <li key={rule.key} className={rule.ok ? 'ok' : ''}>
                          <span className="dot">{rule.ok ? '✓' : '•'}</span>{rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="field full">
                  <label>Confirmer le nouveau mot de passe</label>
                  <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingPassword} onClick={annulerEditionPassword}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingPassword} onClick={enregistrerPassword}>
                    {savingPassword ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Préférences du compte</h2></div></div>
            <div className="toggle-row">
              <div><div className="t">Mode sombre</div><div className="d">Adapte l'interface pour une utilisation en faible luminosité</div></div>
              <label className="switch">
                <input type="checkbox" checked={!!dark} onChange={onToggleDark} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= MON ACTIVITÉ ÉCOLE (collaborateur) ================= */
function MonActiviteEcole({ showToast, filtreAnnee, filtreSemestre, anneesOptions }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({
    expertises: [], encadrements: [],
    membre_jury: [], president_jury: [],
    formation_ete: [], formation_hiver: [], formation_printemps: [],
    evenement: [], comite_organisation: [],
  })
  // Formulaire ouvert dans une carte modale : 'expertise', 'encadrement', ou l'une des
  // clés de ACTIVITE_LABELS (membre_jury, evenement...). null = aucun formulaire ouvert.
  const [openForm, setOpenForm] = useState(null)

  const refresh = useCallback(() => (
    getMonActiviteEcole()
      .then(setDetail)
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de votre activité') })
      .finally(() => setLoading(false))
  ), [showToast])

  useEffect(() => { refresh() }, [refresh])

  // Met en surbrillance la ligne/puce qui vient d'être ajoutée (quelques secondes),
  // pour que l'ajout se voie clairement dans la liste sans avoir à actualiser la page.
  const [recentlyAddedId, setRecentlyAddedId] = useState(null)
  const flashRecentlyAdded = (id) => {
    setRecentlyAddedId(id)
    setTimeout(() => setRecentlyAddedId((current) => (current === id ? null : current)), 3000)
  }

  /* ---------- Expertises ---------- */
  const [expertiseInput, setExpertiseInput] = useState('')
  const [savingExpertise, setSavingExpertise] = useState(false)

  const submitExpertise = async () => {
    if (!expertiseInput.trim()) return
    setSavingExpertise(true)
    try {
      const created = await addMonExpertise(expertiseInput.trim())
      setExpertiseInput('')
      await refresh()
      if (created?.id_expertise) flashRecentlyAdded(created.id_expertise)
      showToast('Expertise ajoutée ✓')
      setOpenForm(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout de l'expertise")
    } finally {
      setSavingExpertise(false)
    }
  }

  const removeExpertiseItem = async (id) => {
    try {
      await deleteExpertise(id)
      await refresh()
      showToast('Expertise retirée ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'expertise")
    }
  }

  /* ---------- Encadrements ---------- */
  const [encNom, setEncNom] = useState('')
  const [encSujet, setEncSujet] = useState('')
  const [encType, setEncType] = useState('pfe')
  const [encAnnee, setEncAnnee] = useState('')
  const [savingEnc, setSavingEnc] = useState(false)

  const submitEncadrement = async () => {
    if (!encNom.trim()) { showToast("Le nom de l'étudiant est requis"); return }
    setSavingEnc(true)
    try {
      const created = await addMonEncadrement({
        nom_etudiant: encNom.trim(),
        sujet: encSujet.trim() || null,
        type: encType,
        annee_universitaire: encAnnee.trim() || null,
      })
      setEncNom(''); setEncSujet(''); setEncAnnee('')
      await refresh()
      if (created?.id_encadrement) flashRecentlyAdded(created.id_encadrement)
      showToast('Encadrement ajouté ✓')
      setOpenForm(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout de l'encadrement")
    } finally {
      setSavingEnc(false)
    }
  }

  const removeEncadrementItem = async (id) => {
    try {
      await deleteMonEncadrement(id)
      await refresh()
      showToast('Encadrement retiré ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'encadrement")
    }
  }

  /* ---------- Jury / Formations / Événements / Comités (même structure, type variable) ---------- */
  const [activiteForms, setActiviteForms] = useState(
    Object.fromEntries(Object.keys(ACTIVITE_LABELS).map((type) => [type, { titre: '', role: '', date_activite: '' }]))
  )
  const [savingActivite, setSavingActivite] = useState(null)

  const setActiviteField = (type, field, value) => {
    setActiviteForms((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }))
  }

  const submitActivite = async (type) => {
    const form = activiteForms[type]
    if (!form.titre.trim()) { showToast('Le titre est requis'); return }
    setSavingActivite(type)
    try {
      const created = await addMonActiviteAcademique({
        type,
        titre: form.titre.trim(),
        role: type === 'evenement' ? (form.role.trim() || null) : null,
        date_activite: form.date_activite || null,
      })
      setActiviteForms((prev) => ({ ...prev, [type]: { titre: '', role: '', date_activite: '' } }))
      await refresh()
      if (created?.id_activite) flashRecentlyAdded(created.id_activite)
      showToast('Activité ajoutée ✓')
      setOpenForm(null)
    } catch (err) {
      console.error(err)
      showToast("Erreur lors de l'ajout de l'activité")
    } finally {
      setSavingActivite(null)
    }
  }

  const removeActiviteItem = async (id) => {
    try {
      await deleteMonActiviteAcademique(id)
      await refresh()
      showToast('Activité retirée ✓')
    } catch (err) {
      console.error(err)
      showToast("Erreur lors du retrait de l'activité")
    }
  }

  const encTypeLabel = { pfe: 'PFE', stage: 'Stage', mini_projet: 'Mini-projet', autre: 'Autre' }

  // Un encadrement n'a qu'une année universitaire (pas de semestre) : filtré sur
  // l'année du filtre sélectionné en haut de page, visible sur ses deux semestres.
  const encadrementsFiltres = detail.encadrements.filter((enc) => estDansAnnee(enc.annee_universitaire, filtreAnnee))

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>Mon activité école</h2><div className="hint">{loading ? 'Chargement…' : 'Gérez vos expertises, encadrements et implication académique'}</div></div>
      </div>

      {loading ? (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-faint)' }}>Chargement…</div>
      ) : (
        <div className="ae-body">

          {/* ---------- Expertises ---------- */}
          <div className="ae-section">
            <div className="ae-section-head">
              <div className="ae-icon amber"><Icon.eval /></div>
              <h3>Expertises</h3>
              <span className="ae-count">{detail.expertises.length}</span>
              <button className="ae-add-btn" type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpenForm('expertise')}>+ Ajouter</button>
            </div>
            {detail.expertises.length === 0 ? (
              <div className="ae-empty">Aucune expertise renseignée</div>
            ) : (
              <div className="ae-chip-list">
                {detail.expertises.map((e) => (
                  <span key={e.id_expertise} className={`ae-chip amber${recentlyAddedId === e.id_expertise ? ' ae-item-new' : ''}`}>
                    {e.libelle}
                    <button type="button" onClick={() => removeExpertiseItem(e.id_expertise)} title="Retirer"><Icon.removeX /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Étudiants encadrés ---------- */}
          <div className="ae-section">
            <div className="ae-section-head">
              <div className="ae-icon blue"><Icon.students /></div>
              <h3>Étudiants encadrés</h3>
              <span className="ae-count">{encadrementsFiltres.length}</span>
              <button className="ae-add-btn" type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpenForm('encadrement')}>+ Ajouter</button>
            </div>
            {encadrementsFiltres.length === 0 ? (
              <div className="ae-empty">{detail.encadrements.length === 0 ? 'Aucun étudiant encadré' : 'Aucun étudiant encadré sur cette période'}</div>
            ) : (
              <div className="ae-list">
                {encadrementsFiltres.map((enc) => (
                  <div key={enc.id_encadrement} className={`ae-row${recentlyAddedId === enc.id_encadrement ? ' ae-item-new' : ''}`}>
                    <div className="ae-row-main">
                      <div className="ae-avatar">{initials(enc.nom_etudiant)}</div>
                      <div>
                        <div className="title">{enc.nom_etudiant}</div>
                        <div className="meta">
                          {enc.sujet ? `${enc.sujet} · ` : ''}
                          <span className={`badge ${enc.type === 'pfe' ? 'vp-normal' : enc.type === 'stage' ? 'vp-international' : enc.type === 'mini_projet' ? 'vp-alternance' : 'vp-autre'}`} style={{ marginRight: 0 }}>
                            {encTypeLabel[enc.type] || enc.type}
                          </span>
                          {enc.annee_universitaire ? ` · ${enc.annee_universitaire}` : ''}
                        </div>
                      </div>
                    </div>
                    <button className="ae-remove-btn" title="Retirer" onClick={() => removeEncadrementItem(enc.id_encadrement)}><Icon.removeX /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Jury / Formations / Événements / Comités ---------- */}
          {Object.keys(ACTIVITE_LABELS).map((type) => {
            const list = (detail[type] || []).filter((a) => estDansPeriode(a.date_activite, filtreAnnee, filtreSemestre))
            const { icon: sectionIcon, color: sectionColor } = ACTIVITE_ICONS[type]
            return (
              <div className="ae-section" key={type}>
                <div className="ae-section-head">
                  <div className={`ae-icon ${sectionColor}`}>{sectionIcon}</div>
                  <h3>{ACTIVITE_LABELS[type]}</h3>
                  <span className="ae-count">{list.length}</span>
                  <button className="ae-add-btn" type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpenForm(type)}>+ Ajouter</button>
                </div>
                {list.length === 0 ? (
                  <div className="ae-empty">Aucune entrée</div>
                ) : (
                  <div className="ae-list">
                    {list.map((a) => (
                      <div key={a.id_activite} className={`ae-row${recentlyAddedId === a.id_activite ? ' ae-item-new' : ''}`}>
                        <div className="ae-row-main">
                          <div className="title">{a.titre}</div>
                          {type === 'evenement' && a.role && <span className="ae-date-chip">{a.role}</span>}
                          {a.date_activite && <span className="ae-date-chip"><Icon.calendar />{formatDateShortFr(a.date_activite)}</span>}
                        </div>
                        <button className="ae-remove-btn" title="Retirer" onClick={() => removeActiviteItem(a.id_activite)}><Icon.removeX /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {openForm === 'expertise' && (
        <div className="modal-overlay" onClick={() => !savingExpertise && setOpenForm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Ajouter une expertise</h2></div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenForm(null)}>Fermer</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Expertise</label>
                  <input type="text" placeholder="Ex. Intelligence artificielle" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} autoFocus />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingExpertise} onClick={() => setOpenForm(null)}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingExpertise} onClick={submitExpertise}>
                    {savingExpertise ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {openForm === 'encadrement' && (
        <div className="modal-overlay" onClick={() => !savingEnc && setOpenForm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Ajouter un étudiant encadré</h2></div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenForm(null)}>Fermer</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Nom de l'étudiant</label>
                  <input type="text" value={encNom} onChange={(e) => setEncNom(e.target.value)} autoFocus />
                </div>
                <div className="field">
                  <label>Sujet (optionnel)</label>
                  <input type="text" value={encSujet} onChange={(e) => setEncSujet(e.target.value)} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={encType} onChange={(e) => setEncType(e.target.value)}>
                    <option value="pfe">PFE</option>
                    <option value="stage">Stage</option>
                    <option value="mini_projet">Mini-projet</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="field">
                  <label>Année universitaire</label>
                  <select value={encAnnee} onChange={(e) => setEncAnnee(e.target.value)}>
                    <option value="">— Non renseignée —</option>
                    {anneesOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingEnc} onClick={() => setOpenForm(null)}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingEnc} onClick={submitEncadrement}>
                    {savingEnc ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {openForm && ACTIVITE_LABELS[openForm] && (
        <div className="modal-overlay" onClick={() => savingActivite !== openForm && setOpenForm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <div><h2>Ajouter — {ACTIVITE_LABELS[openForm]}</h2></div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenForm(null)}>Fermer</button>
              </div>
              <div className="form-grid">
                <div className="field full">
                  <label>Titre</label>
                  <input type="text" value={activiteForms[openForm].titre} onChange={(e) => setActiviteField(openForm, 'titre', e.target.value)} autoFocus />
                </div>
                {openForm === 'evenement' && (
                  <div className="field full">
                    <label>Votre rôle</label>
                    <input type="text" placeholder="Ex. Intervenant, Organisateur" value={activiteForms[openForm].role} onChange={(e) => setActiviteField(openForm, 'role', e.target.value)} />
                  </div>
                )}
                <div className="field full">
                  <label>Date</label>
                  <input type="date" value={activiteForms[openForm].date_activite} onChange={(e) => setActiviteField(openForm, 'date_activite', e.target.value)} />
                </div>
                <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" type="button" disabled={savingActivite === openForm} onClick={() => setOpenForm(null)}>Annuler</button>
                  <button className="btn btn-primary" type="button" disabled={savingActivite === openForm} onClick={() => submitActivite(openForm)}>
                    {savingActivite === openForm ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Petit composant partagé : cellule "premier item + N autres" avec bouton détail ---------- */
function CellLibelle({ items, onOpenDetail, accent = 'blue' }) {
  const list = items || []
  if (list.length === 0) {
    return <span className="activite-empty">–</span>
  }
  return (
    <button
      type="button"
      className={`activite-chip accent-${accent}`}
      title={list.map((i) => i.titre).join(', ')}
      onClick={() => onOpenDetail(list)}
    >
      <span className="activite-chip-label">{list[0].titre}</span>
      {list.length > 1 && <span className="activite-chip-count">+{list.length - 1}</span>}
    </button>
  )
}

function CategoryListModal({ title, items, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>{title}</h2><div className="hint">{items.length} entrée{items.length > 1 ? 's' : ''}</div></div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {items.length === 0 && <span style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>Aucune entrée</span>}
            {items.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <b style={{ fontSize: 13 }}>{a.titre}</b>
                  {a.role && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>Rôle : {a.role}</div>}
                </div>
                {a.date && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{formatDateShortFr(a.date)}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const ACTIVITE_COLUMN_GROUPS = [
  { label: 'Encadrement académique', accent: 'blue', cols: [
    { key: 'encadrements', label: 'Étudiants', icon: 'academic' },
    { key: 'expertises', label: 'Expertises', icon: 'award' },
  ] },
  { label: 'Jurys', accent: 'amber', cols: [
    { key: 'membre_jury', label: 'Membre', icon: 'gavel' },
    { key: 'president_jury', label: 'Président', icon: 'gavel' },
  ] },
  { label: 'Formations', accent: 'green', cols: [
    { key: 'formation_ete', label: 'Été', icon: 'book' },
    { key: 'formation_hiver', label: 'Hiver', icon: 'book' },
    { key: 'formation_printemps', label: 'Printemps', icon: 'book' },
  ] },
  { label: 'Vie associative', accent: 'purple', cols: [
    { key: 'evenement', label: 'Événements', icon: 'calendar' },
    { key: 'comite_organisation', label: 'Comités', icon: 'building' },
  ] },
]
const ACTIVITE_KEY_ACCENT = Object.fromEntries(
  ACTIVITE_COLUMN_GROUPS.flatMap((g) => g.cols.map((c) => [c.key, g.accent]))
)
const ACTIVITE_KEY_ICON = Object.fromEntries(
  ACTIVITE_COLUMN_GROUPS.flatMap((g) => g.cols.map((c) => [c.key, c.icon]))
)

function DetailSection({ icon, accent = 'blue', label, count, isEmpty, emptyText, children }) {
  const IconComp = Icon[icon]
  return (
    <div className="field full">
      <div className={`detail-head accent-${accent}`}>
        {IconComp && <IconComp />}
        <label>{label}</label>
        <span className="detail-count">{count}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        {isEmpty && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>{emptyText}</span>}
        {children}
      </div>
    </div>
  )
}

/* ================= ACTIVITÉ ÉCOLE — MON ACTIVITÉ (collaborateur, lecture seule) =================
   Même contenu, mêmes colonnes que la page admin "Activité école", mais restreint à la
   ligne du collaborateur connecté : chaque collègue ne doit voir que sa propre implication
   (expertises, encadrements, jury, formations, événements, comités), jamais celle des autres. */
function ActiviteEcoleTousLesCollegues({ showToast, filtreAnnee, filtreSemestre, currentUserId }) {
  const [professeurs, setProfesseurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [categoryModal, setCategoryModal] = useState(null) // { title, items }

  const refresh = useCallback(() => (
    getProfesseurs()
      .then((data) => setProfesseurs(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement de votre activité école') })
      .finally(() => setLoading(false))
  ), [showToast])

  useEffect(() => { refresh() }, [refresh])

  // Rafraîchissement périodique — sans recharger la page.
  useEffect(() => {
    const id = setInterval(refresh, 20000)
    return () => clearInterval(id)
  }, [refresh])

  const filtered = professeurs.filter((p) => String(p.id) === String(currentUserId))
  // Les colonnes jury/formation/événements/comités sont filtrées sur la période
  // sélectionnée (semestre inclus) ; les encadrements n'ont qu'une année universitaire
  // (pas de semestre) donc filtrés uniquement sur l'année. Les expertises n'ont
  // aucune notion de période et restent donc toujours affichées en entier.
  const dansPeriode = (items) => (items || []).filter((it) => estDansPeriode(it.date, filtreAnnee, filtreSemestre))
  const dansAnnee = (items) => (items || []).filter((it) => estDansAnnee(it.annee_universitaire, filtreAnnee))

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>Activité école</h2><div className="hint">{loading ? 'Chargement…' : 'Détail par catégorie'}</div></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="activite-table" style={{ marginTop: 8 }}>
          <thead>
            <tr className="grp">
              <th rowSpan={2}>Collègue</th>
              {ACTIVITE_COLUMN_GROUPS.map((g) => (
                <th key={g.label} colSpan={g.cols.length} className={`grp-start accent-${g.accent}`}>{g.label}</th>
              ))}
              <th rowSpan={2}></th>
            </tr>
            <tr className="sub">
              {ACTIVITE_COLUMN_GROUPS.map((g) => g.cols.map((c, i) => {
                const ColIcon = Icon[c.icon]
                return (
                  <th key={c.key} className={i === 0 ? 'grp-start' : ''}>
                    <span className={`col-label accent-${g.accent}`}>{ColIcon && <ColIcon />}{c.label}</span>
                  </th>
                )
              }))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><div className="name-cell"><div className="avatar sm">{initials(p.nom)}</div><span className="n">{p.nom}</span></div></td>
                <td className="grp-start"><CellLibelle items={dansAnnee(p.encadrements)} accent="blue" onOpenDetail={(items) => setCategoryModal({ title: `Étudiants encadrés — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={p.expertises} accent="blue" onOpenDetail={(items) => setCategoryModal({ title: `Expertises — ${p.nom}`, items })} /></td>
                <td className="grp-start"><CellLibelle items={dansPeriode(p.membre_jury)} accent="amber" onOpenDetail={(items) => setCategoryModal({ title: `Membre de jury — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={dansPeriode(p.president_jury)} accent="amber" onOpenDetail={(items) => setCategoryModal({ title: `Président de jury — ${p.nom}`, items })} /></td>
                <td className="grp-start"><CellLibelle items={dansPeriode(p.formation_ete)} accent="green" onOpenDetail={(items) => setCategoryModal({ title: `Formation d'été — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={dansPeriode(p.formation_hiver)} accent="green" onOpenDetail={(items) => setCategoryModal({ title: `Formation d'hiver — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={dansPeriode(p.formation_printemps)} accent="green" onOpenDetail={(items) => setCategoryModal({ title: `Formation de printemps — ${p.nom}`, items })} /></td>
                <td className="grp-start"><CellLibelle items={dansPeriode(p.evenement)} accent="purple" onOpenDetail={(items) => setCategoryModal({ title: `Événements — ${p.nom}`, items })} /></td>
                <td><CellLibelle items={dansPeriode(p.comite_organisation)} accent="purple" onOpenDetail={(items) => setCategoryModal({ title: `Comités — ${p.nom}`, items })} /></td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="icon-btn sm" title="Voir le détail" onClick={() => setSelected(p)}><Icon.eye /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-faint)' }}>Aucune donnée</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <CollegueDetail
          professeur={selected}
          onClose={() => setSelected(null)}
          showToast={showToast}
          filtreAnnee={filtreAnnee}
          filtreSemestre={filtreSemestre}
        />
      )}
      {categoryModal && (
        <CategoryListModal
          title={categoryModal.title}
          items={categoryModal.items}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  )
}

function CollegueDetail({ professeur, onClose, showToast, filtreAnnee, filtreSemestre }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState({
    expertises: [], encadrements: [],
    membre_jury: [], president_jury: [],
    formation_ete: [], formation_hiver: [], formation_printemps: [],
    evenement: [], comite_organisation: [],
  })

  useEffect(() => {
    setLoading(true)
    getProfesseurDetail(professeur.id)
      .then(setDetail)
      .catch((err) => { console.error(err); showToast('Erreur lors du chargement du détail') })
      .finally(() => setLoading(false))
  }, [professeur.id, showToast])

  const encadrementsFiltres = detail.encadrements.filter((enc) => estDansAnnee(enc.annee_universitaire, filtreAnnee))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <div><h2>{professeur.nom}</h2><div className="hint">Vue d'ensemble — lecture seule</div></div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-faint)' }}>Chargement…</div>
          ) : (
            <div className="form-grid">
              <DetailSection
                icon="academic" accent="blue" label="Étudiants encadrés" count={encadrementsFiltres.length}
                isEmpty={encadrementsFiltres.length === 0}
                emptyText={detail.encadrements.length === 0 ? 'Aucun étudiant encadré' : 'Aucun étudiant encadré sur cette période'}
              >
                {encadrementsFiltres.map((enc) => (
                  <div key={enc.id_encadrement} className="detail-entry accent-blue">
                    <b>{enc.nom_etudiant}</b>
                    <span className="detail-entry-meta">
                      {enc.sujet ? `${enc.sujet} · ` : ''}{enc.type}{enc.annee_universitaire ? ` · ${enc.annee_universitaire}` : ''}
                    </span>
                  </div>
                ))}
              </DetailSection>

              <DetailSection
                icon="award" accent="blue" label="Expertises" count={detail.expertises.length}
                isEmpty={detail.expertises.length === 0} emptyText="Aucune expertise renseignée"
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.expertises.map((e) => (
                    <span key={e.id_expertise} className="role-pill">{e.libelle}</span>
                  ))}
                </div>
              </DetailSection>

              {Object.keys(ACTIVITE_LABELS).map((type) => {
                const list = (detail[type] || []).filter((a) => estDansPeriode(a.date_activite, filtreAnnee, filtreSemestre))
                const accent = ACTIVITE_KEY_ACCENT[type] || 'blue'
                return (
                  <DetailSection
                    key={type} icon={ACTIVITE_KEY_ICON[type]} accent={accent} label={ACTIVITE_LABELS[type]} count={list.length}
                    isEmpty={list.length === 0} emptyText="Aucune entrée sur cette période"
                  >
                    {list.map((a) => (
                      <div key={a.id_activite} className={`detail-entry accent-${accent}`}>
                        <b>{a.titre}</b>
                        {type === 'evenement' && a.role && <span className="detail-entry-meta">· Rôle : {a.role}</span>}
                        {a.date_activite && <span className="detail-entry-meta">{formatDateShortFr(a.date_activite)}</span>}
                      </div>
                    ))}
                  </DetailSection>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaborateurDashboard