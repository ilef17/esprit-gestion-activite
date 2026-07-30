import { useCallback, useRef, useState } from 'react'

/**
 * Remplace window.confirm() par une modale personnalisée cohérente avec le
 * design ESPRIT (variante "danger" pour les suppressions irréversibles).
 *
 * Usage dans un composant :
 *   const { confirm, ConfirmDialog } = useConfirm()
 *   ...
 *   const ok = await confirm({
 *     title: 'Supprimer la tâche ?',
 *     message: 'Cette action est irréversible.',
 *     danger: true,
 *   })
 *   if (!ok) return
 *   ...
 *   return <>{ConfirmDialog}...le reste du JSX...</>
 *
 * confirm() accepte aussi une simple chaîne pour un remplacement direct de
 * window.confirm('...') : `if (!(await confirm('Continuer ?'))) return`.
 */
export function useConfirm() {
  const [state, setState] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((opts) => {
    const {
      title = 'Confirmer cette action',
      message = '',
      confirmLabel = 'Confirmer',
      cancelLabel = 'Annuler',
      danger = false,
    } = typeof opts === 'string' ? { message: opts } : (opts || {})

    return new Promise((resolve) => {
      // Si une confirmation précédente est encore en attente (cas rare), on la
      // résout à "false" avant d'en ouvrir une nouvelle, pour ne jamais laisser
      // une promesse orpheline.
      if (resolveRef.current) resolveRef.current(false)
      resolveRef.current = resolve
      setState({ title, message, confirmLabel, cancelLabel, danger })
    })
  }, [])

  const settle = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result)
      resolveRef.current = null
    }
    setState(null)
  }, [])

  const ConfirmDialog = state ? (
    <div className="confirm-overlay" onClick={() => settle(false)}>
      <div
        className={`confirm-card${state.danger ? ' danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">
          {state.danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" /><path d="M12 7.5v6" /><path d="M12 16.5h.01" />
            </svg>
          )}
        </div>
        <div id="confirm-dialog-title" className="confirm-title">{state.title}</div>
        {state.message && <div className="confirm-message">{state.message}</div>}
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => settle(false)}>
            {state.cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${state.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => settle(true)}
            autoFocus
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, ConfirmDialog }
}

export default useConfirm