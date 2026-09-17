import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'
import AdminChat from './AdminChat'
import { useEffect, useState } from 'react'
import {
  createJobCard,
  validateJobCard,
  getMyJobCards,
  updateJobCard,
  deleteJobCard,
  createEquipment,
  createSparePart,
  searchSpareParts,
  requestSparePart,
  getMySparePartRequests,
  getMySpareParts,
  deleteSparePart,
  createChatSession,
  sendChatMessage,
  loginUser,
  registerUser,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminJobCards,
  getAdminKnowledge,
  getAdminSpareParts,
  getAdminSparePartRequests,
  updateAdminSparePartRequest,
} from './api'
import { jsPDF } from 'jspdf'

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Choose a JPEG, PNG, or WebP image.'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Photo must be 5 MB or smaller.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read the photo.'))
    reader.readAsDataURL(file)
  })
}

function readAttachments(files) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]

  if (files.length > 5) {
    return Promise.reject(new Error('Choose no more than 5 attachments.'))
  }

  if (files.some((file) => !allowedTypes.includes(file.type))) {
    return Promise.reject(new Error('Attachments must be images or PDF files.'))
  }

  if (files.some((file) => file.size > 5 * 1024 * 1024)) {
    return Promise.reject(new Error('Each attachment must be 5 MB or smaller.'))
  }

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({ name: file.name, type: file.type, data: reader.result })
          reader.onerror = () => reject(new Error('Unable to read an attachment.'))
          reader.readAsDataURL(file)
        })
    )
  ).then((attachments) => JSON.stringify(attachments))
}

function downloadJobCardPdf(card) {
  const pdf = new jsPDF()
  const lines = [
    `Job Card #${card.job_card_id}`,
    `Equipment ID: ${card.equipment_id}`,
    `Maintenance type: ${card.maintenance_type}`,
    `Status: ${card.status}`,
    `Outcome: ${card.successful ? 'Maintenance successful' : 'Pending confirmation'}`,
    '',
    `Fault description: ${card.fault_description || 'Not recorded'}`,
    `Symptoms: ${card.symptoms || 'Not recorded'}`,
    `Diagnosis: ${card.diagnosis || 'Not recorded'}`,
    `Actions taken: ${card.actions_taken || 'Not recorded'}`,
    `Parts used: ${card.parts_used || 'Not recorded'}`,
    `Result: ${card.result || 'Not recorded'}`,
  ]

  pdf.setFontSize(16)
  pdf.text('Simeon Job Card', 20, 20)
  pdf.setFontSize(11)

  let y = 34
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 170)
    pdf.text(wrapped, 20, y)
    y += wrapped.length * 6 + 2

    if (y > 275) {
      pdf.addPage()
      y = 20
    }
  }

  if (card.photo_data) {
    if (y > 190) {
      pdf.addPage()
      y = 20
    }
    pdf.addImage(card.photo_data, 'PNG', 20, y, 100, 75)
  }

  pdf.save(`simeon-job-card-${card.job_card_id}.pdf`)
}

