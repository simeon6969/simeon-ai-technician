import test from 'node:test'
import assert from 'node:assert/strict'
import { jobPayload, jobFieldsForAccount } from './conversationFields.js'

test('shared accounts ask for a submitter while technician accounts do not', () => {
  assert.ok(!jobFieldsForAccount('technician').some(([key]) => key === 'submitter_name'))
  for (const role of ['organization', 'institution', 'health_facility', 'other_business']) {
    assert.equal(jobFieldsForAccount(role)[0][0], 'submitter_name')
    assert.equal(jobFieldsForAccount(role)[0][3], true)
  }
  assert.equal(jobPayload({ submitter_name: 'Jane Doe' }, 1).submitter_name, 'Jane Doe')
})

test('conversation answers preserve the repair, equipment ID and photo', () => {
  const photo = 'data:image/png;base64,aGVsbG8='
  const payload = jobPayload({ problem_description: 'Pump stops', solution: 'Replaced seal', successful: true, photo_data: photo }, 42)
  assert.equal(payload.equipment_id, 42)
  assert.equal(payload.fault_description, 'Pump stops')
  assert.equal(payload.actions_taken, 'Replaced seal')
  assert.equal(payload.result, 'Replaced seal')
  assert.equal(payload.photo_data, photo)
  assert.equal(payload.successful, true)
})

test('skipped optional answers are nullable and maintenance remains unconfirmed', () => {
  const payload = jobPayload({ problem_description: 'Not starting', successful: false }, 9)
  assert.equal(payload.successful, false)
  for (const key of ['symptoms', 'diagnosis', 'actions_taken', 'parts_used', 'result', 'photo_data']) assert.equal(payload[key], null)
})

test('only an explicit confirmation marks maintenance successful', () => {
  for (const successful of [undefined, null, false, 'false', 'yes']) {
    assert.equal(jobPayload({ successful }, 1).successful, false)
  }
})
