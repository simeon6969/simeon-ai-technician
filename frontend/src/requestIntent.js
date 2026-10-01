const key = 'home-request-intent'
export function readRequestIntent() {
  try {
    const value = JSON.parse(sessionStorage.getItem(key))
    return value && ['sale', 'spare_part'].includes(value.item_type) && Number.isInteger(value.item_id) && Date.now() - value.savedAt < 3600000 ? value : null
  } catch { return null }
}
export function saveRequestIntent(item) {
  try { sessionStorage.setItem(key, JSON.stringify({ item_type: item.item_type, item_id: item.item_id, savedAt: Date.now() })) } catch { /* Login still works without storage. */ }
}
export function clearRequestIntent() { try { sessionStorage.removeItem(key) } catch { /* Optional storage. */ } }
