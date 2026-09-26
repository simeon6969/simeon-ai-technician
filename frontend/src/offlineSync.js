import { trackedFetch } from './requestActivity'
import { jobPayload } from './conversationFields'
import { listQueue, updateQueued } from './offlineStore'

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
let syncing = null

export function submissionPayload(kind, answers, id) {
  if (kind === 'job') return {
    kind, submission_id: id,
    equipment: { category: answers.equipment, manufacturer: answers.manufacturer, model: answers.model, description: answers.problem_description },
    job: jobPayload(answers, 0),
  }
  return { kind, submission_id: id, part: {
    part_name: answers.part_name, part_number: answers.part_number || null,
    manufacturer: answers.manufacturer || null, description: answers.description || null,
    specifications: answers.specifications || null, compatibility: answers.compatible_equipment || null,
    price: answers.price || null, currency: answers.currency || 'RWF',
    availability_status: answers.availability_status || 'available', photo_data: answers.photo_data || null,
  } }
}

export async function syncQueue(userId) {
  if (syncing) return syncing
  const token = localStorage.getItem('access_token')
  const sameAccount = () => token && localStorage.getItem('access_token') === token && localStorage.getItem('user_id') === String(userId)
  if (!sameAccount() || navigator.onLine === false) return
  syncing = (async () => {
    for (const record of await listQueue(userId)) {
      if (!sameAccount() || navigator.onLine === false) break
      if (record.status === 'synced' || record.status === 'blocked') continue
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      try {
        const response = await trackedFetch(`${baseUrl}/offline/submit`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(record.payload), signal: controller.signal,
        })
        if (!response.ok) {
          if ([401, 403].includes(response.status)) {
            await updateQueued({ ...record, error: 'auth' })
            break
          }
          if ([400, 409, 422].includes(response.status)) {
            await updateQueued({ ...record, status: 'blocked', error: 'rejected' })
            continue
          }
          throw new Error('Server unavailable')
        }
        const result = await response.json()
        if (result.kind !== record.kind || !Number.isInteger(result.record_id)) throw new Error('Invalid receipt')
        // Keep a small receipt locally, but release saved photos and answers.
        await updateQueued({ ...record, payload: undefined, status: 'synced', error: null, recordId: result.record_id })
        window.dispatchEvent(new CustomEvent('simeon-synced', { detail: { userId: String(userId), kind: record.kind } }))
      } catch {
        await updateQueued({ ...record, error: 'network' })
        break
      } finally { clearTimeout(timeout) }
    }
  })().finally(() => { syncing = null })
  return syncing
}
