// Règle de robustesse du mot de passe, appliquée à l'inscription et à la
// réinitialisation : 8 caractères minimum, au moins 1 majuscule, 1 minuscule,
// 1 chiffre et 1 symbole. Gardée dans un utilitaire partagé pour ne pas dupliquer
// la règle entre les deux endpoints (register / resetPassword).
export const PASSWORD_RULES_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.'

export function isPasswordStrong(password) {
  if (typeof password !== 'string' || password.length < 8) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  return true
}