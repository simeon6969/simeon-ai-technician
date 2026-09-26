import test from 'node:test'
import assert from 'node:assert/strict'
import { medicalRecordingFields, medicalPayload } from './medicalRecordingFields.js'

test('each medical category asks relevant questions without equipment questions in pharmacy', () => {
  const keys = category => medicalRecordingFields[category].map(field => field.key)
  assert(keys('pharmacy').includes('strength'))
  assert(keys('pharmacy').includes('expiry_date'))
  assert(!keys('pharmacy').includes('model'))
  assert(!keys('pharmacy').includes('serial_number'))
  assert(keys('consumables').includes('sterility'))
  assert(!keys('consumables').includes('dosage_form'))
  assert(keys('biomedical').includes('calibration_due_date'))
  for (const category of Object.keys(medicalRecordingFields)) assert.equal(new Set(keys(category)).size, keys(category).length)
})

test('payload retains zero stock and drops skipped optional details', () => {
  const result = medicalPayload('pharmacy', { name: 'Medicine', price: '100', quantity: 0, unit: 'box', supplier: null })
  assert.equal(result.medical_details.quantity, 0)
  assert.equal(result.medical_details.record_version, 2)
  assert(!('supplier' in result.medical_details))
  assert.equal(result.medical_category, 'pharmacy')
})
