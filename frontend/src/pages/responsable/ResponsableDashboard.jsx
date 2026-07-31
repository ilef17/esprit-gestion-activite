import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import NotificationBell from '../../components/NotificationBell.jsx'
import StatsDashboard from '../../components/dashboard/StatsDashboard.jsx'
import { warningDateSeule } from '../../utils/dateValidation.js'
import {
  getMesSousEquipes,
  getMembresSousEquipe,
  addMembreSousEquipe,
  removeMembreSousEquipe,
  getMesEquipesHorsUp,
  getMembresEquipeHorsUp,
  addMembreEquipeHorsUp,
  removeMembreEquipeHorsUp,
  getCollaborateursOptions,
  getTaches,
  createTache,
  createTachesEnLot,
  updateTache,
  deleteTache,
  getMonProfil,
  updateMesPreferences,
  updateMonProfilIdentite,
  changerMonMotDePasse,
  getParametres,
  getDemandesResponsable,
} from '../../services/api.js'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import { useConfirm } from '../../hooks/useConfirm.jsx'
import './responsable.css'

/* ---------- small inline icon set (copied from the design template) ---------- */
const Icon = {
  dashboard: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>),
  teams: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.3"/></svg>),
  task: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>),
  requests: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 4h16v16H4z"/><path d="M4 9h16"/><path d="M9 4v16"/></svg>),
  trending: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M20 6 9 17l-5-5"/></svg>),
  cross: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 4h16v16H4z"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>),
  edit: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>),
  profile: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>),
}

const PAGE_TITLES = {
  dashboard: 'Tableau de bord',
  'mon-equipe': 'Mon équipe',
  taches: 'Tâches',
  avancement: 'Avancement',
  horsequipe: 'Activité hors-équipe',
  profil: 'Profil',
}

