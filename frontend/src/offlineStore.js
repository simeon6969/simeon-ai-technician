let database
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('simeon-offline', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'key' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = null; reject(request.error) }
  })
  return database
}

async function transaction(mode, run) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', mode)
    const store = tx.objectStore('records')
    let result
    const setResult = value => { result = value }
    tx.oncomplete = () => {
      if (mode === 'readwrite') window.dispatchEvent(new Event('simeon-offline-change'))
      resolve(result)
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('Storage failed'))
    run(store, setResult)
  })
}

export const draftKey = (userId, kind) => `draft:${userId}:${kind}`
export function readDraft(userId, kind) {
  return transaction('readonly', (store, done) => {
    store.get(draftKey(userId, kind)).onsuccess = event => done(event.target.result)
  })
}
export function saveDraft(userId, kind, data) {
  return transaction('readwrite', store => store.put({ ...data, key: draftKey(userId, kind), userId: String(userId), kind, type: 'draft' }))
}
export function queueDraft(userId, kind, payload) {
  const record = { key: `queue:${userId}:${payload.submission_id}`, userId: String(userId), kind, type: 'queue', payload, status: 'pending', createdAt: new Date().toISOString() }
  return transaction('readwrite', (store, done) => {
    store.add(record)
    store.delete(draftKey(userId, kind))
    done(record)
  })
}
export function listQueue(userId) {
  return transaction('readonly', (store, done) => {
    store.getAll().onsuccess = event => done(event.target.result.filter(row => row.type === 'queue' && row.userId === String(userId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
  })
}
export function updateQueued(record) {
  return transaction('readwrite', store => store.put(record))
}

// Cache only the identity needed to resume this account's own drafts, never tokens.
export function cacheProfile(account) {
  const profile = { user_id: account.user_id, full_name: account.full_name, role: account.role, account_field: account.account_field, subscription: account.subscription }
  try { localStorage.setItem(`offline-profile:${account.user_id}`, JSON.stringify(profile)) } catch { /* Online use still works. */ }
}
export function cachedProfile() {
  const id = localStorage.getItem('user_id')
  if (!id || !localStorage.getItem('access_token')) return null
  try {
    const account = JSON.parse(localStorage.getItem(`offline-profile:${id}`))
    return account && String(account.user_id) === id && account.role !== 'admin' ? account : null
  } catch { return null }
}
