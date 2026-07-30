import { useEffect, useRef, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { forgotPassword, verifyResetCode, resetPassword } from '../../services/api.js'
import { getPasswordChecklist, isPasswordStrong, PASSWORD_RULES_MESSAGE } from '../../utils/passwordrules.js'
import { useConfirm } from '../../hooks/useConfirm.jsx'

const ROLE_LABELS = {
  collaborateur: 'Collaborateur',
  responsable: 'Responsable',
  admin: 'Admin',
}

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60 // secondes

const STEP_ORDER = ['email', 'code', 'newpass']
const STEP_LABELS = ['Email', 'Code', 'Nouveau mot de passe']

// Modal "Mot de passe oublié" en 3 étapes : email -> code à 6 chiffres -> nouveau mot de passe.
// role : espace sélectionné sur l'écran de connexion (collaborateur / responsable / admin),
// on l'utilise tel quel pour savoir dans quelle table chercher le compte.
function ForgotPasswordModal({ role, onClose }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const inputsRef = useRef([])
  const [pendingToken, setPendingToken] = useState(null)
  const [resetToken, setResetToken] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { confirm, ConfirmDialog } = useConfirm()

  // Ferme sans demander si rien n'a été saisi à l'étape en cours ; sinon confirme,
  // pour ne pas perdre la saisie à cause d'un clic accidentel en dehors de la modale.
  const demanderFermeture = async () => {
    if (loading) return
    let contenuNonVide = false
    if (step === 'email') contenuNonVide = !!email.trim()
    else if (step === 'code') contenuNonVide = digits.some((d) => d)
    else if (step === 'newpass') contenuNonVide = !!(password || confirmPassword)
    if (!contenuNonVide) { onClose(); return }
    const ok = await confirm({
      title: 'Fermer sans enregistrer ?',
      message: 'La saisie en cours sera perdue.',
      confirmLabel: 'Fermer sans enregistrer',
      danger: true,
    })
    if (ok) onClose()
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Ferme la modale sur Échap, sauf en plein envoi
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !loading) demanderFermeture()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, step, email, digits, password, confirmPassword]) // eslint-disable-line react-hooks/exhaustive-deps

  const stepIndex = STEP_ORDER.indexOf(step)

  async function handleSendCode(e) {
    e?.preventDefault()
    setError('')
    if (!email.trim()) { setError('Merci de renseigner votre adresse email.'); return }
    if (!captchaToken) { setError("Merci de confirmer que vous n'êtes pas un robot."); return }
    setLoading(true)
    try {
      const data = await forgotPassword(role, email.trim())
      setPendingToken(data.pendingToken)
      setStep('code')
      setDigits(Array(CODE_LENGTH).fill(''))
      setCooldown(RESEND_COOLDOWN)
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi du code.")
    } finally {
      setLoading(false)
    }
  }

  function handleDigitChange(index, value) {
    const v = value.replace(/\D/g, '').slice(-1)
    setDigits((d) => {
      const next = [...d]
      next[index] = v
      return next
    })
    if (v && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  function handleDigitKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!text) return
    e.preventDefault()
    setDigits((d) => {
      const next = [...d]
      for (let i = 0; i < text.length; i++) next[i] = text[i]
      return next
    })
    inputsRef.current[Math.min(text.length, CODE_LENGTH - 1)]?.focus()
  }

  async function handleVerifyCode(e) {
    e?.preventDefault()
    setError('')
    const code = digits.join('')
    if (code.length !== CODE_LENGTH) { setError('Merci de saisir les 6 chiffres du code.'); return }
    setLoading(true)
    try {
      const data = await verifyResetCode(pendingToken, code)
      setResetToken(data.resetToken)
      setStep('newpass')
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return
    setError('')
    setLoading(true)
    try {
      const data = await forgotPassword(role, email.trim())
      setPendingToken(data.pendingToken)
      setCooldown(RESEND_COOLDOWN)
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi du code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    if (!isPasswordStrong(password)) { setError(PASSWORD_RULES_MESSAGE); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      await resetPassword(resetToken, password)
      setStep('done')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) demanderFermeture() }}>
      <div className="modal-card fp-card">
        <button type="button" className="modal-close" onClick={demanderFermeture} aria-label="Fermer">×</button>

        {step !== 'done' && (
          <div className="fp-steps">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={`fp-step ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}>
                <span className="fp-dot" />
                <span className="fp-step-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendCode}>
            <h3 className="fp-title">Mot de passe oublié</h3>
            <p className="fp-sub">
              Entrez l'adresse email associée à votre compte <strong>{ROLE_LABELS[role]}</strong> pour recevoir un code de vérification.
            </p>
            {error && <div className="form-error">{error}</div>}
            <div className="field full">
              <label>Adresse email</label>
              <input
                type="email"
                placeholder="nom@esprit.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <h3 className="fp-title">Vérification du code</h3>
            <p className="fp-sub">Entrez le code à 6 chiffres envoyé à <strong>{email}</strong>.</p>
            {error && <div className="form-error">{error}</div>}
            <div className="code-inputs" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  className="code-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                />
              ))}
            </div>
            <div className="fp-resend">
              {cooldown > 0
                ? <span>Renvoyer le code dans {cooldown}s</span>
                : <button type="button" onClick={handleResend} disabled={loading}>Renvoyer le code</button>}
            </div>
            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Vérification…' : 'Vérifier le code'}
            </button>
          </form>
        )}

        {step === 'newpass' && (
          <form onSubmit={handleResetPassword}>
            <h3 className="fp-title">Nouveau mot de passe</h3>
            <p className="fp-sub">Choisissez un nouveau mot de passe pour votre compte.</p>
            {error && <div className="form-error">{error}</div>}
            <div className="field full">
              <label>Nouveau mot de passe</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8 caractères, majuscule, minuscule, chiffre, symbole"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {password && (
                <ul className="password-checklist">
                  {getPasswordChecklist(password).map((rule) => (
                    <li key={rule.key} className={rule.ok ? 'ok' : ''}>
                      <span className="dot">{rule.ok ? '✓' : '•'}</span>{rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="field full">
              <label>Confirmer le mot de passe</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

            </div>
            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="fp-done">
            <div className="fp-done-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="fp-title" style={{ textAlign: 'center' }}>Mot de passe mis à jour</h3>
            <p className="fp-sub" style={{ textAlign: 'center' }}>
              Vous pouvez désormais vous connecter avec votre nouveau mot de passe.
            </p>
            <button className="btn btn-primary login-submit" type="button" onClick={onClose}>
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
    {ConfirmDialog}
    </>
  )
}

export default ForgotPasswordModal