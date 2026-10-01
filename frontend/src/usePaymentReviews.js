import { useEffect, useState } from 'react'
import { accountRequest } from './api'

export default function usePaymentReviews(offset, status) {
  const [queue, setQueue] = useState({ total: null, items: [] })
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const refresh = () => setRevision(value => value + 1)
  useEffect(() => {
    let stopped = false, pending = false
    async function load() {
      if (pending || document.visibilityState === 'hidden') return
      pending = true
      setLoading(true)
      try {
        const result = await accountRequest(status ? `/admin/commission-activity?offset=${offset}&limit=50&status=${status}` : `/admin/payment-reviews?offset=${offset}&limit=50`)
        if (!stopped) { setQueue({ ...result, filter: status }); setError(false) }
      } catch { if (!stopped) setError(true) }
      finally { pending = false; if (!stopped) setLoading(false) }
    }
    load()
    const timer = setInterval(load, 30000)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', load)
    window.addEventListener('commission-reviewed', load)
    return () => { stopped = true; clearInterval(timer); window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load); window.removeEventListener('commission-reviewed', load) }
  }, [offset, revision, status])
  return { ...queue, items: queue.filter === status ? queue.items : [], total: queue.filter === status ? queue.total : null, error, loading, refresh }
}
