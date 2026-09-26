import { medicalCategories } from './medicalCategories'
const common = [['quantity', 'Stock quantity', 'number'], ['unit', 'Stock unit (box, pack, vial, unit)'], ['manufacturer', 'Manufacturer'], ['storage_location', 'Storage location']]
const specific = {
  consumables: [['batch_number', 'Batch / lot number'], ['expiry_date', 'Expiry date', 'date'], ['storage_conditions', 'Storage conditions']],
  biomedical: [['model', 'Model'], ['serial_number', 'Serial number'], ['condition', 'Condition'], ['next_service_date', 'Next service date', 'date']],
  pharmacy: [['generic_name', 'Generic medicine name'], ['strength', 'Strength'], ['dosage_form', 'Dosage form'], ['batch_number', 'Batch / lot number'], ['expiry_date', 'Expiry date', 'date'], ['storage_conditions', 'Storage conditions']],
}

export function MedicalStockFields({ category, value, onChange, disabled }) {
  return <fieldset disabled={disabled} className="my-4 grid gap-3 sm:grid-cols-2"><legend className="mb-3 font-semibold">{medicalCategories[category]} — stock details</legend>
    {[...common, ...specific[category]].map(([key, label, type = 'text']) => <label key={key} className="text-sm">{label}<input type={type} required={['quantity', 'unit'].includes(key)} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 1000000000 : undefined} step={type === 'number' ? 1 : undefined} maxLength={key === 'storage_conditions' ? 500 : key === 'unit' ? 60 : 100} value={value[key] ?? ''} onChange={event => onChange({ ...value, [key]: type === 'number' ? event.target.value === '' ? '' : Number(event.target.value) : type === 'date' ? event.target.value || null : event.target.value })} className="mt-1 block w-full rounded-lg border p-3" /></label>)}
  </fieldset>
}

export function MedicalStockSummary({ item }) {
  const details = item.medical_details
  if (!item.medical_category || !details) return null
  const today = new Date().toLocaleDateString('en-CA')
  return <div className="my-3 rounded-lg bg-teal-50 p-3 text-sm"><p className="font-semibold">{medicalCategories[item.medical_category]}</p><p>{details.quantity} {details.unit}</p>
    {details.quantity === 0 && <p className="font-semibold text-amber-800">Out of stock</p>}
    {details.expiry_date && details.expiry_date < today && <p className="font-semibold text-red-700">Expired stock</p>}
    <dl>{[...common.slice(2), ...specific[item.medical_category]].filter(([key]) => details[key]).map(([key, label]) => <div key={key} className="mt-1"><dt className="font-medium">{label}</dt><dd className="break-words">{details[key]}</dd></div>)}</dl>
  </div>
}
