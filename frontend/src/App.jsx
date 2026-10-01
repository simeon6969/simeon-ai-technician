import BrandMark from './BrandMark'
import { useBranding, brandCopy } from './branding'
import BrandName from './BrandName'
import DashboardLayout, { DashboardOverview } from './DashboardLayout'
import MedicalStoreDashboard from './MedicalStoreDashboard'
import InventorySimeon from './InventorySimeon'
import MySubscription, { SubscriptionSetup } from './MySubscription'
import { SubscriptionChoices } from './Subscriptions'
import AccountRecovery from './AccountRecovery'
import FastDelivery from './FastDelivery'
import { Spinner } from './LoadingStatus'
import AccountChoices from './AccountChoices'
import AccountSetup from './AccountSetup'
import RoleWorkspace from './RoleWorkspace'
import ItemMarket from './ItemMarket'
import { cacheProfile, cachedProfile } from './offlineStore'
import { syncQueue } from './offlineSync'
import OfflineStatus from './OfflineStatus'
import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'
import SparePartPrice from './SparePartPrice'
import AdminConsole from './AdminConsole'
import StoreConversation from './StoreConversation'
import SparePartPosts, { PostSparePartButton } from './SparePartPosts'
import SaleItems from './SaleItems'
import HomePage from './HomePage'
import { homeCopy } from './homeCopy'
import { useEffect, useState } from 'react'
import {
  accountRequest,
  validateJobCard,
  getMyJobCards,
  updateJobCard,
  deleteJobCard,
  searchSpareParts,
  requestSparePart,
  getMySparePartRequests,
  getMySpareParts,
  deleteSparePart,
  createChatSession,
  sendChatMessage,
  loginUser,
  registerUser,
  getMyProfile,
} from './api'
import { jsPDF } from 'jspdf'

async function downloadJobCardPdf(card, appBranding) {
  const branding = await accountRequest('/users/me/branding')
  const pdf = new jsPDF()
  let headingY = 20
  if (branding.image_data) {
    const properties = pdf.getImageProperties(branding.image_data)
    const scale = Math.min(40 / properties.width, 30 / properties.height)
    const width = properties.width * scale, height = properties.height * scale
    pdf.addImage(branding.image_data, 'PNG', 20, 14, width, height)
    headingY = 14 + height + 10
  }
  const rows = [
    ['Job Card', `#${card.job_card_id}`],
    ['Submitted by', card.submitter_name],
    ['Equipment ID', card.equipment_id],
    ['Maintenance type', card.maintenance_type],
    ['Status', card.status],
    ['Outcome', card.successful ? 'Maintenance successful' : 'Pending confirmation'],
    ['Fault description', card.fault_description],
    ['Symptoms', card.symptoms],
    ['Diagnosis', card.diagnosis],
    ['Actions taken', card.actions_taken],
    ['Parts used', card.parts_used],
    ['Result', card.result],
  ]

  pdf.setFontSize(16)
  const heading = pdf.splitTextToSize(card.account_name || `${appBranding.name} Job Card`, 170)
  pdf.text(heading, 20, headingY)
  let y = headingY + 6 + heading.length * 7
  const bottom = 277, labelWidth = 48, valueWidth = 122, lineHeight = 5

  function tableHeader() {
    pdf.setFillColor(15, 118, 110)
    pdf.rect(20, y, 170, 10, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('Field', 23, y + 6.5)
    pdf.text('Details', 71, y + 6.5)
    pdf.setTextColor(30, 41, 59)
    y += 10
  }
  function nextPage() {
    pdf.addPage()
    y = 20
    tableHeader()
  }
  tableHeader()
  rows.forEach(([label, value], index) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    const lines = pdf.splitTextToSize(String(value ?? '').trim() || 'Not recorded', valueWidth - 6)
    let offset = 0
    while (offset < lines.length) {
      if (bottom - y < 16) nextPage()
      const count = Math.min(lines.length - offset, Math.floor((bottom - y - 6) / lineHeight))
      const height = Math.max(12, count * lineHeight + 6)
      pdf.setDrawColor(203, 213, 225)
      pdf.setLineWidth(0.2)
      pdf.setFillColor(...(index % 2 ? [248, 250, 252] : [255, 255, 255]))
      pdf.rect(20, y, 170, height, 'FD')
      pdf.line(20 + labelWidth, y, 20 + labelWidth, y + height)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text(offset ? `${label} (cont.)` : label, 23, y + 6)
      pdf.setFont('helvetica', 'normal')
      pdf.text(lines.slice(offset, offset + count), 71, y + 6, { lineHeightFactor: lineHeight / (10 * 25.4 / 72) })
      y += height
      offset += count
    }
  })

  if (card.photo_data) {
    const properties = pdf.getImageProperties(card.photo_data)
    const scale = Math.min(170 / properties.width, 90 / properties.height)
    const width = properties.width * scale, height = properties.height * scale
    if (y + height + 20 > bottom) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont('helvetica', 'bold')
    pdf.text('Equipment photo', 20, y + 8)
    pdf.addImage(card.photo_data, properties.fileType, 20, y + 12, width, height)
  }
  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`${appBranding.name} | Job Card #${card.job_card_id}`, 20, 289)
    pdf.text(`${page} / ${pageCount}`, 190, 289, { align: 'right' })
  }

  const fileBrand = appBranding.name.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'app'
  pdf.save(`${fileBrand}-job-card-${card.job_card_id}.pdf`)
}


