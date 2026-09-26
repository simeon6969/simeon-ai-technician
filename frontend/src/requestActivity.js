let pending = 0
const listeners = new Set()
export const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener) }
export const getPending = () => pending
function change(amount) { pending += amount; listeners.forEach(listener => listener()) }

export async function trackedFetch(...args) {
  change(1)
  try {
    const response = await fetch(...args)
    // Keep the indicator visible while the response body is downloading too.
    const body = await response.blob()
    if (response.status === 402) {
      const error = JSON.parse(await body.text())
      window.dispatchEvent(new CustomEvent('simeon-payment-required', { detail: error.detail || 'Payment confirmation required' }))
    }
    return new Response(body.size ? body : null, { status: response.status, statusText: response.statusText, headers: response.headers })
  } finally { change(-1) }
}
