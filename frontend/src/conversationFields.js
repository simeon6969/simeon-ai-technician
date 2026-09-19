export const jobFields = [
  ['equipment', 'Equipment', 'Example: Humacount 30TS', true],
  ['manufacturer', 'Manufacturer', 'Example: HUMAN', true],
  ['model', 'Model', 'Equipment model', true],
  ['problem_description', 'Problem Description', 'Describe the reported problem', true],
  ['symptoms', 'Symptoms / Error', 'What symptoms or error messages were observed?'],
  ['diagnosis', 'Diagnosis', 'What was found to be causing the problem?'],
  ['solution', 'Solution / Repair Performed', 'Describe the repair or maintenance performed'],
  ['parts_used', 'Parts Used', 'Example: Sample probe tubing'],
  ['photo_data', 'Job card photo (optional)', '', false, 'photo'],
  ['successful', 'Maintenance successful', 'I confirm the maintenance was completed successfully. This will validate the job card and add it to Simeon\'s trusted technical knowledge.', true, 'boolean'],
]

export const partFields = [
  ['part_name', 'Part Name', 'Example: Sample probe', true],
  ['price', 'Asking price', 'How much would you like to be paid for this spare part?', true, 'price'],
  ['currency', 'Currency', '', true, 'currency'],
  ['part_number', 'Part Number', 'Example: PN-12345'],
  ['manufacturer', 'Manufacturer', 'Example: HUMAN'],
  ['compatible_equipment', 'Compatible Equipment', 'Example: Humacount 30TS'],
  ['availability_status', 'Availability', '', true, 'availability'],
  ['specifications', 'Specifications', 'Enter technical specifications'],
  ['description', 'Description', 'Describe the spare part and any compatibility information'],
  ['photo_data', 'Spare-part photo (optional)', '', false, 'photo'],
]

export function jobPayload(answers, equipmentId) {
  return {
    equipment_id: equipmentId, maintenance_type: 'corrective',
    submitter_name: answers.submitter_name || null,
    fault_description: answers.problem_description, symptoms: answers.symptoms || null,
    diagnosis: answers.diagnosis || null, actions_taken: answers.solution || null,
    parts_used: answers.parts_used || null, result: answers.solution || null,
    photo_data: answers.photo_data || null, successful: answers.successful === true,
  }
}

export function jobFieldsForAccount(role) {
  return role === 'technician' ? jobFields : [
    ['submitter_name', 'Submitter name', 'Who is completing this job card? Enter your full name.', true],
    ...jobFields,
  ]
}