// Le collaborateur choisit lui-même "En cours" / "Faite" / "Problème de coordination".
// Le responsable pilote en plus "Validée" et "À refaire" (cahier des charges) ; "Non
// réalisée" correspond au statut initial 'a_faire' posé à la création de la tâche.
const STATUT_OPTIONS = [
  { value: 'a_faire', label: 'Non réalisée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'validee', label: 'Validée' },
  { value: 'a_refaire', label: 'À refaire' },
]
const STATUT_LABELS = Object.fromEntries(STATUT_OPTIONS.map((s) => [s.value, s.label]))

const PRIORITE_OPTIONS = [
  { value: 'haute', label: 'Haute' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'basse', label: 'Basse' },
]
const PRIORITE_LABELS = Object.fromEntries(PRIORITE_OPTIONS.map((p) => [p.value, p.label]))

function initials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function formatDateShortFr(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function statutBadge(statut) {
  const map = {
    a_faire: { label: 'À faire', cls: 'gray' },
    en_cours: { label: 'En cours', cls: 'blue' },
    faite: { label: 'Faite', cls: 'green' },
  }
  return map[statut] || { label: statut, cls: 'gray' }
}

function relativeDays(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return "Reçue aujourd'hui"
  if (days === 1) return 'Reçue hier'
  return `Reçue il y a ${days}j`
}

// Statistiques d'un membre à partir de la liste des tâches de la sous-équipe.
function statsForMembre(idCollaborateur, taches) {
  const mine = taches.filter((t) => t.id_collaborateur === idCollaborateur)
  const total = mine.length
  const validees = mine.filter((t) => t.statut === 'validee').length
  const actives = mine.filter((t) => t.statut !== 'validee').length
  return { total, validees, actives, pct: total ? Math.round((validees / total) * 100) : 0 }
}

// Période "actuelle" par défaut pour le filtre — même règle que côté serveur et
// que les tableaux de bord admin/collaborateur (septembre→janvier = S1, février→août = S2).
function periodeParDefaut() {
  const now = new Date()
  const mois = now.getMonth() + 1
  const anneeDebut = mois >= 9 ? now.getFullYear() : now.getFullYear() - 1
  return { annee: `${anneeDebut}/${anneeDebut + 1}`, semestre: (mois >= 9 || mois <= 1) ? 'S1' : 'S2' }
}

export default function ResponsableDashboard() {
  const { user, logout, updateUser } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [toastMsg, setToastMsg] = useState(null)

  // Filtre Année / Semestre du tableau de bord — même logique que les filtres
  // équivalents des tableaux de bord admin et collaborateur.
  const defautPeriode = useMemo(periodeParDefaut, [])
  const [filtreAnnee, setFiltreAnnee] = useState(defautPeriode.annee)
  const [filtreSemestre, setFiltreSemestre] = useState(defautPeriode.semestre)

  // Paramètres système (dont la période active définie par l'admin, et les
  // années universitaires supplémentaires qu'il a ajoutées) — mêmes données
  // que celles lues par le tableau de bord admin.
  const [params, setParams] = useState(null)

  // Liste des années universitaires proposées dans le sélecteur : identique
  // au calcul du tableau de bord admin (fenêtre autour de l'année courante +
  // années ajoutées par l'admin via Paramètres).
  const anneesOptions = useMemo(() => {
    const debut = Number(defautPeriode.annee.split('/')[0])
    const annees = new Set()
    for (let i = 2; i >= -2; i--) annees.add(`${debut + i}/${debut + i + 1}`)
    ;(params?.annees_supplementaires || []).forEach((a) => annees.add(a))
    return Array.from(annees).sort().reverse()
  }, [defautPeriode.annee, params])

  // Au premier chargement, on cale le filtre consulté sur la période *active*
  // du système (définie par l'admin) plutôt que sur la date du jour.
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
  // création/modification possible) — même règle que côté admin/collaborateur.
  const periodeEstActive = !params || (filtreAnnee === params.annee_universitaire && filtreSemestre === params.semestre_actif)

  const [equipes, setEquipes] = useState([])
  const [loadingEquipes, setLoadingEquipes] = useState(true)
  const [activeEquipeKey, setActiveEquipeKey] = useState(null)
  const equipeActive = equipes.find((e) => e.key === activeEquipeKey) || null
  const activeEquipeId = equipeActive?.id ?? null
  const activeEquipeType = equipeActive?.type ?? null

  const [membres, setMembres] = useState([])
  const [loadingMembres, setLoadingMembres] = useState(true)

  const [taches, setTaches] = useState([])
  const [loadingTaches, setLoadingTaches] = useState(true)

  const [collaborateurs, setCollaborateurs] = useState([])

  // Activité hors-équipe : activités déclarées par des collaborateurs concernant
  // une des équipes que ce responsable gère — vue en lecture seule, comme côté admin.
  const [demandes, setDemandes] = useState([])
  const [loadingDemandes, setLoadingDemandes] = useState(true)
  const refreshDemandes = useCallback(() => {
    setLoadingDemandes(true)
    return getDemandesResponsable()
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement activité hors-équipe:', err))
      .finally(() => setLoadingDemandes(false))
  }, [])
  useEffect(() => { refreshDemandes() }, [refreshDemandes])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  // "sous_equipe" (UP) et "hors_up" sont deux tables distinctes avec leur propre
  // auto-increment (id_sous_equipe / id_up) : deux équipes de types différents
  // peuvent donc partager le même id numérique. On identifie chaque équipe par
  // une clé composite "type:id" (activeEquipeKey) partout dans ce composant,
  // et on ne dérive un id "brut" (activeEquipeId) qu'au moment d'appeler les API.
  const refreshEquipes = useCallback(() => {
    setLoadingEquipes(true)
    return Promise.all([
      getMesSousEquipes().catch((err) => { console.error('Erreur chargement sous-équipes:', err); return [] }),
      getMesEquipesHorsUp().catch((err) => { console.error('Erreur chargement équipes hors UP:', err); return [] }),
    ])
      .then(([sousEquipes, equipesHorsUp]) => {
        const list = [
          ...(Array.isArray(sousEquipes) ? sousEquipes : []).map((e) => ({ ...e, type: 'sous_equipe', key: `sous_equipe:${e.id}` })),
          ...(Array.isArray(equipesHorsUp) ? equipesHorsUp : []).map((e) => ({ ...e, type: 'hors_up', key: `hors_up:${e.id}` })),
        ]
        setEquipes(list)
        setActiveEquipeKey((prev) => (prev && list.some((e) => e.key === prev)) ? prev : (list[0]?.key || null))
      })
      .finally(() => setLoadingEquipes(false))
  }, [])

  const refreshCollaborateurs = useCallback(() => (
    getCollaborateursOptions()
      .then((data) => setCollaborateurs(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement collaborateurs:', err))
  ), [])

  useEffect(() => {
    refreshEquipes()
    refreshCollaborateurs()
  }, [refreshEquipes, refreshCollaborateurs])

  const refreshMembres = useCallback(() => {
    if (!activeEquipeId) { setMembres([]); return Promise.resolve() }
    setLoadingMembres(true)
    const fetchMembres = activeEquipeType === 'hors_up' ? getMembresEquipeHorsUp(activeEquipeId) : getMembresSousEquipe(activeEquipeId)
    return fetchMembres
      .then((data) => setMembres(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement membres:', err))
      .finally(() => setLoadingMembres(false))
  }, [activeEquipeId, activeEquipeType])

  const refreshTaches = useCallback(() => {
    if (!activeEquipeId) { setTaches([]); setLoadingTaches(false); return Promise.resolve() }
    setLoadingTaches(true)
    const params = activeEquipeType === 'hors_up' ? { equipe_hors_up: activeEquipeId } : { sous_equipe: activeEquipeId }
    return getTaches(params)
      .then((data) => setTaches(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erreur chargement tâches:', err))
      .finally(() => setLoadingTaches(false))
  }, [activeEquipeId, activeEquipeType])

  useEffect(() => { refreshMembres() }, [refreshMembres])
  useEffect(() => { refreshTaches() }, [refreshTaches])

  // Rafraîchissement périodique — pour voir apparaître, sans recharger la page, une tâche
  // mise à jour par un collaborateur ou un changement de composition d'équipe.
  useEffect(() => {
    const id = setInterval(() => {
      refreshEquipes()
      refreshMembres()
      refreshTaches()
      refreshDemandes()
    }, 25000)
    return () => clearInterval(id)
  }, [refreshEquipes, refreshMembres, refreshTaches, refreshDemandes])

  const changerStatutTache = useCallback(async (id, statut) => {
    setTaches((prev) => prev.map((t) => (t.id_tache === id ? { ...t, statut } : t)))
    try {
      await updateTache(id, { statut })
      showToast('Statut mis à jour ✓')
      refreshEquipes()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut')
      refreshTaches()
    }
  }, [showToast, refreshTaches, refreshEquipes])

  // Mode sombre — persisté localement, appliqué en ajoutant/retirant la classe "dark"
  // sur le conteneur racine (toutes les couleurs sont des variables CSS sur .responsable-root).
  const [dark, setDark] = useState(() => localStorage.getItem('arp_theme') === 'dark')
  useEffect(() => {
    localStorage.setItem('arp_theme', dark ? 'dark' : 'light')
  }, [dark])
  const toggleDark = useCallback(() => setDark((d) => !d), [])

  const respoName = user?.nom || 'Responsable'

  const membresCount = membres.length
  // Le filtre Année/Semestre s'applique aux tâches affichées ; celles sans période
  // enregistrée (anciennes données) restent visibles quel que soit le filtre, pour
  // ne rien faire disparaître silencieusement (même logique que côté collaborateur).
  const tachesFiltrees = taches
    .filter((t) => !t.annee_universitaire || t.annee_universitaire === filtreAnnee)
    .filter((t) => !t.semestre || t.semestre === filtreSemestre)
  const tachesActives = tachesFiltrees.filter((t) => t.statut !== 'validee').length
  const tachesTerminees = tachesFiltrees.filter((t) => t.statut === 'validee').length
  const tachesEnRetard = tachesFiltrees.filter((t) => t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== 'validee').length
  const tauxCompletion = tachesFiltrees.length ? Math.round((tachesFiltrees.filter((t) => t.statut === 'validee').length / tachesFiltrees.length) * 100) : 0

  return (
    <div className={`responsable-root${dark ? ' dark' : ''}`}>
      <div className="app">
        <aside className="sidebar">
          <EspritLogo full />
          <div className="role-chip">RESPONSABLE</div>

          <div className="nav-section-label">Équipe</div>
          <nav className="nav">
            <a href="#" className={activePage === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('dashboard') }}>
              <Icon.dashboard /> Tableau de bord
            </a>
            <a href="#" className={activePage === 'mon-equipe' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('mon-equipe') }}>
              <Icon.teams /> Mon équipe
            </a>
          </nav>

          <div className="nav-section-label">Activités</div>
          <nav className="nav">
            <a href="#" className={activePage === 'taches' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('taches') }}>
              <Icon.task /> Tâches
              {tachesActives > 0 && <span className="badge">{tachesActives}</span>}
            </a>
            <a href="#" className={activePage === 'avancement' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('avancement') }}>
              <Icon.trending /> Avancement
            </a>
            <a href="#" className={activePage === 'horsequipe' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('horsequipe') }}>
              <Icon.requests /> Activité hors-équipe
              {demandes.filter((d) => d.statut !== 'faite').length > 0 && (
                <span className="badge">{demandes.filter((d) => d.statut !== 'faite').length}</span>
              )}
            </a>
          </nav>

          <div className="nav-section-label">Compte</div>
          <nav className="nav">
            <a href="#" className={activePage === 'profil' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('profil') }}>
              <Icon.profile /> Mon profil
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="profile-row" onClick={() => logout()} title="Se déconnecter">
              <div className="avatar">{initials(respoName)}</div>
              <div className="profile-meta"><div className="pname">{respoName}</div><div className="prole">Responsable sous-équipe</div></div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="crumb">Intranet · {equipeActive ? `${equipeActive.type === 'hors_up' ? 'Équipe hors UP' : 'Sous-équipe'} ${equipeActive.nom}` : 'Sous-équipe'}</div>
              <h1>{PAGE_TITLES[activePage]}</h1>
            </div>
            <div className="top-controls">
              {equipes.length > 1 && (
                <select
                  className="select-chip"
                  value={activeEquipeKey || ''}
                  onChange={(e) => setActiveEquipeKey(e.target.value)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                >
                  {equipes.map((e) => <option key={e.key} value={e.key}>{e.nom}{e.type === 'hors_up' ? ' (hors UP)' : ''}</option>)}
                </select>
              )}
              <select
                className="select-chip"
                value={filtreAnnee}
                onChange={(e) => setFiltreAnnee(e.target.value)}
                title="Filtrer le tableau de bord par année universitaire"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                {anneesOptions.map((a) => <option key={a} value={a}>{a.replace('/', ' / ')}</option>)}
              </select>
              <select
                className="select-chip"
                value={filtreSemestre}
                onChange={(e) => setFiltreSemestre(e.target.value)}
                title="Filtrer le tableau de bord par semestre"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
              <NotificationBell onNavigate={setActivePage} />
              <div className="avatar sm">{initials(respoName)}</div>
            </div>
          </div>

          <div className="content">
            {activePage === 'profil' ? (
              <MonProfilResponsable user={user} showToast={showToast} updateUser={updateUser} dark={dark} onToggleDark={toggleDark} />
            ) : (
              <>
                {!periodeEstActive && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'var(--amber-tint, #FEF3C7)',
                    color: '#9A6600', border: '1px solid #F5D68A', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600,
                  }}>
                    🔒 Période archivée ({filtreAnnee} · {filtreSemestre === 'S1' ? 'Semestre 1' : 'Semestre 2'}) — lecture seule, aucune création ni modification possible. La période active est {params?.annee_universitaire} · {params?.semestre_actif === 'S1' ? 'Semestre 1' : 'Semestre 2'}.
                  </div>
                )}
                <fieldset disabled={!periodeEstActive} style={{ border: 0, margin: 0, padding: 0 }}>
                {!loadingEquipes && equipes.length === 0 ? (
              <div className="page-head">
                <h2>Aucune équipe assignée</h2>
                <p>Contactez le Super Admin pour vous voir attribuer la responsabilité d'une sous-équipe ou d'une équipe hors UP.</p>
              </div>
            ) : (
              <>
                {activePage === 'dashboard' && (
                  <>
                    <DashboardHome
                      membres={membres}
                      taches={tachesFiltrees}
                      loadingTaches={loadingTaches}
                      membresCount={membresCount}
                      tachesActives={tachesActives}
                      tachesTerminees={tachesTerminees}
                      tachesEnRetard={tachesEnRetard}
                      tauxCompletion={tauxCompletion}
                      onChangerStatut={changerStatutTache}
                      onNavigate={setActivePage}
                    />
                    <div className="card">
                      <div className="card-head"><div><h2>Statistiques (Power BI natif)</h2><div className="hint">Ma sous-équipe</div></div></div>
                      <div style={{ padding: '0 20px 20px' }}><StatsDashboard scope="sous-equipe" annee={filtreAnnee} semestre={filtreSemestre} /></div>
                    </div>
                  </>
                )}
                {activePage === 'mon-equipe' && (
                  <MonEquipe
                    membres={membres}
                    loadingMembres={loadingMembres}
                    collaborateurs={collaborateurs}
                    taches={tachesFiltrees}
                    activeEquipeId={activeEquipeId}
                    activeEquipeType={activeEquipeType}
                    showToast={showToast}
                    onChanged={() => { refreshMembres(); refreshEquipes() }}
                  />
                )}
                {activePage === 'taches' && (
                  <TachesPage
                    taches={tachesFiltrees}
                    loadingTaches={loadingTaches}
                    membres={membres}
                    activeEquipeId={activeEquipeId}
                    activeEquipeType={activeEquipeType}
                    showToast={showToast}
                    onChangerStatut={changerStatutTache}
                    onChanged={() => { refreshTaches(); refreshEquipes() }}
                  />
                )}
                {activePage === 'avancement' && (
                  <Avancement membres={membres} taches={tachesFiltrees} tauxCompletion={tauxCompletion} />
                )}
                {activePage === 'horsequipe' && (
                  <ActiviteHorsEquipe demandes={demandes} loadingDemandes={loadingDemandes} />
                )}
              </>
            )}
                </fieldset>
              </>
            )}
          </div>
        </main>
      </div>

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <Icon.check />
        <span>{toastMsg}</span>
      </div>
    </div>
  )
}

