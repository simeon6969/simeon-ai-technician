const WEBSITE = 'https://simeon-frontend.onrender.com'

function classifyNavigation(value) {
  try {
    const url = new URL(value)
    if (url.origin === WEBSITE) return 'internal'
    if (['https:', 'mailto:', 'tel:'].includes(url.protocol)) return 'external'
  } catch { /* Invalid URLs are never opened. */ }
  return 'blocked'
}

module.exports = { WEBSITE, classifyNavigation }
