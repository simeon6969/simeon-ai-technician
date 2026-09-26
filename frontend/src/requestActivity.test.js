import test from 'node:test'
import assert from 'node:assert/strict'
import { trackedFetch, getPending } from './requestActivity.js'

test('tracks concurrent requests through body download and clears after failure', async () => {
  const original = globalThis.fetch
  try {
    let finish
    globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { finish = () => { controller.enqueue(new TextEncoder().encode('{"saved":true}')); controller.close() } } }))
    const first = trackedFetch('/save')
    assert.equal(getPending(), 1)
    globalThis.fetch = async () => { throw new Error('offline') }
    await assert.rejects(trackedFetch('/other'), /offline/)
    assert.equal(getPending(), 1)
    finish()
    assert.deepEqual(await (await first).json(), { saved: true })
    assert.equal(getPending(), 0)
    globalThis.fetch = async () => new Response(null, { status: 204 })
    assert.equal((await trackedFetch('/delete')).status, 204)
    assert.equal(getPending(), 0)
  } finally { globalThis.fetch = original }
})
