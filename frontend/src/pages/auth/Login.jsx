import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import EspritLogo from '../../components/EspritLogo.jsx'
import './auth.css'
import ReCAPTCHA from 'react-google-recaptcha'
import ForgotPasswordModal from './ForgotPasswordModal.jsx'


const ROLE_HOME = {
  admin: '/admin',
  responsable: '/responsable',
  collaborateur: '/',
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('collaborateur')
  const [identifiant, setIdentifiant] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Le mot de passe est verrouillé tant que le nom d'utilisateur n'est pas renseigné —
  // si l'utilisateur l'efface après coup, on vide aussi le mot de passe déjà tapé.
  useEffect(() => {
    if (!identifiant.trim() && password) setPassword('')
  }, [identifiant]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!identifiant || !password) {
      setError('Merci de renseigner votre identifiant et votre mot de passe.')
      return
    }
    if (!captchaToken) {
      setError('Merci de confirmer que vous n\'êtes pas un robot.')
      return
    }

    setLoading(true)
    try {
      const data = await login({ role, login: identifiant, password, captchaToken })
      navigate(ROLE_HOME[data.role] || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="login-shell">
        <div className="login-left">
          <EspritLogo full className="login-logo" />

          <h1 className="login-title">
            Connectez-vous à votre espace <span>ESPRIT</span>.
          </h1>

          <div className="login-illustration">
            <svg fill="none" viewBox="0 0 380 260" xmlns="http://www.w3.org/2000/svg">
              <rect fill="#fff" height="196" rx="16" stroke="#ECEDF2" strokeWidth="2" width="288" x="46" y="34"></rect>
              <path d="M46 50a16 16 0 0 1 16-16h256a16 16 0 0 1 16 16v18H46V50Z" fill="#F6F7FA"></path>
              <circle cx="66" cy="51" fill="var(--red)" r="4"></circle>
              <circle cx="80" cy="51" fill="#FBBF24" r="4"></circle>
              <circle cx="94" cy="51" fill="var(--green)" r="4"></circle>
              <rect fill="var(--red-light)" height="132" rx="10" width="60" x="62" y="82"></rect>
              <rect fill="var(--red)" height="7" rx="3.5" width="36" x="74" y="98"></rect>
              <rect fill="#F3C4CC" height="7" rx="3.5" width="36" x="74" y="118"></rect>
              <rect fill="#F3C4CC" height="7" rx="3.5" width="36" x="74" y="138"></rect>
              <rect fill="#F3C4CC" height="7" rx="3.5" width="36" x="74" y="158"></rect>
              <rect fill="#F3C4CC" height="7" rx="3.5" width="24" x="74" y="178"></rect>
              <rect fill="#F6F7FA" height="60" rx="10" width="170" x="140" y="82"></rect>
              <rect fill="var(--red)" height="20" opacity=".55" rx="3" width="14" x="154" y="112"></rect>
              <rect fill="var(--red)" height="32" opacity=".75" rx="3" width="14" x="176" y="100"></rect>
              <rect fill="var(--red)" height="40" rx="3" width="14" x="198" y="92"></rect>
              <rect fill="var(--red)" height="26" opacity=".85" rx="3" width="14" x="220" y="106"></rect>
              <rect fill="var(--red)" height="36" opacity=".65" rx="3" width="14" x="242" y="96"></rect>
              <rect fill="#fff" height="22" rx="6" stroke="#ECEDF2" strokeWidth="1.5" width="170" x="140" y="152"></rect>
              <circle cx="152" cy="163" fill="var(--green)" r="6.5"></circle>
              <path d="M149 163l2.4 2.4 4.6-4.6" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"></path>
              <rect fill="#E7E8EF" height="6" rx="3" width="98" x="166" y="160"></rect>
              <rect fill="#fff" height="22" rx="6" stroke="#ECEDF2" strokeWidth="1.5" width="170" x="140" y="180"></rect>
              <circle cx="152" cy="191" fill="var(--green)" r="6.5"></circle>
              <path d="M149 191l2.4 2.4 4.6-4.6" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"></path>
              <rect fill="#E7E8EF" height="6" rx="3" width="76" x="166" y="188"></rect>
              <g transform="translate(298,20)">
                <circle cx="28" cy="28" fill="#fff" r="28" stroke="#ECEDF2" strokeWidth="2"></circle>
                <circle cx="28" cy="28" fill="none" r="20" stroke="var(--red-light)" strokeWidth="5.5"></circle>
                <circle cx="28" cy="28" fill="none" r="20" stroke="var(--red)" strokeDasharray="94.2 125.6" strokeLinecap="round" strokeWidth="5.5" transform="rotate(-90 28 28)"></circle>
                <text fill="#1D1D2B" fontFamily="Poppins" fontSize="12" fontWeight="800" textAnchor="middle" x="28" y="32">76%</text>
              </g>
              <g transform="translate(26,186)">
                <circle cx="22" cy="22" fill="var(--red)" r="22"></circle>
                <path d="M13 22l6 6 12-12" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2"></path>
              </g>
            </svg>
          </div>
        </div>

        <div className="login-right">
          <form className="login-card" onSubmit={handleSubmit}>
            <p className="login-hint">Veuillez entrer vos identifiants pour accéder à votre espace.</p>

            {error && <div className="form-error">{error}</div>}

            <div className="role-select-group">
              <label>Choisissez votre espace</label>
              <div className="role-options">
                <label className="role-option">
                  <input
                    checked={role === 'collaborateur'}
                    name="login-role"
                    type="radio"
                    value="collaborateur"
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span className="role-circle">
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <span>Collaborateur</span>
                </label>
                <label className="role-option">
                  <input
                    checked={role === 'responsable'}
                    name="login-role"
                    type="radio"
                    value="responsable"
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span className="role-circle">
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  <span>Responsable</span>
                </label>
                <label className="role-option">
                  <input
                    checked={role === 'admin'}
                    name="login-role"
                    type="radio"
                    value="admin"
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span className="role-circle">
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 2l8 3.5v5.5c0 5-3.4 8.9-8 11-4.6-2.1-8-6-8-11V5.5L12 2z"></path>
                      <path d="M9.5 12l1.8 1.8L15 10"></path>
                    </svg>
                  </span>
                  <span>Admin</span>
                </label>
              </div>
            </div>

            <div className="field full">
              <label>Nom d'utilisateur</label>
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
              />
            </div>
           <div className="field full">
            <label>Mot de passe</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={identifiant.trim() ? '••••••••••' : "Renseignez d'abord votre nom d'utilisateur"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!identifiant.trim()}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!identifiant.trim()}
              >
                {showPassword ? (
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                ) : (
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

            <button type="button" className="login-forgot" onClick={() => setShowForgotPassword(true)}>Mot de passe oublié ?</button>

            <ReCAPTCHA
  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
  onChange={(token) => setCaptchaToken(token)}
  onExpired={() => setCaptchaToken(null)}
/>

            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <p className="login-signup">
              Vous n'avez pas de compte ? <Link to="/signup">Créer un compte</Link>
            </p>
          </form>
        </div>
      </div>
      {showForgotPassword && (
        <ForgotPasswordModal role={role} onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  )
}

export default Login
