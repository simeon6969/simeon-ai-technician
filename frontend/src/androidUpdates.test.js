import test from 'node:test'
import assert from 'node:assert/strict'
import { newestAndroidUpdate } from './androidUpdates.js'

function release(build, overrides = {}) {
  return { tag_name: `android-test-${build}`, assets: [{ name: 'Simeon-test.apk', state: 'uploaded', size: 100, browser_download_url: `https://github.com/simeon6969/simeon-ai-technician/releases/download/android-test-${build}/Simeon-test.apk` }], ...overrides }
}
test('selects newest uploaded Android APK, ignoring Windows, drafts and incomplete uploads', () => {
  assert.equal(newestAndroidUpdate([release(5), release(12), release(99, { draft: true }), release(100, { assets: [] }), { tag_name: 'windows-v2' }], 4).build, 12)
})
test('never downgrades or offers the installed release', () => {
  assert.equal(newestAndroidUpdate([release(3), release(4)], 4), null)
})
test('rejects unexpected download destinations', () => {
  const item = release(5)
  item.assets[0].browser_download_url = 'https://example.com/app.apk'
  assert.equal(newestAndroidUpdate([item], 4), null)
})
test('invalid metadata and missing installed version are errors', () => {
  assert.throws(() => newestAndroidUpdate({}, 4))
  assert.throws(() => newestAndroidUpdate([], NaN))
})