function AdminDashboard({ onLogout }) {
  const { t } = useLanguage()
  const [activeSection, setActiveSection] = useState('users')
  const [users, setUsers] = useState([])
  const [jobCards, setJobCards] = useState([])
  const [knowledge, setKnowledge] = useState([])
  const [spareParts, setSpareParts] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [updatingRequestId, setUpdatingRequestId] = useState(null)

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const [loadedUsers, loadedCards, loadedKnowledge, loadedParts, loadedRequests] =
        await Promise.all([
          getAdminUsers(),
          getAdminJobCards(),
          getAdminKnowledge(),
          getAdminSpareParts(),
          getAdminSparePartRequests(),
        ])
      setUsers(loadedUsers)
      setJobCards(loadedCards)
      setKnowledge(loadedKnowledge)
      setSpareParts(loadedParts)
      setRequests(loadedRequests)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the admin dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadDashboard()
    }, 0)

    return () => clearTimeout(loadTimer)
  }, [])

  const sections = [
    ['users', 'Technicians', users.length],
    ['job-cards', 'Job Cards', jobCards.length],
    ['knowledge', 'Knowledge', knowledge.length],
    ['spare-parts', 'Spare Parts', spareParts.length],
    ['requests', 'Requests', requests.length],
  ]

  function renderUsers() {
    return (
      <div className="grid gap-3">
        {users.map((user) => (
          <div key={user.user_id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                <p className="text-sm text-slate-600">{user.phone || t('No phone provided')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{t(user.role)}</p>
                <button
                  onClick={async () => {
                    try {
                      setUpdatingUserId(user.user_id)
                      await updateAdminUserStatus(user.user_id, !user.is_active)
                      setUsers(await getAdminUsers())
                    } catch (updateError) {
                      setError(updateError.message)
                    } finally {
                      setUpdatingUserId(null)
                    }
                  }}
                  disabled={updatingUserId === user.user_id}
                  className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {updatingUserId === user.user_id
                    ? t('Updating...')
                    : user.is_active ? t('Deactivate') : t('Activate')}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500"> {t("Account status:")} {user.is_active ? t('Active') : t('Inactive')}
            </p>
          </div>
        ))}
      </div>
    )
  }

  function renderJobCards() {
    return (
      <div className="grid gap-3">
        {jobCards.map((card) => (
          <div key={card.job_card_id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{t("Job Card #")}{card.job_card_id}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {t(card.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600"> {t("Technician #")}{card.technician_id} {t("· Equipment #")}{card.equipment_id}
            </p>
            <p className="mt-3 text-sm text-slate-800">{card.fault_description}</p>
            <p className="mt-2 text-sm text-slate-600"> {t("Outcome:")} {card.successful ? t('Successful') : t('Not confirmed')}
            </p>
          </div>
        ))}
      </div>
    )
  }

  function renderKnowledge() {
    return (
      <div className="grid gap-3">
        {knowledge.map((item) => (
          <div key={item.knowledge_id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{t("Knowledge #")}{item.knowledge_id}</h3>
              <span className="text-sm text-slate-600">{t("Confidence")} {item.confidence}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{t("Source Job Card #")}{item.source_job_card_id}</p>
            <p className="mt-3 text-sm text-slate-800">{item.problem_description}</p>
            <p className="mt-2 text-sm text-slate-600">{t("Diagnosis:")} {item.diagnosis || t('Not recorded')}</p>
            <p className="mt-2 text-sm text-slate-600">{t("Solution:")} {item.solution || t('Not recorded')}</p>
          </div>
        ))}
      </div>
    )
  }

  function renderSpareParts() {
    return (
      <div className="grid gap-3">
        {spareParts.map((part) => (
          <div key={part.spare_part_id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{part.part_name}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {t(part.availability_status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{t("Part number:")} {part.part_number || t('Not provided')}</p>
            <p className="mt-1 text-sm text-slate-600">{t("Stored by technician #")}{part.submitted_by}</p>
            <p className="mt-3 text-sm text-slate-800">{part.description || t('No description provided')}</p>
          </div>
        ))}
      </div>
    )
  }

  function renderRequests() {
    return (
      <div className="grid gap-3">
        {requests.map((request) => (
          <div key={request.request_id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{t("Request #")}{request.request_id}</h3>
                <p className="mt-2 text-sm font-medium text-slate-900"> {t("Part:")} {request.spare_part.part_name}
                </p>
                <p className="text-sm text-slate-700"> {t("Part number:")} {request.spare_part.part_number || t('Not provided')}
                  {' · '}{t("Availability:")} {t(request.spare_part.availability_status)}
                </p>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{t("Spare-part owner contact")}</p>
                  <p>{request.supplier_technician.full_name}</p>
                  <p>{request.supplier_technician.email}</p>
                  <p>{request.supplier_technician.phone || t('No phone provided')}</p>
                </div>
                <p className="text-sm text-slate-700"> {t("Manufacturer:")} {request.spare_part.manufacturer || t('Not provided')}
                </p>
                <p className="text-sm text-slate-700"> {t("Compatible equipment:")} {request.spare_part.compatibility || t('Not provided')}
                </p>
                <p className="text-sm text-slate-700"> {t("Specifications:")} {request.spare_part.specifications || t('Not provided')}
                </p>
                <p className="text-sm text-slate-700"> {t("Description:")} {request.spare_part.description || t('Not provided')}
                </p>
                <p className="mt-2 text-sm text-slate-700"> {t("Requester:")} {request.requester.full_name} · {request.requester.email}
                </p>
                <p className="text-sm text-slate-600"> {t("Contact:")} {request.requester.phone || request.requester_contact || t('Not provided')}
                </p>
              </div>
              <select
                value={request.status}
                onChange={async (event) => {
                  try {
                    setUpdatingRequestId(request.request_id)
                    await updateAdminSparePartRequest(request.request_id, event.target.value)
                    setRequests(await getAdminSparePartRequests())
                  } catch (updateError) {
                    setError(updateError.message)
                  } finally {
                    setUpdatingRequestId(null)
                  }
                }}
                disabled={updatingRequestId === request.request_id}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {['new', 'contacted', 'negotiating', 'confirmed', 'ordered', 'delivered', 'completed', 'cancelled']
                  .map((status) => <option key={status} value={status}>{t(status)}</option>)}
              </select>
            </div>
            {request.notes && <p className="mt-3 text-sm text-slate-600">{t("Notes:")} {request.notes}</p>}
          </div>
        ))}
      </div>
    )
  }

  const content = {
    users: renderUsers,
    'job-cards': renderJobCards,
    knowledge: renderKnowledge,
    'spare-parts': renderSpareParts,
    requests: renderRequests,
  }[activeSection]()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">{t("Simeon Admin")}</h1>
            <p className="text-sm text-slate-300">{t("Governance and technical knowledge control")}</p>
          </div>
          <LanguageSwitcher />
          <button
            onClick={onLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          > {t("Logout")} </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t("Admin Dashboard")}</h2>
            <p className="mt-2 text-slate-600">{t("Review technicians, maintenance records, knowledge, parts, and requests.")}</p>
          </div>
          <button
            onClick={loadDashboard}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          > {t("Refresh all")} </button>
        </div>

        <AdminChat />
        <nav className="mb-6 grid gap-2 sm:grid-cols-5">
          {sections.map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-medium ${activeSection === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {t(label)} <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </nav>

        {error && <p className="mb-4 text-sm text-red-600">{t(error)}</p>}
        {loading ? <p className="text-sm text-slate-500">{t("Loading admin data...")}</p> : content}
      </main>
    </div>
  )
}

function App() {
  const { t } = useLanguage()

 const [loggedIn, setLoggedIn] = useState(
  () => Boolean(localStorage.getItem('access_token'))
)
const [userRole, setUserRole] = useState(
  () => localStorage.getItem('user_role') || 'technician'
)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [fullName, setFullName] = useState('')
const [phone, setPhone] = useState('')
const [isRegistering, setIsRegistering] = useState(false)
const [loginError, setLoginError] = useState('')
const [authMessage, setAuthMessage] = useState('')

  const [showStoreMenu, setShowStoreMenu] = useState(false)
  const [showJobCardForm, setShowJobCardForm] = useState(false)
const [helpMode, setHelpMode] = useState(null)

  const [jobCard, setJobCard] = useState({
  equipment: '',
  manufacturer: '',
  model: '',
  problem_description: '',
  symptoms: '',
  diagnosis: '',
  solution: '',
  parts_used: '',
  photo_data: null,
  attachments_data: null,
})

const [savingJobCard, setSavingJobCard] = useState(false)
const [saveMessage, setSaveMessage] = useState('')
const [jobCardSuccessful, setJobCardSuccessful] = useState(false)
const [myJobCards, setMyJobCards] = useState([])
const [jobCardsLoading, setJobCardsLoading] = useState(false)
const [jobCardsError, setJobCardsError] = useState('')
const [confirmingJobCardId, setConfirmingJobCardId] = useState(null)
const [deletingJobCardId, setDeletingJobCardId] = useState(null)

const [showSparePartForm, setShowSparePartForm] = useState(false)

const [sparePart, setSparePart] = useState({
  part_name: '',
  part_number: '',
  manufacturer: '',
  compatible_equipment: '',
  availability_status: 'available',
  specifications: '',
  description: '',
  photo_data: null,
  attachments_data: null,
})

const [savingSparePart, setSavingSparePart] = useState(false)
const [sparePartMessage, setSparePartMessage] = useState('')
const [sparePartSearch, setSparePartSearch] = useState('')
const [sparePartResults, setSparePartResults] = useState([])
const [sparePartSearchLoading, setSparePartSearchLoading] = useState(false)
const [sparePartSearchError, setSparePartSearchError] = useState('')
const [sparePartRequestNotes, setSparePartRequestNotes] = useState({})
const [sparePartRequests, setSparePartRequests] = useState([])
const [sparePartRequestsLoading, setSparePartRequestsLoading] = useState(false)
const [sparePartRequestsError, setSparePartRequestsError] = useState('')
const [requestingSparePartId, setRequestingSparePartId] = useState(null)
const [mySpareParts, setMySpareParts] = useState([])
const [mySparePartsLoading, setMySparePartsLoading] = useState(false)
const [mySparePartsError, setMySparePartsError] = useState('')
const [deletingSparePartId, setDeletingSparePartId] = useState(null)

const [chatSessionId, setChatSessionId] = useState(null)
const [chatQuestion, setChatQuestion] = useState('')
const [chatAnswer, setChatAnswer] = useState('')
const [chatLoading, setChatLoading] = useState(false)

useEffect(() => {
  if (!loggedIn || userRole === 'admin') {
    return
  }

  async function loadMyJobCards() {
    try {
      setJobCardsLoading(true)
      setJobCardsError('')
      setMyJobCards(await getMyJobCards())
    } catch (error) {
      setJobCardsError(error.message || 'Unable to load your job cards.')
    } finally {
      setJobCardsLoading(false)
    }
  }

  loadMyJobCards()
}, [loggedIn, userRole])

useEffect(() => {
  if (!loggedIn || userRole === 'admin') {
    return
  }

  async function loadMySpareParts() {
    try {
      setMySparePartsLoading(true)
      setMySparePartsError('')
      setMySpareParts(await getMySpareParts())
    } catch (error) {
      setMySparePartsError(error.message || 'Unable to load your spare parts.')
    } finally {
      setMySparePartsLoading(false)
    }
  }

  loadMySpareParts()
}, [loggedIn, userRole])

useEffect(() => {
  if (!loggedIn || userRole === 'admin') {
    return
  }

  async function loadSparePartRequests() {
    try {
      setSparePartRequestsLoading(true)
      setSparePartRequestsError('')
      setSparePartRequests(await getMySparePartRequests())
    } catch (error) {
      setSparePartRequestsError(
        error.message || 'Unable to load spare-part requests.'
      )
    } finally {
      setSparePartRequestsLoading(false)
    }
  }

  loadSparePartRequests()
}, [loggedIn, userRole])

function handleLogout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_role')
  setLoggedIn(false)
  setUserRole('technician')
  setChatSessionId(null)
  setChatQuestion('')
  setChatAnswer('')
  setMyJobCards([])
  setSparePartResults([])
  setSparePartRequests([])
  setMySpareParts([])
}

if (!loggedIn) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-end"><LanguageSwitcher /></div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Simeon
          </h1>

          <p className="mt-2 text-sm text-slate-500"> {t("Intelligence Recovery program")} </p>
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          {isRegistering ? t('Create Technician Account') : t('Technician Login')}
        </h2>

        {isRegistering && (
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Full name")} </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("Enter your full name")}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
        )}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Email")} </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("Enter your email")}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Password")} </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Enter your password")}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        {isRegistering && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Phone (optional)")} </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("Enter your phone number")}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
        )}

        {loginError && (
          <p className="mt-4 text-sm text-red-600">
            {t(loginError)}
          </p>
        )}

        <button
          onClick={async () => {
            try {
              setLoginError('')
              setAuthMessage('')

              if (isRegistering) {
                if (!fullName.trim() || !email.trim() || !password) {
                  setLoginError('Full name, email, and password are required.')
                  return
                }

                await registerUser(fullName, email, phone, password)
                setIsRegistering(false)
                setAuthMessage('Account created. You can now log in.')
                return
              }

              const result = await loginUser(email, password)

              localStorage.setItem(
                'access_token',
                result.access_token
              )

              localStorage.setItem(
                'user_id',
                result.user_id
              )

              localStorage.setItem('user_role', result.role)
              setUserRole(result.role)

              setLoggedIn(true)

            } catch (error) {
              setLoginError(error.message)
            }
          }}
          className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
        >
          {isRegistering ? t('Create account') : t('Login')}
        </button>

        {authMessage && (
          <p className="mt-4 text-sm text-green-700">
            {t(authMessage)}
          </p>
        )}

        <button
          onClick={() => {
            setIsRegistering(!isRegistering)
            setLoginError('')
            setAuthMessage('')
          }}
          className="mt-4 w-full text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          {isRegistering
            ? t('Already have an account? Log in')
            : t('Need an account? Create one')}
        </button>

      </div>
    </div>
  )
}

