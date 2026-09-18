import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

test('production manifest points to correctly sized PNG icons and app entry', () => {
  const manifest = JSON.parse(fs.readFileSync('dist/manifest.webmanifest', 'utf8'))
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.start_url, '/#home')
  for (const icon of manifest.icons) {
    const bytes = fs.readFileSync(`dist${icon.src}`)
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG')
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes)
  }
  assert.ok(fs.existsSync('dist/app-icons/apple-touch-icon.png'))
  assert.ok(fs.readFileSync('dist/index.html', 'utf8').includes('/manifest.webmanifest'))
})

test('service worker ignores private API requests and uses fallback only for failed navigation', async () => {
  const handlers = {}
  const fallback = { offline: true }
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://simeon.example' }, addEventListener: (name, fn) => { handlers[name] = fn } },
    URL, caches: { match: async () => fallback }, fetch: async () => { throw new Error('offline') },
  })
  for (const request of [
    { method: 'POST', mode: 'cors', url: 'https://simeon.example/users/login' },
    { method: 'GET', mode: 'cors', url: 'https://simeon.example/job-cards/' },
    { method: 'GET', mode: 'navigate', url: 'https://simeon.example/users/me' },
    { method: 'GET', mode: 'navigate', url: 'https://api.example/' },
  ]) {
    handlers.fetch({ request, respondWith: () => assert.fail('Private/API request intercepted') })
  }
  let response
  handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://simeon.example/' }, respondWith: (value) => { response = value } })
  assert.equal(await response, fallback)
})