function App() {
  const { t, language } = useLanguage()
  const appBranding = useBranding()
  const homeText = brandCopy(homeCopy[language] || homeCopy.en, appBranding.name)
  const [page, setPage] = useState(() => ['#login', '#app'].includes(window.location.hash) ? window.location.hash.slice(1) : 'home')
  useEffect(() => {
    const change = () => setPage(['#login', '#app'].includes(window.location.hash) ? window.location.hash.slice(1) : 'home')
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  function navigate(next) {
    setPage(next)
    window.location.hash = next
    window.scrollTo(0, 0)
  }

 const [loggedIn, setLoggedIn] = useState(
  () => Boolean(localStorage.getItem('access_token'))
)
const [userRole, setUserRole] = useState(
  () => localStorage.getItem('user_role') || 'technician'
)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)
const [fullName, setFullName] = useState('')
const [phone, setPhone] = useState('')
const [isRegistering, setIsRegistering] = useState(false)
const [accountType, setAccountType] = useState('')
const [accountField, setAccountField] = useState('')
const [subscription, setSubscription] = useState(null)
const [profile, setProfile] = useState(cachedProfile)
const [profileError, setProfileError] = useState('')
const [loginError, setLoginError] = useState('')
const [authMessage, setAuthMessage] = useState('')

  const [dashboardSection, setDashboardSection] = useState('overview')
  const [storeConversation, setStoreConversation] = useState(null)
const [helpMode, setHelpMode] = useState(null)

const [myJobCards, setMyJobCards] = useState([])
const [jobCardsLoading, setJobCardsLoading] = useState(false)
const [jobCardsError, setJobCardsError] = useState('')
const [confirmingJobCardId, setConfirmingJobCardId] = useState(null)
const [deletingJobCardId, setDeletingJobCardId] = useState(null)

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
const [authBusy, setAuthBusy] = useState(false)

useEffect(() => {
  if (!loggedIn) return
  let active = true
  getMyProfile().then((account) => {
    if (!active) return
    cacheProfile(account)
    setProfile(account)
    setUserRole(account.role)
    localStorage.setItem('user_role', account.role)
    setProfileError('')
  }).catch((error) => {
    if (!active) return
    const savedAccount = cachedProfile()
    if (![401, 403].includes(error.status) && savedAccount) { setProfile(savedAccount); setProfileError('') }
    else { setProfile(null); setProfileError('Unable to load account. Please log in again.') }
  })
  return () => { active = false }
}, [loggedIn])

useEffect(() => {
  if (!loggedIn || ['admin', 'store', 'client'].includes(userRole)) {
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
  if (!loggedIn || ['admin', 'client'].includes(userRole)) {
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

useEffect(() => {
  if (!loggedIn || !profile || profileError || ['admin', 'client'].includes(profile.role)) return
  const id = profile.user_id
  const sync = () => { syncQueue(id).catch(() => {}) }
  const refresh = event => {
    if (event.detail.userId !== String(id) || localStorage.getItem('user_id') !== String(id)) return
    if (profile.role !== 'store') getMyJobCards().then(rows => { setMyJobCards(rows); setJobCardsError('') }).catch(() => {})
    getMySpareParts().then(rows => { setMySpareParts(rows); setMySparePartsError('') }).catch(() => {})
  }
  sync()
  const timer = setInterval(sync, 30000)
  window.addEventListener('online', sync)
  window.addEventListener('focus', sync)
  window.addEventListener('simeon-synced', refresh)
  return () => { clearInterval(timer); window.removeEventListener('online', sync); window.removeEventListener('focus', sync); window.removeEventListener('simeon-synced', refresh) }
}, [loggedIn, profile, profileError])

function handleLogout() {
  setDashboardSection('overview')
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_role')
  setLoggedIn(false)
  setStoreConversation(null)
  setProfile(null)
  setProfileError('')
  navigate('home')
  setUserRole('technician')
  setChatSessionId(null)
  setChatQuestion('')
  setChatAnswer('')
  setMyJobCards([])
  setSparePartResults([])
  setSparePartRequests([])
  setMySpareParts([])
}

if (page === 'home') {
  return <HomePage loggedIn={loggedIn} onEnter={() => { setIsRegistering(false); navigate(loggedIn ? 'app' : 'login') }} onRegister={() => { setIsRegistering(true); navigate('login') }} />
}

if (!loggedIn) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <button onClick={() => navigate('home')} className="mb-5 text-sm font-medium text-teal-700">← {homeText.home}</button>
        <div className="mb-6 flex justify-end"><LanguageSwitcher /></div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-14 w-14"><BrandMark /></div>
          <h1 className="text-3xl font-bold text-slate-900">
            <BrandName />
          </h1>

          <p className="mt-2 text-sm text-slate-500"> {t("Intelligence Recovery program")} </p>
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          {authBusy && <Spinner />}{isRegistering ? t('Create account') : t('Login')}
        </h2>

        {isRegistering && (
          <div className="mt-6">
            <SubscriptionChoices value={subscription} onChange={setSubscription} /><AccountChoices field={accountField} role={accountType} onField={setAccountField} onRole={setAccountType} />
            <label htmlFor="account-name" className="mb-2 block text-sm font-medium text-slate-700">{t(accountType === 'store' ? 'Store name' : 'Full name')}</label>

            <input
              id="account-name"
              maxLength={150}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t(accountType === 'store' ? 'Enter store name' : 'Enter your full name')}
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
          <label htmlFor="auth-password" className="mb-2 block text-sm font-medium text-slate-700"> {t("Password")} </label>

          <div className="relative">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Enter your password")}
            className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-14 outline-none focus:border-slate-500"
          />
          <button type="button" aria-label={t(showPassword ? 'Hide password' : 'Show password')}
            title={t(showPassword ? 'Hide password' : 'Show password')} aria-controls="auth-password"
            onClick={() => setShowPassword(value => !value)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-600 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="m3 3 18 18" />}
            </svg>
          </button>
          </div>
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
            if (authBusy) return
            setAuthBusy(true)
            try {
              setLoginError('')
              setAuthMessage('')

              if (isRegistering) {
                if (!fullName.trim() || !email.trim() || !password) {
                  setLoginError('Full name, email, and password are required.')
                  return
                }

                if (!accountField || !accountType) throw new Error('Choose your field and role')
                if (!subscription?.accepted_terms) throw new Error('Review and accept the yearly subscription terms')
                await registerUser(fullName, email, phone, password, accountType, accountField, subscription)
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
              cacheProfile(result)
              setProfile(result)
              setProfileError('')

              setLoggedIn(true)
              navigate('app')

            } catch (error) {
              setLoginError(error.message)
            } finally { setAuthBusy(false) }
          }}
          disabled={authBusy}
          aria-busy={authBusy}
          className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
        >
          {authBusy && <Spinner />}{isRegistering ? t('Create account') : t('Login')}
        </button>

        {!isRegistering && <AccountRecovery />}
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

if (!profile || profileError) {
  return <div className="min-h-screen bg-slate-100 p-8"><p role="status">{!profileError && <Spinner />}{t(profileError || 'Loading account...')}</p><button onClick={handleLogout} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">{t('Logout')}</button></div>
}

if (loggedIn && userRole === 'admin') {
  return <AdminConsole account={profile} onLogout={handleLogout} onHome={() => navigate('home')} />
}

if (!profile.account_field) {
  return <AccountSetup account={profile} onLogout={handleLogout} onDone={account => {
    cacheProfile(account); setProfile(account); setUserRole(account.role)
    localStorage.setItem('user_role', account.role)
    setStoreConversation(null)
  }} />
}
if (!profile.subscription) {
  return <SubscriptionSetup onLogout={handleLogout} onDone={subscription => {
    const updated = { ...profile, subscription }; cacheProfile(updated); setProfile(updated)
  }} />
}
if (profile.role === 'store' && profile.account_field === 'medical') {
  return <MedicalStoreDashboard key={profile.user_id} account={profile} onHome={() => navigate('home')} onLogout={handleLogout} />
}
if (['store', 'client'].includes(profile.role)) {
  return <RoleWorkspace key={profile.user_id} account={profile} onHome={() => navigate('home')} onLogout={handleLogout} />
}

if (storeConversation) {
  return <><OfflineStatus account={profile} /><StoreConversation
    key={`${profile.user_id}:${storeConversation}`}
    kind={storeConversation}
    account={profile}
    onClose={() => { setDashboardSection(storeConversation === 'job' ? 'jobs' : 'parts'); setStoreConversation(null) }}
    onSaved={async (kind) => {
      try {
        if (kind === 'job') setMyJobCards(await getMyJobCards())
        else setMySpareParts(await getMySpareParts())
      } catch (error) {
        if (kind === 'job') setJobCardsError(error.message)
        else setMySparePartsError(error.message)
      }
    }}
  /></>
}


  return (
    <DashboardLayout account={profile} sections={[
      ['overview', 'Overview'], ['assistant', 'Ask S'], ['jobs', 'My Job Cards'], ['parts', 'My Spare Parts'], ['items', 'Items for sale'], ['help', 'Maintenance & spare-part help'], ['requests', 'Requests & marketplace'], ['account', 'My account'],
    ]} section={dashboardSection} onNavigate={setDashboardSection} onHome={() => navigate('home')} onLogout={handleLogout}>
      {dashboardSection === 'overview' && <DashboardOverview actions={[
        { label: 'Digital Job Card', description: 'Record maintenance work with S.', onClick: () => setStoreConversation('job') },
        { label: 'Store Spare Part', description: 'Save a spare part and its asking price.', onClick: () => setStoreConversation('part') },
        { label: 'Ask S', description: 'Find available products and inventory information.', onClick: () => setDashboardSection('assistant') },
        { label: 'Maintenance Help', description: 'Find maintenance knowledge from successful job cards.', onClick: () => { setHelpMode('maintenance'); setDashboardSection('help') } },
        { label: 'Items for sale', description: 'Manage equipment and posted items.', onClick: () => setDashboardSection('items') },
        { label: 'Requests & marketplace', description: 'Browse products and follow requests.', onClick: () => setDashboardSection('requests') },
      ]}><MySubscription subscription={profile.subscription} /><OfflineStatus account={profile} /></DashboardOverview>}
      {dashboardSection === 'assistant' && <InventorySimeon account={profile} />}
      {dashboardSection === 'jobs' && <><button className="rounded-xl bg-teal-700 px-5 py-3 text-white" onClick={() => setStoreConversation('job')}>{t('Digital Job Card')}</button>
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
            <p className="text-sm text-slate-500"><Spinner />{t("Loading your job cards...")}</p>
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
                  <p className="text-sm text-slate-600">{t('Submitter name')}: {card.submitter_name || t('Not recorded')}</p>
                  <button
                    onClick={() => downloadJobCardPdf(card, appBranding).catch((error) => {
                      setJobCardsError(error.message || 'Unable to export PDF')
                    })}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  > {t("Download PDF")} </button>

                  <button
                      onClick={async () => {
                        const warning = card.status === 'validated'
                          ? 'Delete this validated job card and remove its trusted S knowledge?'
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
                        ? <><Spinner />{t('Deleting...')}</>
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
                      ? <><Spinner />{t('Confirming...')}</>
                      : t('Confirm Maintenance Successful')}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

      </>}
      {dashboardSection === 'parts' && <><button className="rounded-xl bg-teal-700 px-5 py-3 text-white" onClick={() => setStoreConversation('part')}>{t('Store Spare Part')}</button>
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

          <div className="mb-6"><SparePartPosts /></div>
          {mySparePartsLoading && (
            <p className="text-sm text-slate-500"><Spinner />{t("Loading your spare parts...")}</p>
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
                <PostSparePartButton part={part} onPosted={(posted) => setMySpareParts((parts) => parts.map((item) => item.spare_part_id === posted.spare_part_id ? { ...item, posted_at: posted.posted_at } : item))} />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {part.part_name}
                    </h4>
              <SparePartPrice part={part} /><FastDelivery name={part.part_name} />
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
                    ? <><Spinner />{t('Deleting...')}</>
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
      </>}
      {dashboardSection === 'items' && <SaleItems />}
      {dashboardSection === 'account' && <><MySubscription subscription={profile.subscription} /><AccountRecovery setup /><OfflineStatus account={profile} /></>}
      {dashboardSection === 'requests' && <ItemMarket />}
      {dashboardSection === 'help' && <div className="mb-5 flex flex-wrap gap-3"><button onClick={() => setHelpMode('maintenance')} className="rounded-xl bg-teal-700 px-5 py-3 text-white">{t('Maintenance Help')}</button><button onClick={() => setHelpMode('spare_part')} className="rounded-xl border bg-white px-5 py-3">{t('Spare-Part Help')}</button></div>}
        {/* Chat area */}
    {/* Help area */}
{dashboardSection === 'help' && helpMode === 'maintenance' && (
  <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-slate-900"> {t("🔧 Maintenance Help")} </h3>

      <p className="mt-1 text-sm text-slate-500"> {t("Ask S about a equipment problem.")} </p>
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
        'S could not process the request right now.'
      )
    } finally {
      setChatLoading(false)
    }
  }}
  disabled={chatLoading}
  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
>
  {chatLoading && <Spinner />}{chatLoading ? t('Thinking...') : t('Ask S')}
</button>

{chatAnswer && (
  <div className="mt-6 rounded-xl bg-slate-50 p-5">
    <h4 className="font-semibold text-slate-900">
      <BrandName />
    </h4>

    <p className="mt-2 whitespace-pre-wrap text-slate-700">
      {chatAnswer}
    </p>
  </div>
)}

    </div>
  </div>
)}

{dashboardSection === 'help' && helpMode === 'spare_part' && (
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
        {sparePartSearchLoading && <Spinner />}{sparePartSearchLoading ? t('Searching...') : t('Search')}
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
              <SparePartPrice part={part} /><FastDelivery name={part.part_name} />
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
                  ? <><Spinner />{t('Requesting...')}</>
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
        <p className="mt-3 text-sm text-slate-500"><Spinner />{t("Loading requests...")}</p>
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
              <SparePartPrice part={request} />
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

    </DashboardLayout>
  )
}

export default App