if (loggedIn && userRole === 'admin') {
  return <AdminDashboard onLogout={handleLogout} />
}

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Simeon</h1>
            <p className="text-sm text-slate-300"> {t("Intelligent Technician Friend")} </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
  <LanguageSwitcher />
  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"> {t("Technician")} </span>

  <button
    onClick={handleLogout}
    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
  > {t("Logout")} </button>
</div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900"> {t("Welcome to Simeon")} </h2>

          <p className="mt-2 text-slate-600"> {t("What would you like to do today?")} </p>
        </div>

        {/* Main options */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Store option */}
          <div>
            <button
              onClick={() => setShowStoreMenu(!showStoreMenu)}
              className="w-full rounded-2xl bg-white p-8 text-left shadow-sm transition hover:shadow-lg"
            >
              <div className="mb-4 text-4xl">🛠️</div>

              <h3 className="text-xl font-semibold text-slate-900"> {t("Store a Job Card or Spare Part")} </h3>

              <p className="mt-2 text-slate-600"> {t("Save your maintenance experience, job cards, or spare-part information to help other technicians.")} </p>
            </button>

            {/* Store menu */}
            {showStoreMenu && (
              <div className="mt-3 grid gap-3">

                {/* Job card button */}
                <button
                  onClick={() => setShowJobCardForm(true)}
                  className="rounded-xl bg-white p-5 text-left shadow-sm hover:bg-slate-50"
                >
                  <h4 className="font-semibold text-slate-900"> {t("📋 Digital Job Card")} </h4>

                  <p className="mt-1 text-sm text-slate-600"> {t("Record a maintenance activity, diagnosis, and solution.")} </p>
                </button>

                {/* Spare part button */}
                <button
  onClick={() => setShowSparePartForm(true)}
  className="rounded-xl bg-white p-5 text-left shadow-sm hover:bg-slate-50"
>
                  <h4 className="font-semibold text-slate-900"> {t("🔩 Spare Part")} </h4>

                  <p className="mt-1 text-sm text-slate-600"> {t("Store information about an available spare part.")} </p>
                </button>

              </div>
            )}
          </div>

          {/* Help option */}
          <div>
  <button
    onClick={() =>
      setHelpMode(helpMode === null ? 'menu' : null)
    }
    className="w-full rounded-2xl bg-white p-8 text-left shadow-sm transition hover:shadow-lg"
  >
    <div className="mb-4 text-4xl">🤖</div>

    <h3 className="text-xl font-semibold text-slate-900"> {t("Get Maintenance or Spare-Part Help")} </h3>

    <p className="mt-2 text-slate-600"> {t("Ask Simeon about equipment problems, maintenance procedures, or spare parts.")} </p>
  </button>

  {helpMode === 'menu' && (
    <div className="mt-3 grid gap-3">
      <button
        onClick={() => setHelpMode('maintenance')}
        className="rounded-xl bg-white p-5 text-left shadow-sm hover:bg-slate-50"
      >
        <h4 className="font-semibold text-slate-900"> {t("🔧 Maintenance Help")} </h4>

        <p className="mt-1 text-sm text-slate-600"> {t("Find reliable maintenance knowledge from successful job cards.")} </p>
      </button>

      <button
        onClick={() => setHelpMode('spare_part')}
        className="rounded-xl bg-white p-5 text-left shadow-sm hover:bg-slate-50"
      >
        <h4 className="font-semibold text-slate-900"> {t("🔩 Spare-Part Help")} </h4>

        <p className="mt-1 text-sm text-slate-600"> {t("Search for spare parts stored by other technicians.")} </p>
      </button>
    </div>
  )}
