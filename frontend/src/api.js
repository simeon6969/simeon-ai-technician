const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function createJobCard(jobCard) {
  const response = await fetch(`${API_BASE_URL}/job-cards/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        ...getAuthHeaders(),
    },
    body: JSON.stringify(jobCard),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to save job card')
  }

  return await response.json()
}

export async function validateJobCard(jobCardId) {
  const response = await fetch(
    `${API_BASE_URL}/job-cards/${jobCardId}/validate`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to validate job card')
  }

  return await response.json()
}

export async function getMyJobCards() {
  const response = await fetch(`${API_BASE_URL}/job-cards/`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to load job cards')
  }

  return await response.json()
}

export async function updateJobCard(jobCardId, jobCard) {
  const response = await fetch(`${API_BASE_URL}/job-cards/${jobCardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(jobCard),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to update job card')
  }

  return await response.json()
}

export async function deleteJobCard(jobCardId) {
  const response = await fetch(`${API_BASE_URL}/job-cards/${jobCardId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to delete job card')
  }

  return await response.json()
}

export async function createEquipment(equipment) {
  const params = new URLSearchParams({
    category: equipment.category,
    manufacturer: equipment.manufacturer,
    model: equipment.model,
  })

  if (equipment.description) {
    params.set('description', equipment.description)
  }

  const response = await fetch(`${API_BASE_URL}/equipment/?${params}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to save equipment')
  }

  return await response.json()
}


export async function createSparePart(sparePart) {
  const response = await fetch(`${API_BASE_URL}/spare-parts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      equipment_id: sparePart.equipment_id || null,
      part_number: sparePart.part_number || null,
      part_name: sparePart.part_name,
      manufacturer: sparePart.manufacturer || null,
      description: sparePart.description || null,
      specifications: sparePart.specifications || null,
      compatibility: sparePart.compatible_equipment || null,
      photo_data: sparePart.photo_data || null,
      attachments_data: sparePart.attachments_data || null,
      availability_status: sparePart.availability_status || 'available',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to save spare part')
  }

  return await response.json()
}

export async function searchSpareParts(search = '') {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  const response = await fetch(
    `${API_BASE_URL}/spare-parts/?${params.toString()}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to search spare parts')
  }

  return await response.json()
}

export async function requestSparePart(sparePartId, notes = '') {
  const params = new URLSearchParams()

  if (notes.trim()) {
    params.set('notes', notes.trim())
  }

  const response = await fetch(
    `${API_BASE_URL}/spare-parts/${sparePartId}/request?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to request spare part')
  }

  return await response.json()
}

export async function getMySparePartRequests() {
  const response = await fetch(`${API_BASE_URL}/spare-parts/requests/my`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to load spare-part requests')
  }

  return await response.json()
}

export async function getMySpareParts() {
  const response = await fetch(`${API_BASE_URL}/spare-parts/my`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to load your spare parts')
  }

  return await response.json()
}

export async function deleteSparePart(sparePartId) {
  const response = await fetch(`${API_BASE_URL}/spare-parts/${sparePartId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Failed to delete spare part')
  }

  return await response.json()
}

export async function createChatSession() {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error('Failed to create chat session')
  }

  return await response.json()
}

export async function sendChatMessage(sessionId, message) {
  const response = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}/message`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        message,
      }),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to send chat message')
  }

  return await response.json()
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error('Invalid email or password')
  }

  return await response.json()
}

async function adminRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Admin request failed')
  }

  return await response.json()
}

export function getAdminUsers() {
  return adminRequest('/users')
}

export function updateAdminUserStatus(userId, isActive) {
  return adminRequest(
    `/users/${userId}/status?is_active=${isActive}`,
    { method: 'PUT' }
  )
}

export function getAdminJobCards() {
  return adminRequest('/job-cards')
}

export function getAdminKnowledge() {
  return adminRequest('/knowledge')
}

export function getAdminSpareParts() {
  return adminRequest('/spare-parts')
}

export function getAdminSparePartRequests() {
  return adminRequest('/spare-part-requests')
}

export function updateAdminSparePartRequest(requestId, status, notes = '') {
  const params = new URLSearchParams({ status })

  if (notes.trim()) {
    params.set('notes', notes.trim())
  }

  return adminRequest(`/spare-part-requests/${requestId}?${params}`, {
    method: 'PUT',
  })
}

export async function registerUser(fullName, email, phone, password) {
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      full_name: fullName,
      email,
      phone: phone || null,
      password,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Registration failed')
  }

  return await response.json()
}


