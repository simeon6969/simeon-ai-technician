const { test } = require('node:test')
const assert = require('node:assert/strict')
const { classifyNavigation } = require('./navigation.cjs')

test('keeps the trusted website and hash routes inside the application', () => {
  assert.equal(classifyNavigation('https://simeon-frontend.onrender.com/#login'), 'internal')
})
test('external links cannot masquerade as the trusted origin', () => {
  for (const url of ['https://simeon-frontend.onrender.com.evil.example', 'https://simeon-frontend.onrender.com@evil.example']) {
    assert.equal(classifyNavigation(url), 'external')
  }
})
test('blocks executable protocols, local files and malformed input', () => {
  for (const url of ['javascript:alert(1)', 'file:///C:/Windows', 'data:text/html,test', 'ms-settings:privacy', 'not a URL', 'http://example.com']) {
    assert.equal(classifyNavigation(url), 'blocked')
  }
})
test('supports browser and contact links', () => {
  for (const url of ['https://wa.me/250786854200', 'mailto:simeon0202@icloud.com', 'tel:+250786854200']) {
    assert.equal(classifyNavigation(url), 'external')
  }
})