</div>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900"> {t("My Job Cards")} </h3>
              <p className="mt-1 text-sm text-slate-500"> {t("Review your maintenance records and confirm completed work.")} </p>
            </div>

            <button
              onClick={async () => {
                try {
                  setJobCardsLoading(true)
                  setJobCardsError('')
                  setMyJobCards(await getMyJobCards())
                } catch (error) {
                  setJobCardsError(error.message || 'Unable to load your job cards.')
                } finally {
                  setJobCardsLoading(false)
                }
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            > {t("Refresh")} </button>
          </div>

          {jobCardsLoading && (
            <p className="text-sm text-slate-500">{t("Loading your job cards...")}</p>
          )}

          {jobCardsError && (
            <p className="text-sm text-red-600">{t(jobCardsError)}</p>
          )}

          {!jobCardsLoading && !jobCardsError && myJobCards.length === 0 && (
            <p className="text-sm text-slate-500"> {t("You have not saved any job cards yet.")} </p>
          )}

          <div className="grid gap-4">
            {myJobCards.map((card) => (
              <article
                key={card.job_card_id}
                className="rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900"> {t("Job Card #")}{card.job_card_id}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600"> {t("Equipment ID:")} {card.equipment_id} · {t(card.maintenance_type)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {t(card.status)}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-700">
                  {card.fault_description}
                </p>

                <p className="mt-2 text-sm text-slate-600"> {t("Outcome:")} {card.successful ? t('Maintenance successful') : t('Pending confirmation')}
                </p>

                {card.photo_data && (
                  <img
                    src={card.photo_data}
                    alt={t("Job card")}
                    className="mt-4 max-h-48 rounded-lg border border-slate-200 object-contain"
                  />
                )}

                <div className="mt-4 flex flex-col items-start gap-3">
                  <button
                    onClick={() => downloadJobCardPdf(card)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  > {t("Download PDF")} </button>

                  <button
                      onClick={async () => {
                        const warning = card.status === 'validated'
                          ? 'Delete this validated job card and remove its trusted Simeon knowledge?'
                          : 'Delete this job card?'

                        if (!window.confirm(t(warning))) {
                          return
                        }

                        try {
                          setDeletingJobCardId(card.job_card_id)
                          setJobCardsError('')
                          await deleteJobCard(card.job_card_id)
                          setMyJobCards(await getMyJobCards())
                        } catch (error) {
                          setJobCardsError(
                            error.message || 'Unable to delete the job card.'
                          )
                        } finally {
                          setDeletingJobCardId(null)
                        }
                      }}
                      disabled={deletingJobCardId === card.job_card_id}
                      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingJobCardId === card.job_card_id
                        ? t('Deleting...')
                        : t('Delete')}
                  </button>
                </div>

                {card.status === 'submitted' && !card.successful && (
                  <button
                    onClick={async () => {
                      try {
                        setConfirmingJobCardId(card.job_card_id)
                        await updateJobCard(card.job_card_id, {
                          equipment_id: card.equipment_id,
                          maintenance_type: card.maintenance_type,
                          fault_description: card.fault_description,
                          symptoms: card.symptoms,
                          diagnosis: card.diagnosis,
                          actions_taken: card.actions_taken,
                          parts_used: card.parts_used,
                          result: card.result,
                          successful: true,
                        })
                        await validateJobCard(card.job_card_id)
                        setMyJobCards(await getMyJobCards())
                      } catch (error) {
                        setJobCardsError(
                          error.message || 'Unable to confirm maintenance.'
                        )
                      } finally {
                        setConfirmingJobCardId(null)
                      }
                    }}
                    disabled={confirmingJobCardId === card.job_card_id}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {confirmingJobCardId === card.job_card_id
                      ? t('Confirming...')
                      : t('Confirm Maintenance Successful')}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900"> {t("My Spare Parts")} </h3>
              <p className="mt-1 text-sm text-slate-500"> {t("View the spare parts you have stored.")} </p>
            </div>

            <button
              onClick={async () => {
                try {
                  setMySparePartsLoading(true)
                  setMySparePartsError('')
                  setMySpareParts(await getMySpareParts())
                } catch (error) {
                  setMySparePartsError(
                    error.message || 'Unable to load your spare parts.'
                  )
                } finally {
                  setMySparePartsLoading(false)
                }
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            > {t("Refresh")} </button>
          </div>

          {mySparePartsLoading && (
            <p className="text-sm text-slate-500">{t("Loading your spare parts...")}</p>
          )}

          {mySparePartsError && (
            <p className="text-sm text-red-600">{t(mySparePartsError)}</p>
          )}

          {!mySparePartsLoading && !mySparePartsError && mySpareParts.length === 0 && (
            <p className="text-sm text-slate-500"> {t("You have not stored any spare parts yet.")} </p>
          )}

          <div className="grid gap-4">
            {mySpareParts.map((part) => (
              <article
                key={part.spare_part_id}
                className="rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {part.part_name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600"> {t("Part number:")} {part.part_number || t('Not provided')}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {t(part.availability_status)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700"> {t("Notifications:")} {part.notification_count || 0}
                </p>

                {part.photo_data && (
                  <img
                    src={part.photo_data}
                    alt={t("Spare part")}
                    className="mt-4 max-h-48 rounded-lg border border-slate-200 object-contain"
                  />
                )}

                <button
                  onClick={async () => {
                    if (!window.confirm(t('Delete this spare part? Existing requests for it will also be removed.'))) {
                      return
                    }

                    try {
                      setDeletingSparePartId(part.spare_part_id)
                      setMySparePartsError('')
                      await deleteSparePart(part.spare_part_id)
                      setMySpareParts(await getMySpareParts())
                    } catch (error) {
                      setMySparePartsError(
                        error.message || 'Unable to delete the spare part.'
                      )
                    } finally {
                      setDeletingSparePartId(null)
                    }
                  }}
                  disabled={deletingSparePartId === part.spare_part_id}
                  className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingSparePartId === part.spare_part_id
                    ? t('Deleting...')
                    : t('Delete')}
                </button>

                <dl className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div>
                    <dt className="font-medium">{t("Manufacturer")}</dt>
                    <dd>{part.manufacturer || t('Not provided')}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t("Compatible equipment")}</dt>
                    <dd>{part.compatibility || t('Not provided')}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t("Specifications")}</dt>
                    <dd>{part.specifications || t('Not provided')}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t("Description")}</dt>
                    <dd>{part.description || t('Not provided')}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {/* Digital Job Card form */}
        {showJobCardForm && (
          <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900"> {t("Digital Job Card")} </h3>

                <p className="mt-1 text-sm text-slate-500"> {t("Record what happened, what you found, and how the problem was resolved.")} </p>
              </div>

              <button
                onClick={() => setShowJobCardForm(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* Equipment */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Equipment")} </label>

                <input
                  type="text"
                  placeholder={t("Example: Humacount 30TS")}
                  value={jobCard.equipment}
                  onChange={(e) =>
                     setJobCard({ ...jobCard, equipment: e.target.value })
               }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Manufacturer */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Manufacturer")} </label>

                <input
                  type="text"
                  placeholder={t("Example: HUMAN")}
                  value={jobCard.manufacturer}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, manufacturer: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Model")} </label>

                <input
                  type="text"
                  placeholder={t("Equipment model")}
                  value={jobCard.model}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, model: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Problem */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Problem Description")} </label>

                <input
                  type="text"
                  placeholder={t("Describe the reported problem")}
                  value={jobCard.problem_description}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, problem_description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Symptoms */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Symptoms / Error")} </label>

                <textarea
                  rows="3"
                  placeholder={t("What symptoms or error messages were observed?")}
                  value={jobCard.symptoms}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, symptoms: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Diagnosis */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Diagnosis")} </label>

                <textarea
                  rows="3"
                  placeholder={t("What was found to be causing the problem?")}
                  value={jobCard.diagnosis}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, diagnosis: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Solution */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Solution / Repair Performed")} </label>

                <textarea
                  rows="3"
                  placeholder={t("Describe the repair or maintenance performed")}
                  value={jobCard.solution}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, solution: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              {/* Parts */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Parts Used")} </label>

                <input
                  type="text"
                  placeholder={t("Example: Sample probe tubing")}
                  value={jobCard.parts_used}
                  onChange={(e) =>
                    setJobCard({ ...jobCard, parts_used: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Job card photo (optional)")} </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    try {
                      setJobCard({
                        ...jobCard,
                        photo_data: await readImageAsDataUrl(e.target.files[0]),
                      })
                      setSaveMessage('')
                    } catch (error) {
                      setSaveMessage(error.message)
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
                {jobCard.photo_data && (
                  <img
                    src={jobCard.photo_data}
                    alt={t("Job card preview")}
                    className="mt-3 max-h-48 rounded-lg border border-slate-200 object-contain"
                  />
                )}
              </div>

            </div>

            {/* Confirmation */}
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={jobCardSuccessful}
                  onChange={(e) => setJobCardSuccessful(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span> {t("I confirm the maintenance was completed successfully. This will validate the job card and add it to Simeon's trusted technical knowledge.")} </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setShowJobCardForm(false)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
              > {t("Cancel")} </button>

              <button
  onClick={async () => {
    try {
      setSavingJobCard(true)
      setSaveMessage('')

      if (!jobCard.equipment.trim() || !jobCard.manufacturer.trim() || !jobCard.model.trim()) {
        throw new Error('Equipment, manufacturer, and model are required.')
      }

      const equipment = await createEquipment({
        category: jobCard.equipment,
        manufacturer: jobCard.manufacturer,
        model: jobCard.model,
        description: jobCard.problem_description,
      })

      const savedJobCard = await createJobCard({
        equipment_id: equipment.equipment_id,
        maintenance_type: 'corrective',
        fault_description: jobCard.problem_description,
        symptoms: jobCard.symptoms,
        diagnosis: jobCard.diagnosis,
        actions_taken: jobCard.solution,
        parts_used: jobCard.parts_used,
        result: jobCard.solution,
        successful: jobCardSuccessful,
      })

      if (jobCardSuccessful) {
        await validateJobCard(savedJobCard.job_card_id)
        setSaveMessage('Job card validated and added to Simeon knowledge.')
      } else {
        setSaveMessage('Job card saved. Confirm success to add it to Simeon knowledge.')
      }

      setJobCard({
        equipment: '',
        manufacturer: '',
        model: '',
        problem_description: '',
        symptoms: '',
        diagnosis: '',
        solution: '',
        parts_used: '',
        photo_data: null,
      })
      setJobCardSuccessful(false)
    } catch (error) {
      setSaveMessage(error.message || 'Unable to save the job card.')
      console.error(error)
    } finally {
      setSavingJobCard(false)
    }
  }}
  disabled={savingJobCard}
  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
>
  {savingJobCard ? t('Saving...') : t('Save Job Card')}
</button>

{saveMessage && (
  <p className="mt-4 text-sm text-slate-600">
    {t(saveMessage)}
  </p>
)}

            </div>
          </div>
        )}


{/* Spare Part form */}
{showSparePartForm && (
  <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">

    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-bold text-slate-900"> {t("Spare Part")} </h3>

        <p className="mt-1 text-sm text-slate-500"> {t("Store technical information about an available spare part.")} </p>
      </div>

      <button
        onClick={() => setShowSparePartForm(false)}
        className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
      >
        ✕
      </button>
    </div>

    <div className="grid gap-5 md:grid-cols-2">

      {/* Part name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Part Name")} </label>

        <input
          type="text"
          placeholder={t("Example: Sample probe")}
          value={sparePart.part_name}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              part_name: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      {/* Part number */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Part Number")} </label>

        <input
          type="text"
          placeholder={t("Example: PN-12345")}
          value={sparePart.part_number}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              part_number: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      {/* Manufacturer */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Manufacturer")} </label>

        <input
          type="text"
          placeholder={t("Example: HUMAN")}
          value={sparePart.manufacturer}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              manufacturer: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      {/* Compatible equipment */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Compatible Equipment")} </label>

        <input
          type="text"
          placeholder={t("Example: Humacount 30TS")}
          value={sparePart.compatible_equipment}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              compatible_equipment: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      {/* Specifications */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Availability")} </label>

        <select
          value={sparePart.availability_status}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              availability_status: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
        >
          <option value="available">{t("Available")}</option>
          <option value="limited">{t("Limited")}</option>
          <option value="unavailable">{t("Unavailable")}</option>
          <option value="unknown">{t("Unknown")}</option>
        </select>
      </div>

      {/* Specifications */}
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Specifications")} </label>

        <textarea
          rows="3"
          placeholder={t("Enter technical specifications")}
          value={sparePart.specifications}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              specifications: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Description")} </label>

        <textarea
          rows="3"
          placeholder={t("Describe the spare part and any compatibility information")}
          value={sparePart.description}
          onChange={(e) =>
            setSparePart({
              ...sparePart,
              description: e.target.value,
            })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700"> {t("Spare-part photo (optional)")} </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            try {
              setSparePart({
                ...sparePart,
                photo_data: await readImageAsDataUrl(e.target.files[0]),
              })
              setSparePartMessage('')
            } catch (error) {
              setSparePartMessage(error.message)
            }
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
        />
        {sparePart.photo_data && (
          <img
            src={sparePart.photo_data}
            alt={t("Spare-part preview")}
            className="mt-3 max-h-48 rounded-lg border border-slate-200 object-contain"
          />
        )}
      </div>

    </div>

    <div className="mt-6 flex justify-end gap-3">

      <button
        onClick={() => setShowSparePartForm(false)}
        className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
      > {t("Cancel")} </button>

      <button
  onClick={async () => {
    try {
      setSavingSparePart(true)
      setSparePartMessage('')

      await createSparePart(sparePart)

      setSparePartMessage('Spare part saved successfully.')

      setSparePart({
        part_name: '',
        part_number: '',
        manufacturer: '',
        compatible_equipment: '',
        availability_status: 'available',
        specifications: '',
        description: '',
        photo_data: null,
      })
    } catch (error) {
      setSparePartMessage(error.message || 'Unable to save the spare part.')
      console.error(error)
    } finally {
      setSavingSparePart(false)
    }
  }}
  disabled={savingSparePart}
  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
>
  {savingSparePart ? t('Saving...') : t('Save Spare Part')}
</button>

{sparePartMessage && (
  <p className="mt-4 text-sm text-slate-600">
    {t(sparePartMessage)}
  </p>
)}

    </div>

  </div>
)}


        {/* Chat area */}
    {/* Help area */}
{helpMode === 'maintenance' && (
  <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-slate-900"> {t("🔧 Maintenance Help")} </h3>

      <p className="mt-1 text-sm text-slate-500"> {t("Ask Simeon about a equipment problem.")} </p>
    </div>

    <textarea
  rows="4"
  value={chatQuestion}
  onChange={(e) => setChatQuestion(e.target.value)}
  placeholder={t("Example: Humacount 30TS is giving a high blank error. What should I check?")}
  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
/>

    <div className="mt-4 flex justify-end">
      <button
  onClick={async () => {
    if (!chatQuestion.trim()) {
      return
    }

    try {
      setChatLoading(true)
      setChatAnswer('')

      let sessionId = chatSessionId

     if (!sessionId) {
  const session = await createChatSession()
  sessionId = session.session_id
  setChatSessionId(sessionId)
}

      const result = await sendChatMessage(
        sessionId,
        chatQuestion
      )

      setChatAnswer(result.answer)
    } catch (error) {
      console.error(error)
      setChatAnswer(
        'Simeon could not process the request right now.'
      )
    } finally {
      setChatLoading(false)
    }
  }}
  disabled={chatLoading}
  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
>
  {chatLoading ? t('Thinking...') : t('Ask Simeon')}
</button>

{chatAnswer && (
  <div className="mt-6 rounded-xl bg-slate-50 p-5">
    <h4 className="font-semibold text-slate-900">
      Simeon
    </h4>

    <p className="mt-2 whitespace-pre-wrap text-slate-700">
      {chatAnswer}
    </p>
  </div>
)}

    </div>
  </div>
)}

{helpMode === 'spare_part' && (
  <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-slate-900"> {t("🔩 Spare-Part Help")} </h3>

      <p className="mt-1 text-sm text-slate-500"> {t("Search for a spare part stored by another technician.")} </p>
    </div>

    <div className="flex gap-3">
      <input
        type="text"
        value={sparePartSearch}
        onChange={(e) => setSparePartSearch(e.target.value)}
        placeholder={t("Example: Humacount 30TS sample probe")}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
      />

      <button
        onClick={async () => {
          try {
            setSparePartSearchLoading(true)
            setSparePartSearchError('')
            setSparePartResults(await searchSpareParts(sparePartSearch))
          } catch (error) {
            setSparePartSearchError(
              error.message || 'Unable to search spare parts.'
            )
          } finally {
            setSparePartSearchLoading(false)
          }
        }}
        disabled={sparePartSearchLoading}
        className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {sparePartSearchLoading ? t('Searching...') : t('Search')}
      </button>
    </div>

    {sparePartSearchError && (
      <p className="mt-4 text-sm text-red-600">{t(sparePartSearchError)}</p>
    )}

    <div className="mt-6 grid gap-4">
      {sparePartResults.map((part) => (
        <article
          key={part.spare_part_id}
          className="rounded-xl border border-slate-200 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-900">
                {part.part_name}
              </h4>
              <p className="mt-1 text-sm text-slate-600"> {t("Part number:")} {part.part_number || t('Not provided')}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {t(part.availability_status)}
            </span>
          </div>

          <dl className="mt-4 grid gap-2 text-sm text-slate-700">
            <div>
              <dt className="font-medium">{t("Manufacturer")}</dt>
              <dd>{part.manufacturer || t('Not provided')}</dd>
            </div>
            <div>
              <dt className="font-medium">{t("Compatible equipment")}</dt>
              <dd>{part.compatibility || t('Not provided')}</dd>
            </div>
            <div>
              <dt className="font-medium">{t("Specifications")}</dt>
              <dd>{part.specifications || t('Not provided')}</dd>
            </div>
            <div>
              <dt className="font-medium">{t("Description")}</dt>
              <dd>{part.description || t('Not provided')}</dd>
            </div>
          </dl>

          {part.availability_status !== 'unavailable' && (
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={sparePartRequestNotes[part.spare_part_id] || ''}
                onChange={(e) =>
                  setSparePartRequestNotes({
                    ...sparePartRequestNotes,
                    [part.spare_part_id]: e.target.value,
                  })
                }
                placeholder={t("Optional request note")}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
              />
              <button
                onClick={async () => {
                  try {
                    setRequestingSparePartId(part.spare_part_id)
                    setSparePartSearchError('')
                    await requestSparePart(
                      part.spare_part_id,
                      sparePartRequestNotes[part.spare_part_id] || ''
                    )
                    setSparePartRequests(await getMySparePartRequests())
                  } catch (error) {
                    setSparePartSearchError(
                      error.message || 'Unable to request spare part.'
                    )
                  } finally {
                    setRequestingSparePartId(null)
                  }
                }}
                disabled={requestingSparePartId === part.spare_part_id}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {requestingSparePartId === part.spare_part_id
                  ? t('Requesting...')
                  : t('Request part')}
              </button>
            </div>
          )}
        </article>
      ))}
    </div>

    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="flex items-center justify-between gap-4">
        <h4 className="font-semibold text-slate-900">{t("My requests")}</h4>
        <button
          onClick={async () => {
            try {
              setSparePartRequestsLoading(true)
              setSparePartRequestsError('')
              setSparePartRequests(await getMySparePartRequests())
            } catch (error) {
              setSparePartRequestsError(
                error.message || 'Unable to load spare-part requests.'
              )
            } finally {
              setSparePartRequestsLoading(false)
            }
          }}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        > {t("Refresh")} </button>
      </div>

      {sparePartRequestsError && (
        <p className="mt-3 text-sm text-red-600">{t(sparePartRequestsError)}</p>
      )}

      {sparePartRequestsLoading && (
        <p className="mt-3 text-sm text-slate-500">{t("Loading requests...")}</p>
      )}

      {!sparePartRequestsLoading && sparePartRequests.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">{t("No spare-part requests yet.")}</p>
      )}

      <div className="mt-3 grid gap-3">
        {sparePartRequests.map((request) => (
          <div
            key={request.request_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">
                {request.part_name} {request.part_number ? `(${request.part_number})` : ''}
              </p>
              <p className="mt-1 text-slate-600"> {t("Request #")}{request.request_id}
              </p>
              <dl className="mt-3 grid gap-1 text-slate-600">
                <div>{t("Availability:")} {t(request.availability_status) || t('Not provided')}</div>
                <div>{t("Manufacturer:")} {request.manufacturer || t('Not provided')}</div>
                <div>{t("Compatible equipment:")} {request.compatibility || t('Not provided')}</div>
                <div>{t("Specifications:")} {request.specifications || t('Not provided')}</div>
                <div>{t("Description:")} {request.description || t('Not provided')}</div>
              </dl>
            </div>
            <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
              {t(request.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

      </main>
    </div>
  )
}

export default App