/* ================= DASHBOARD ================= */
function DashboardHome({ membres, taches, loadingTaches, membresCount, tachesActives, tachesTerminees, tachesEnRetard, tauxCompletion, onChangerStatut, onNavigate }) {
  // Filtre local au tableau de bord : cliquer sur une carte "Tâches…" filtre la liste
  // "Tâches de l'équipe" ci-dessous sans quitter la page. Un second clic sur la même
  // carte réinitialise le filtre (bascule).
  const [filtreCarte, setFiltreCarte] = useState('toutes')
  const toggleFiltreCarte = (val) => setFiltreCarte((f) => (f === val ? 'toutes' : val))

  const tachesAffichees = taches.filter((t) => {
    if (filtreCarte === 'actives') return t.statut !== 'validee'
    if (filtreCarte === 'validees') return t.statut === 'validee'
    if (filtreCarte === 'retard') return t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== 'validee'
    return true
  })
  const FILTRE_LABELS = { actives: 'Tâches actives', validees: 'Tâches terminées', retard: 'Tâches en retard' }

  return (
    <>
      <div className="kpi-grid kpi-grid-5">
        <div
          className="kpi clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('mon-equipe')}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('mon-equipe') }}
          title="Voir mon équipe"
        >
          <div className="top"><div className="icon-wrap red"><Icon.teams /></div></div><div className="num">{membresCount}</div><div className="label">Membres de l'équipe</div>
        </div>
        <div
          className={`kpi clickable${filtreCarte === 'actives' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggleFiltreCarte('actives')}
          onKeyDown={(e) => { if (e.key === 'Enter') toggleFiltreCarte('actives') }}
          title="Filtrer sur les tâches actives"
        >
          <div className="top"><div className="icon-wrap blue"><Icon.task /></div></div><div className="num">{tachesActives}</div><div className="label">Tâches actives</div>
        </div>
        <div
          className={`kpi clickable${filtreCarte === 'validees' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggleFiltreCarte('validees')}
          onKeyDown={(e) => { if (e.key === 'Enter') toggleFiltreCarte('validees') }}
          title="Filtrer sur les tâches terminées"
        >
          <div className="top"><div className="icon-wrap green"><Icon.check /></div></div><div className="num">{tachesTerminees}</div><div className="label">Tâches terminées</div>
        </div>
        <div
          className={`kpi clickable${filtreCarte === 'retard' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => toggleFiltreCarte('retard')}
          onKeyDown={(e) => { if (e.key === 'Enter') toggleFiltreCarte('retard') }}
          title="Filtrer sur les tâches en retard"
        >
          <div className="top"><div className="icon-wrap amber"><Icon.clock /></div></div><div className="num">{tachesEnRetard}</div><div className="label">Tâches en retard</div>
        </div>
        <div className="kpi"><div className="top"><div className="icon-wrap green"><Icon.check /></div></div><div className="num">{tauxCompletion}%</div><div className="label">Taux de complétion</div></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Tâches de l'équipe</h2>
                <div className="hint">
                  {filtreCarte === 'toutes' ? 'Description, deadline, priorité et état' : `Filtré : ${FILTRE_LABELS[filtreCarte]}`}
                </div>
              </div>
              {filtreCarte !== 'toutes' && (
                <button className="btn btn-ghost btn-sm" onClick={() => setFiltreCarte('toutes')}>Réinitialiser</button>
              )}
            </div>
            <table>
              <thead><tr><th>Tâche</th><th>Assigné à</th><th>Priorité</th><th>Deadline</th><th>État</th></tr></thead>
              <tbody>
                {loadingTaches && <tr><td colSpan={5}>Chargement…</td></tr>}
                {!loadingTaches && tachesAffichees.length === 0 && <tr><td colSpan={5}>Aucune tâche dans ce filtre.</td></tr>}
                {tachesAffichees.slice(0, 6).map((t) => (
                  <tr key={t.id_tache}>
                    <td><b>{t.titre}</b></td>
                    <td>{t.collaborateur_nom
                      ? <div className="name-cell"><div className="avatar sm">{initials(t.collaborateur_nom)}</div><span className="n">{t.collaborateur_nom}</span></div>
                      : <span style={{ color: 'var(--text-faint)' }}>Non assignée</span>}
                    </td>
                    <td><span className={`badge ${t.priorite || 'moyenne'}`}>{PRIORITE_LABELS[t.priorite] || 'Moyenne'}</span></td>
                    <td>{formatDateShortFr(t.date_echeance)}</td>
                    <td>
                      <select className="status-select" value={t.statut} onChange={(e) => onChangerStatut(t.id_tache, e.target.value)}>

                        {STATUT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head"><div><h2>Membres</h2><div className="hint">{membres.length} collaborateur{membres.length > 1 ? 's' : ''} affecté{membres.length > 1 ? 's' : ''}</div></div></div>
            <div className="list">
              {membres.map((m) => {
                const stats = statsForMembre(m.id_collaborateur, taches)
                return (
                  <div className="list-item" key={m.id_collaborateur}>
                    <div className="avatar sm">{initials(m.nom)}</div>
                    <div className="body"><div className="title">{m.nom}</div><div className="desc">{stats.actives} tâche{stats.actives > 1 ? 's' : ''} active{stats.actives > 1 ? 's' : ''}</div></div>
                    <div className="progress-row" style={{ minWidth: 70 }}>
                      <div className="progress-track"><div className={`progress-fill${stats.pct >= 50 ? ' green' : ''}`} style={{ width: `${stats.pct}%` }}></div></div>
                    </div>
                  </div>
                )
              })}
              {membres.length === 0 && <div style={{ padding: 20, color: 'var(--text-muted)' }}>Aucun membre affecté pour le moment.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= MON ÉQUIPE ================= */
function MonEquipe({ membres, loadingMembres, collaborateurs, taches, activeEquipeId, activeEquipeType, showToast, onChanged }) {
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)

  const dejaMembres = new Set(membres.map((m) => m.id_collaborateur))
  const suggestions = query.trim().length
    ? collaborateurs.filter((c) => !dejaMembres.has(c.id_collaborateur) && c.nom.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : []

  const ajouter = async (c) => {
    setBusyId(c.id_collaborateur)
    try {
      if (activeEquipeType === 'hors_up') {
        await addMembreEquipeHorsUp(activeEquipeId, c.id_collaborateur)
      } else {
        await addMembreSousEquipe(activeEquipeId, c.id_collaborateur)
      }
      showToast(`${c.nom} ajouté à l'équipe ✓`)
      setQuery('')
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || "Erreur lors de l'ajout du membre")
    } finally {
      setBusyId(null)
    }
  }

  const retirer = async (m) => {
    setBusyId(m.id_collaborateur)
    try {
      if (activeEquipeType === 'hors_up') {
        await removeMembreEquipeHorsUp(activeEquipeId, m.id_collaborateur)
      } else {
        await removeMembreSousEquipe(activeEquipeId, m.id_collaborateur)
      }
      showToast(`${m.nom} retiré de l'équipe`)
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors du retrait du membre')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h2>Mon équipe</h2>
        <p>Affectez des membres à votre sous-équipe et suivez leur charge de travail actuelle.</p>
      </div>
      <div className="grid-2">
        <div>
          <div className="card">
            <div className="card-head">
              <div><h2>Membres affectés</h2><div className="hint">{membres.length} collaborateur{membres.length > 1 ? 's' : ''}</div></div>
            </div>
            <table>
              <thead><tr><th>Collaborateur</th><th>Tâches actives</th><th>Charge</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {loadingMembres && <tr><td colSpan={5}>Chargement…</td></tr>}
                {!loadingMembres && membres.length === 0 && <tr><td colSpan={5}>Aucun membre affecté pour le moment.</td></tr>}
                {membres.map((m) => {
                  const stats = statsForMembre(m.id_collaborateur, taches)
                  return (
                    <tr key={m.id_collaborateur}>
                      <td><div className="name-cell"><div className="avatar sm">{initials(m.nom)}</div><span className="n">{m.nom}</span></div></td>
                      <td>{stats.actives}</td>
                      <td><div className="progress-row"><div className="progress-track"><div className={`progress-fill${stats.pct >= 50 ? ' green' : ''}`} style={{ width: `${stats.pct}%` }}></div></div><span>{stats.pct}%</span></div></td>
                      <td><span className={`dot ${m.actif ? 'on' : 'off'}`}></span>{m.actif ? 'Actif' : 'Inactif'}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" disabled={busyId === m.id_collaborateur} onClick={() => retirer(m)}>
                          <Icon.trash /> Retirer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-head"><div><h2>Affecter un membre</h2></div></div>
            <div className="form-grid">
              <div className="field full">
                <label>Collaborateur</label>
                <input type="text" placeholder="Rechercher un collaborateur…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {suggestions.length > 0 && (
                <div className="field full">
                  <div className="list">
                    {suggestions.map((c) => (
                      <div className="list-item" key={c.id_collaborateur}>
                        <div className="avatar sm">{initials(c.nom)}</div>
                        <div className="body"><div className="title">{c.nom}</div><div className="desc">{c.email}</div></div>
                        <button className="btn btn-primary btn-sm" disabled={busyId === c.id_collaborateur} onClick={() => ajouter(c)}>
                          <Icon.plus /> Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {query.trim().length > 0 && suggestions.length === 0 && (
                <div className="field full" style={{ color: 'var(--text-muted)' }}>Aucun collaborateur correspondant (ou déjà dans l'équipe).</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================= TÂCHES ================= */
function TachesPage({ taches, loadingTaches, membres, activeEquipeId, activeEquipeType, showToast, onChangerStatut, onChanged }) {
  const [filter, setFilter] = useState('toutes')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { confirm, ConfirmDialog } = useConfirm()

  // Compteurs globaux (indépendants du filtre de recherche/onglet actif) pour les
  // 4 cartes en haut de la page — cliquables, comme les cartes KPI du tableau de bord.
  const totalTaches = taches.length
  const tachesEnCours = taches.filter((t) => t.statut === 'en_cours').length
  const tachesValidees = taches.filter((t) => t.statut === 'validee').length
  const tachesARefaire = taches.filter((t) => t.statut === 'a_refaire').length

  const tachesFiltrees = taches.filter((t) => {
    if (search.trim() && !(`${t.titre} ${t.description || ''}`.toLowerCase().includes(search.trim().toLowerCase()))) return false
    if (filter === 'toutes') return true
    if (filter === 'en_cours') return t.statut === 'en_cours'
    if (filter === 'validees') return t.statut === 'validee'
    if (filter === 'a_refaire') return t.statut === 'a_refaire'
    // Même définition que la carte KPI "Tâches en retard" du tableau de bord :
    // échéance dépassée et tâche pas encore validée.
    if (filter === 'retard') return t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== 'validee'
    return true
  })

  const tachesNonAssignees = taches.filter((t) => !t.id_collaborateur).length

  const handleDeleteTache = async (t) => {
    const ok = await confirm({
      title: 'Supprimer cette tâche ?',
      message: `« ${t.titre} » sera définitivement supprimée. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    setDeletingId(t.id_tache)
    try {
      await deleteTache(t.id_tache)
      showToast('Tâche supprimée ✓')
      onChanged()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la suppression de la tâche')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {ConfirmDialog}
      <div className="page-head">
        <h2>Tâches</h2>
        <p>Créez des tâches et laissez les membres de l'équipe les choisir eux-mêmes, dans la limite de tâches actives autorisée.</p>
      </div>
      <div className="kpi-grid taches-stats-grid">
        <div className={`kpi clickable${filter === 'toutes' ? ' selected' : ''}`} role="button" tabIndex={0} onClick={() => setFilter('toutes')} onKeyDown={(e) => { if (e.key === 'Enter') setFilter('toutes') }}>
          <div className="num">{totalTaches}</div><div className="label">Total des tâches</div>
        </div>
        <div className={`kpi clickable${filter === 'en_cours' ? ' selected' : ''}`} role="button" tabIndex={0} onClick={() => setFilter('en_cours')} onKeyDown={(e) => { if (e.key === 'Enter') setFilter('en_cours') }}>
          <div className="num" style={{ color: 'var(--red)' }}>{tachesEnCours}</div><div className="label">En cours</div>
        </div>
        <div className={`kpi clickable${filter === 'validees' ? ' selected' : ''}`} role="button" tabIndex={0} onClick={() => setFilter('validees')} onKeyDown={(e) => { if (e.key === 'Enter') setFilter('validees') }}>
          <div className="num" style={{ color: 'var(--green)' }}>{tachesValidees}</div><div className="label">Validées</div>
        </div>
        <div className={`kpi clickable${filter === 'a_refaire' ? ' selected' : ''}`} role="button" tabIndex={0} onClick={() => setFilter('a_refaire')} onKeyDown={(e) => { if (e.key === 'Enter') setFilter('a_refaire') }}>
          <div className="num" style={{ color: 'var(--amber)' }}>{tachesARefaire}</div><div className="label">À refaire</div>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>Toutes les tâches</h2><div className="hint">{taches.length} tâche{taches.length > 1 ? 's' : ''}{tachesNonAssignees > 0 ? ` · ${tachesNonAssignees} non assignée${tachesNonAssignees > 1 ? 's' : ''}` : ''}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="input-search"
              placeholder="Rechercher une tâche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Icon.plus /> Créer une tâche</button>
          </div>
        </div>
        <div className="tab-bar">
          <button className={filter === 'toutes' ? 'active' : ''} onClick={() => setFilter('toutes')}>Toutes</button>
          <button className={filter === 'en_cours' ? 'active' : ''} onClick={() => setFilter('en_cours')}>En cours</button>
          <button className={filter === 'validees' ? 'active' : ''} onClick={() => setFilter('validees')}>Validées</button>
          <button className={filter === 'a_refaire' ? 'active' : ''} onClick={() => setFilter('a_refaire')}>À refaire</button>
          <button className={filter === 'retard' ? 'active' : ''} onClick={() => setFilter('retard')}>En retard</button>
        </div>
        <table>
          <thead><tr><th>Tâche</th><th>Assignée à</th><th>Priorité</th><th>Deadline</th><th>État</th><th className="col-actions"></th></tr></thead>
          <tbody>
            {loadingTaches && <tr><td colSpan={6}>Chargement…</td></tr>}
            {!loadingTaches && tachesFiltrees.length === 0 && <tr><td colSpan={6}>Aucune tâche dans ce filtre.</td></tr>}
            {tachesFiltrees.map((t) => (
              <tr key={t.id_tache}>
                <td><b>{t.titre}</b>{t.description && <div className="desc" style={{ marginTop: 4 }}>{t.description}</div>}</td>
                <td>{t.collaborateur_nom
                  ? <div className="name-cell"><div className="avatar sm">{initials(t.collaborateur_nom)}</div><span className="n">{t.collaborateur_nom}</span></div>
                  : <span style={{ color: 'var(--text-faint)' }}>Non assignée</span>}
                </td>
                <td><span className={`badge ${t.priorite || 'moyenne'}`}>{PRIORITE_LABELS[t.priorite] || 'Moyenne'}</span></td>
                <td>{formatDateShortFr(t.date_echeance)}</td>
                <td>
                  <select className="status-select" value={t.statut} onChange={(e) => onChangerStatut(t.id_tache, e.target.value)}>
                    {STATUT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td className="col-actions">
                  <button
                    type="button"
                    className="icon-btn sm danger"
                    title="Supprimer la tâche"
                    disabled={deletingId === t.id_tache}
                    onClick={() => handleDeleteTache(t)}
                  >
                    <Icon.trash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <NouvelleTacheModal
          activeEquipeId={activeEquipeId}
          activeEquipeType={activeEquipeType}
          showToast={showToast}
          confirm={confirm}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); onChanged() }}
        />
      )}
    </>
  )
}

function NouvelleTacheModal({ activeEquipeId, activeEquipeType, showToast, confirm, onClose, onCreated }) {
  const [items, setItems] = useState([{ titre: '', description: '', priorite: 'moyenne', date_echeance: '', collapsed: false }])
  const [saving, setSaving] = useState(false)

  // Ferme sans demander si rien n'a été saisi ; sinon confirme, pour ne pas perdre
  // le travail d'un clic accidentel en dehors de la modale.
  const hasContenuNonVide = items.some((it) => it.titre.trim() || it.description.trim())
  const demanderFermeture = async () => {
    if (!hasContenuNonVide) { onClose(); return }
    const ok = await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'Les tâches en cours de saisie seront perdues.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    })
    if (ok) onClose()
  }

  const majItem = (index, champ, valeur) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [champ]: valeur } : it)))
  }
  // Une tâche "Enregistrée" se replie en une ligne compacte (titre, priorité, échéance) pour
  // ne pas allonger la modale — on la ré-ouvre en cliquant sur "Modifier" pour la corriger.
  const enregistrerLigne = (index) => {
    const it = items[index]
    if (!it.titre.trim()) { showToast('Le titre est requis pour enregistrer la tâche'); return }
    setItems((prev) => prev.map((x, i) => (i === index ? { ...x, collapsed: true } : x)))
  }
  const modifierLigne = (index) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, collapsed: false } : it)))
  const ajouterLigne = () => setItems((prev) => [
    // On replie automatiquement les tâches déjà titrées en cours d'édition avant
    // d'ouvrir une nouvelle ligne, pour garder la liste compacte.
    ...prev.map((it) => (it.titre.trim() ? { ...it, collapsed: true } : it)),
    { titre: '', description: '', priorite: 'moyenne', date_echeance: '', collapsed: false },
  ])
  const retirerLigne = (index) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))

  const creerTaches = async (e) => {
    e.preventDefault()
    const aEnvoyer = items
      .map((it) => ({ titre: it.titre.trim(), description: it.description.trim() || null, priorite: it.priorite, date_echeance: it.date_echeance || null }))
      .filter((it) => it.titre)
    if (aEnvoyer.length === 0) { showToast('Le titre d\'au moins une tâche est requis'); return }
    setSaving(true)
    try {
      const commun = {
        id_sous_equipe: activeEquipeType === 'hors_up' ? null : activeEquipeId,
        id_equipe_hors_up: activeEquipeType === 'hors_up' ? activeEquipeId : null,
      }
      if (aEnvoyer.length === 1) {
        await createTache({ ...aEnvoyer[0], ...commun, id_collaborateur: null, statut: 'a_faire' })
      } else {
        await createTachesEnLot({ taches: aEnvoyer, ...commun })
      }
      showToast(
        aEnvoyer.length > 1
          ? `${aEnvoyer.length} tâches créées ✓ — l'équipe a été notifiée par e-mail`
          : 'Tâche créée ✓ — l\'équipe a été notifiée et peut la choisir depuis "Mes tâches"'
      )
      onCreated()
    } catch (err) {
      console.error(err)
      showToast(err?.response?.data?.message || 'Erreur lors de la création des tâches')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={demanderFermeture}>
      <div className="modal-card tasks-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={demanderFermeture} aria-label="Fermer">×</button>
        <div className="modal-title">Nouvelle liste de tâches</div>
        <div className="modal-sub">Chaque tâche est créée sans assignation, avec sa propre priorité et échéance. L'équipe reçoit une seule notification (in-app + e-mail) récapitulant toute la liste, et chacun peut choisir la tâche qu'il veut depuis "Mes tâches".</div>
        <form className="form-grid" onSubmit={creerTaches}>
          <div className="field full tache-list-scroll">
          {items.map((it, i) => (
            it.collapsed ? (
              <div
                className="list-item tache-collapsed"
                key={i}
                style={{ border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}
                onClick={() => modifierLigne(i)}
              >
                <div className="body">
                  <div className="title">{it.titre}</div>
                  <div className="meta">
                    {it.date_echeance && <span>Échéance : {formatDateShortFr(it.date_echeance)}</span>}
                    <span className={`badge ${it.priorite}`}>{PRIORITE_LABELS[it.priorite] || 'Moyenne'}</span>
                  </div>
                </div>
                <div className="actions">
                  <button type="button" className="icon-btn sm" title="Modifier" onClick={(e) => { e.stopPropagation(); modifierLigne(i) }}><Icon.edit /></button>
                  <button type="button" className="icon-btn sm danger" title="Retirer" onClick={(e) => { e.stopPropagation(); retirerLigne(i) }}><Icon.trash /></button>
                </div>
              </div>
            ) : (
            <div className="field full" key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Tâche {i + 1}</label>
                {items.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => retirerLigne(i)}>Retirer</button>
                )}
              </div>
              <input type="text" placeholder="Titre — ex. Maquette écran connexion" value={it.titre} onChange={(e) => majItem(i, 'titre', e.target.value)} style={{ marginBottom: 8 }} />
              <textarea placeholder="Description (optionnel)…" value={it.description} onChange={(e) => majItem(i, 'description', e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label>Priorité</label>
                  <select value={it.priorite} onChange={(e) => majItem(i, 'priorite', e.target.value)}>
                    {PRIORITE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 160px' }}>
                  <label>Date limite</label>
                  <input type="date" value={it.date_echeance} onChange={(e) => majItem(i, 'date_echeance', e.target.value)} />
                </div>
              </div>
              {warningDateSeule(it.date_echeance) && (
                <div className="date-warning" style={{ marginTop: 6 }}>⚠ {warningDateSeule(it.date_echeance)}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => enregistrerLigne(i)}>Enregistrer la tâche</button>
              </div>
            </div>
            )
          ))}
          </div>
          <div className="field full">
            <button type="button" className="btn btn-ghost btn-sm" onClick={ajouterLigne}>+ Ajouter une tâche à la liste</button>
          </div>
          <div className="field full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={demanderFermeture}>Annuler</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Création…' : items.length > 1 ? `Publier la liste (${items.filter((it) => it.titre.trim()).length})` : 'Créer la tâche'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ================= AVANCEMENT ================= */
function Avancement({ membres, taches, tauxCompletion }) {
  const validees = taches.filter((t) => t.statut === 'validee').length
  const aRefaire = taches.filter((t) => t.statut === 'a_refaire').length
  const nonRealisees = taches.filter((t) => t.statut === 'a_faire').length

  const repartition = membres
    .map((m) => ({ ...m, ...statsForMembre(m.id_collaborateur, taches) }))
    .sort((a, b) => b.pct - a.pct)

  return (
    <>
      <div className="page-head">
        <h2>Avancement</h2>
        <p>Visualisez la répartition des tâches par membre et le taux d'avancement global de la sous-équipe.</p>
      </div>
      <div className="kpi-grid">
        <div className="kpi"><div className="top"><div className="icon-wrap green"><Icon.check /></div></div><div className="num">{validees}</div><div className="label">Tâches validées</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap amber"><Icon.clock /></div></div><div className="num">{aRefaire}</div><div className="label">À refaire</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap red"><Icon.cross /></div></div><div className="num">{nonRealisees}</div><div className="label">Non réalisées</div></div>
        <div className="kpi"><div className="top"><div className="icon-wrap blue"><Icon.trending /></div></div><div className="num">{tauxCompletion}%</div><div className="label">Taux de complétion</div></div>
      </div>
      <div className="card">
        <div className="card-head"><div><h2>Répartition par membre</h2><div className="hint">Part des tâches validées sur le total assigné</div></div></div>
        <div>
          {repartition.map((m) => (
            <div className="criteria-row" key={m.id_collaborateur}>
              <div className="top"><b>{m.nom}</b><span>{m.total ? `${m.pct}%` : 'Aucune tâche'}</span></div>
              <div className="progress-track"><div className={`progress-fill${m.pct >= 50 ? ' green' : ''}`} style={{ width: `${m.pct}%` }}></div></div>
            </div>
          ))}
          {repartition.length === 0 && <div style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Aucun membre affecté pour le moment.</div>}
        </div>
      </div>
    </>
  )
}

/* ================= ACTIVITÉ HORS-ÉQUIPE (lecture seule) ================= */
// Même principe que la vue admin : le responsable consulte, à titre informatif,
// les activités hors-équipe déclarées par les collaborateurs qui concernent une
// des équipes qu'il gère — aucune action possible (pas d'accepter/refuser).
function ActiviteHorsEquipe({ demandes, loadingDemandes }) {
  const [selected, setSelected] = useState(null)

  const toutes = [...demandes].sort((a, b) => new Date(b.date_reception) - new Date(a.date_reception))

  const periodeLabel = selected && (selected.date_debut || selected.date_fin)
    ? `${selected.date_debut ? new Date(selected.date_debut).toLocaleDateString('fr-FR') : '—'} → ${selected.date_fin ? new Date(selected.date_fin).toLocaleDateString('fr-FR') : '—'}`
    : null

  return (
    <>
      <div className="page-head">
        <h2>Activité hors-équipe</h2>
        <p>Vue en lecture seule des activités hors-équipe déclarées par les collaborateurs de vos équipes, avec leur statut.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Toutes les activités</h2>
            <div className="hint">{loadingDemandes ? '…' : `${toutes.length} activité${toutes.length > 1 ? 's' : ''}`}</div>
          </div>
        </div>
        <div className="list">
          {toutes.map((d) => (
            <div className="list-item" key={d.id_demande} style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
              <div className="avatar sm">{initials(d.collaborateur_nom)}</div>
              <div className="body">
                <div className="title">{d.collaborateur_nom}</div>
                <div className="desc">{d.titre}</div>
                <div className="meta">
                  <span>{relativeDays(d.date_reception)}</span>
                  <span className={`statut-pill ${statutBadge(d.statut).cls}`}>{statutBadge(d.statut).label}</span>
                </div>
              </div>
            </div>
          ))}
          {!loadingDemandes && toutes.length === 0 && (
            <div className="list-item"><div className="body"><div className="desc">Aucune activité hors-équipe pour le moment</div></div></div>
          )}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Fermer">×</button>
            <div className="modal-title">Détail de l'activité</div>
            <div className="modal-sub">
              <strong style={{ color: 'var(--text)' }}>{selected.collaborateur_nom}</strong> — {selected.titre}
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <b style={{ color: 'var(--text)' }}>Statut : </b>
                <span className={`statut-pill ${statutBadge(selected.statut).cls}`}>{statutBadge(selected.statut).label}</span>
              </div>
              {selected.description && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Description : </b>{selected.description}</div>
              )}
              {periodeLabel && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Période : </b>{periodeLabel}</div>
              )}
              {selected.equipes_noms ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Équipe(s) concernée(s) : </b>{selected.equipes_noms}</div>
              ) : (
                <>
                  {selected.sous_equipe_nom && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Sous-équipe concernée : </b>{selected.sous_equipe_nom}</div>
                  )}
                  {selected.up_nom && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><b style={{ color: 'var(--text)' }}>Équipe hors UP concernée : </b>{selected.up_nom}</div>
                  )}
                </>
              )}
              {!selected.description && !periodeLabel && !selected.equipes_noms && !selected.sous_equipe_nom && !selected.up_nom && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Aucune information complémentaire fournie</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ================= MON PROFIL (responsable) ================= */
function MonProfilResponsable({ user, showToast, updateUser, dark, onToggleDark }) {
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(null) // 'notifications_email' | 'profil_visible' | null

  const name = profil?.nom || user?.nom || 'Responsable'
  const email = profil?.email || user?.email

  useEffect(() => {
    getMonProfil()
      .then(setProfil)
      .catch((err) => {
        console.error('Erreur chargement du profil:', err)
        showToast?.('Erreur lors du chargement de votre profil')
      })
      .finally(() => setLoading(false))
  }, [showToast])

  const togglePref = async (key) => {
    if (!profil) return
    const nextValue = !profil[key]
    setProfil((p) => ({ ...p, [key]: nextValue })) // optimiste
    setSavingPref(key)
    try {
      const updated = await updateMesPreferences({ [key]: nextValue })
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
      const updated = await updateMonProfilIdentite({ nom, email: emailPropre })
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

  return (
    <>
      <div className="card">
        <div className="profile-hero">
          <div className="avatar">{initials(name)}</div>
          <div style={{ flex: 1 }}>
            <div className="pname">{name}</div>
            <div className="prole">Responsable{email ? ` · ${email}` : ''}</div>
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
            <div className="info-row"><span className="k">Sous-équipes gérées</span><span className="v">{loading ? '…' : (profil?.sous_equipes || '—')}</span></div>
          </>
        )}
      </div>

      <div className="grid-2">
        <div>
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