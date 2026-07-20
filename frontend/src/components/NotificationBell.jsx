import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getMesNotifications,
  getNotificationsNonLues,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
} from '../services/api.js'

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} j`
}

const TYPE_ICONS = {
  tache_assignee: '📋',
  tache_echeance: '⏰',
  demande_reponse: '✅',
  affectation_pedagogique: '🎓',
  campagne_voeux: '📣',
}

// Cloche de notifications partagée par les 3 tableaux de bord (admin, responsable,
// collaborateur) — branchée sur /api/notifications, avec un rafraîchissement
// périodique du compteur pour rester à jour sans que l'utilisateur ait à recharger.
function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [nonLues, setNonLues] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const pollRef = useRef(null)

  const refreshCount = useCallback(() => {
    getNotificationsNonLues().then((data) => setNonLues(data?.total || 0)).catch(() => {})
  }, [])

  useEffect(() => {
    refreshCount()
    pollRef.current = setInterval(refreshCount, 30000)
    return () => clearInterval(pollRef.current)
  }, [refreshCount])

  const openDropdown = () => {
    setOpen((o) => !o)
    if (!loaded) {
      getMesNotifications()
        .then((data) => { setNotifications(Array.isArray(data) ? data : []); setLoaded(true) })
        .catch((err) => console.error('Erreur chargement notifications:', err))
    }
  }

  const handleClickNotif = (n) => {
    if (!n.lu) {
      marquerNotificationLue(n.id_notification).catch(() => {})
      setNotifications((prev) => prev.map((x) => (x.id_notification === n.id_notification ? { ...x, lu: 1 } : x)))
      setNonLues((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.lien_page) onNavigate?.(n.lien_page)
  }

  const handleMarquerToutesLues = (e) => {
    e.stopPropagation()
    marquerToutesNotificationsLues().catch(() => {})
    setNotifications((prev) => prev.map((x) => ({ ...x, lu: 1 })))
    setNonLues(0)
  }

  return (
    <div className="notif-wrap" style={{ position: 'relative' }}>
      <div className="icon-btn" onClick={openDropdown} style={{ cursor: 'pointer', position: 'relative' }} title="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {nonLues > 0 && <span className="notif-dot" />}
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div className="notif-dropdown" style={{ position: 'absolute', right: 0, top: '120%', width: 340, zIndex: 41 }}>
            <div className="notif-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Notifications</span>
              {nonLues > 0 && (
                <span style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--red)' }} onClick={handleMarquerToutesLues}>
                  Tout marquer lu
                </span>
              )}
            </div>
            {notifications.length === 0 && <div className="notif-empty">Aucune notification pour le moment</div>}
            {notifications.slice(0, 12).map((n) => (
              <div
                key={n.id_notification}
                className="notif-item"
                onClick={() => handleClickNotif(n)}
                style={{ opacity: n.lu ? 0.62 : 1, background: n.lu ? 'transparent' : 'var(--red-light, rgba(228,3,46,0.05))' }}
              >
                <div className="avatar sm" style={{ background: 'transparent', fontSize: 16 }}>{TYPE_ICONS[n.type] || '🔔'}</div>
                <div className="body">
                  <div className="title">{n.titre}</div>
                  <div className="desc" style={{ whiteSpace: 'normal' }}>{n.message}</div>
                  <div className="desc" style={{ marginTop: 2, opacity: 0.75 }}>{relativeTime(n.date_creation)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
