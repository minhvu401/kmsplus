const EMAIL_REGEX = /^[a-zA-Z0-9._%-+]+@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/

// Allow any Unicode letter (including diacritics) and combining marks,
// plus spaces, apostrophes and hyphens.
const FULL_NAME_REGEX = /^[\p{L}\p{M}\s'-]+$/u
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false
  }
  // Trim and validate
  return EMAIL_REGEX.test(email.trim())
}


export function isValidFullName(fullName: string): boolean {
  if (!fullName || typeof fullName !== "string") {
    return false
  }

  // Trim and validate
  const trimmed = fullName.trim()
  
  // Must have at least 2 characters and match allowed characters
  return trimmed.length >= 2 && FULL_NAME_REGEX.test(trimmed)
}
