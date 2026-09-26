import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { translate, translations } from './translations.js'
import { workspaceTranslations } from './workspaceTranslations.js'
import { medicalRecordingFields } from './medicalRecordingFields.js'

const languages = ['rw', 'fr', 'sw']
test('new workspace copy has complete translations in each supported language', () => {
  for (const [key, values] of Object.entries(workspaceTranslations)) {
    for (const language of languages) {
      assert.ok(values[language]?.trim(), `${language}: ${key}`)
      assert.equal(translate(language, key), values[language])
    }
  }
})
test('medical questions and choices are translated without changing stored options', () => {
  const currencies = ['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX']
  for (const fields of Object.values(medicalRecordingFields)) {
    for (const field of fields) {
      for (const key of [field.label, ...(field.options || [])].filter(key => !currencies.includes(key))) {
        for (const language of languages) assert.ok(workspaceTranslations[key]?.[language] || translations[key]?.[language], `${language}: ${key}`)
      }
    }
  }
  assert.ok(medicalRecordingFields.pharmacy.find(field => field.key === 'dosage_form').options.includes('Tablet'))
})
test('literal UI translation calls have entries for all three translated languages', () => {
  const directory = new URL('.', import.meta.url)
  for (const file of readdirSync(directory).filter(file => file.endsWith('.jsx'))) {
    const source = readFileSync(new URL(file, directory), 'utf8')
    for (const match of source.matchAll(/\bt\((['"])(.*?)\1\)/g)) {
      const key = match[2]
      if (!key || key === '?' || key === 'Simeon ·') continue
      for (const language of languages) assert.ok(workspaceTranslations[key]?.[language] || translations[key]?.[language], `${file}: ${language}: ${key}`)
    }
  }
})
