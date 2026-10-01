import { trackedFetch } from './requestActivity'
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function getPublicSaleItems(search = '', offset = 0, signal, field = '') {
  const params = new URLSearchParams({ search, offset, limit: 12, lightweight: true })
  if (field) params.set('account_field', field)
  const response = await trackedFetch(`${API_BASE_URL}/sale-items/public?${params}`, { signal })
  if (!response.ok) throw new Error('Unable to load listings')
  return response.json()
}

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
  const response = await trackedFetch(`${API_BASE_URL}/job-cards/`, {
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
  const response = await trackedFetch(
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
  const response = await trackedFetch(`${API_BASE_URL}/job-cards/`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/job-cards/${jobCardId}`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/job-cards/${jobCardId}`, {
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

  const response = await trackedFetch(`${API_BASE_URL}/equipment/?${params}`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/spare-parts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      equipment_id: sparePart.equipment_id || null,
      part_number: sparePart.part_number || null,
      part_name: sparePart.part_name,
      price: sparePart.price || null,
      currency: sparePart.currency || 'RWF',
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

  const response = await trackedFetch(
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

  const response = await trackedFetch(
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
  const response = await trackedFetch(`${API_BASE_URL}/spare-parts/requests/my`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/spare-parts/my`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/spare-parts/${sparePartId}`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/chat/sessions`, {
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
  const response = await trackedFetch(
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
  const response = await trackedFetch(`${API_BASE_URL}/users/login`, {
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
  const response = await trackedFetch(`${API_BASE_URL}/admin${path}`, {
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

export function getAdminSaleItems() {
  return adminRequest('/sale-items')
}

export function deleteAdminRecord(collection, id) {
  return adminRequest(`/${collection}/${id}`, { method: 'DELETE' })
}

export async function saleItemsRequest(path, method = 'GET', data) {
  const response = await trackedFetch(`${API_BASE_URL}/sale-items${path}`, {
    method, headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  })
  if (!response.ok) throw new Error('Unable to update or load sale items.')
  return response.json()
}

export async function postSparePart(id) {
  const response = await trackedFetch(`${API_BASE_URL}/spare-parts/${id}/post`, {
    method: 'POST', headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('Unable to post spare part.')
  return response.json()
}

export async function getSparePartPosts(offset = 0) {
  const response = await trackedFetch(`${API_BASE_URL}/spare-parts/posts?offset=${offset}&limit=20`, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('Unable to load posts.')
  return response.json()
}

export function sendAdminChatMessage(message, history, language) {
  return adminRequest('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, language }),
  })
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

export async function getMyProfile() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await trackedFetch(`${API_BASE_URL}/users/me`, { headers: getAuthHeaders(), signal: controller.signal })
    if (!response.ok) {
      const error = new Error('Unable to load account. Please log in again.')
      error.status = response.status
      throw error
    }
    return await response.json()
  } finally { clearTimeout(timeout) }
}

export async function registerUser(fullName, email, phone, password, role, accountField, subscription) {
  const response = await trackedFetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      full_name: fullName,
      account_field: accountField,
      subscription,
      role,
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



export async function accountRequest(path, method = 'GET', data) {
  const response = await trackedFetch(`${API_BASE_URL}${path}`, { method,
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Unable to complete this request. Check your selections and connection.')
  }
  return response.json()
}

export function listingPhotoUrl(item, original = false) {
  return `${API_BASE_URL}/sale-items/public-photo/${item.item_type}/${item.item_id}?original=${original}`
}

export async function getJobCardForm(signal) {
  const response = await trackedFetch(`${API_BASE_URL}/job-card-form`, { headers: getAuthHeaders(), signal })
  if (!response.ok) throw new Error('Unable to load job-card questions')
  return response.json()
}
