import { useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from './auth/useAuth'
import AuthScreen from './components/AuthScreen'
import { extractDocumentText } from './lib/extractDocumentText'
import './App.css'

const initialDocuments = []

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" /><path d="M13 3v7h7M8 14h8M8 17h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.5a8 8 0 0 1-1.5.9l-.2 1.5h-2.5l-.3-1.5a8 8 0 0 1-1.5-.9l-1.4.5-1.2-2.1 1.2-.9a7 7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.4.5a8 8 0 0 1 1.5-.9l.3-1.5h2.5l.2 1.5a8 8 0 0 1 1.5.9l1.4-.5 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.8Z" transform="translate(-1 -1) scale(1.08)" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M20 16.5v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.file}</svg>
}
Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
}

function Dashboard({ user, onSignOut }) {
  const [activeNav, setActiveNav] = useState('Overview')
  const [documents, setDocuments] = useState(initialDocuments)
  const [sessionDocuments, setSessionDocuments] = useState({})
  const [analysisByName, setAnalysisByName] = useState({})
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [activeFinding, setActiveFinding] = useState(null)
  const inputRef = useRef(null)

  const visibleDocuments = useMemo(() => documents.filter((document) => document.name.toLowerCase().includes(search.toLowerCase())), [documents, search])
  const reviewedCount = Object.keys(analysisByName).length
  const findingCount = Object.values(analysisByName).reduce((total, result) => total + result.findings.length, 0)
  const extractedCharacters = selectedDocument?.text.length || 0
  const displayName = user.displayName || user.email?.split('@')[0] || 'there'
  const firstName = displayName.split(/\s+/)[0]
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  async function addFiles(fileList) {
    const file = Array.from(fileList || [])[0]
    if (!file) return
    setNotice('')
    setExtracting(true)
    try {
      const text = await extractDocumentText(file)
      const name = file.name.replace(/\.[^.]+$/, '')
      const type = file.name.split('.').pop().toUpperCase()
      const extracted = { name, type, text }
      setSelectedDocument(extracted)
      setSessionDocuments((current) => ({ ...current, [name]: extracted }))
      setAnalysisResult(null)
      setActiveFinding(null)
      setDocuments((current) => [{ name, type, updated: 'Just now', status: 'Text extracted', tone: 'blue', icon: 'file' }, ...current.filter((document) => document.name !== name)])
      setNotice('Text extracted in your browser. Choose a review or summary action.')
    } catch (error) {
      setNotice(error.message || 'Could not read that document.')
    } finally {
      setExtracting(false)
      window.setTimeout(() => setNotice(''), 5000)
    }
  }

  async function runAnalysis(mode) {
    if (!selectedDocument) {
      setNotice('Choose a PDF, DOCX, or TXT file first.')
      inputRef.current?.click()
      return
    }

    setAnalyzing(true)
    setNotice('')
    try {
      const idToken = await user.getIdToken()
      const response = await fetch('/api/review-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ documentName: selectedDocument.name, text: selectedDocument.text, mode }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'The AI review could not be completed.')
      setAnalysisResult(result)
      setActiveFinding(result.findings?.[0] || null)
      setAnalysisByName((current) => ({ ...current, [selectedDocument.name]: result }))
      setDocuments((current) => current.map((document) => document.name === selectedDocument.name
        ? { ...document, status: mode === 'review' ? 'Review ready' : 'Summary ready', tone: 'green', updated: 'Just now' }
        : document))
    } catch (error) {
      setNotice(error.message || 'Could not connect to the AI review service.')
    } finally {
      setAnalyzing(false)
    }
  }

  function openDocument(document) {
    const source = sessionDocuments[document.name]
    if (!source) {
      setNotice('Upload this file in the current session to analyze it.')
      return
    }
    setSelectedDocument(source)
    const result = analysisByName[document.name]
    if (result) {
      setAnalysisResult(result)
      setActiveFinding(result.findings?.[0] || null)
    } else {
      setAnalysisResult(null)
      setNotice('Document text is ready. Choose a summary or review action.')
    }
  }

  async function loadSampleDocument() {
    try {
      const response = await fetch('/sample-contract.txt')
      if (!response.ok) throw new Error('Could not load the synthetic sample.')
      const sample = await response.text()
      await addFiles([new File([sample], 'sample-contract.txt', { type: 'text/plain' })])
    } catch (error) {
      setNotice(error.message || 'Could not load the synthetic sample.')
    }
  }

  const navigation = [
    { label: 'Overview', icon: 'grid' },
    { label: 'Documents', icon: 'file' },
    { label: 'Legal research', icon: 'search' },
    { label: 'Compliance', icon: 'shield' },
    { label: 'Activity', icon: 'clock' },
  ]

  return (
    <div className="app-shell">
      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={() => setActiveNav('Overview')}>
          <span className="brand-mark"><span /></span><span className="brand-name">legalflow<span>AI</span></span>
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">W</div>
          <div className="workspace-copy"><strong>My workspace</strong><span>Current browser session</span></div>
          <span className="chevron">⌄</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => <button key={item.label} className={`nav-item ${activeNav === item.label ? 'active' : ''}`} onClick={() => { setActiveNav(item.label); setMobileNav(false) }}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.label === 'Documents' && <span className="nav-count">{documents.length}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Icon name="spark" size={17} /></div><strong>Make more room for focus</strong><p>Unlock unlimited document reviews.</p><button onClick={() => setNotice('Plan upgrades are coming soon.')}>Explore plans <Icon name="arrow" size={14} /></button></div>
          <button className="nav-item settings-item" onClick={() => { setActiveNav('Settings'); setNotice('Workspace settings are coming soon.') }}><Icon name="settings" size={18} /><span>Settings</span></button>
          <div className="profile-row"><div className="profile-avatar">{(displayName || 'LF').slice(0, 2).toUpperCase()}</div><div className="profile-copy"><strong>{displayName}</strong><span>Signed in</span></div><button className="icon-button profile-more" aria-label="Sign out" title="Sign out" onClick={onSignOut}><Icon name="logout" size={17} /></button></div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><label className="search-box"><Icon name="search" size={17} /><input aria-label="Search documents" placeholder="Search documents..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up.')}><Icon name="bell" size={19} /><i /></button><div className="top-avatar">{(displayName || 'LF').slice(0, 2).toUpperCase()}</div></div>
        </header>

        <div className="page-content">
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> {todayLabel}</div><h1>{greeting}, {firstName} <span className="wave">✳</span></h1><p className="welcome-subtitle">Here’s what’s happening across your legal workspace.</p></div><button className="button-primary" onClick={() => inputRef.current?.click()}><Icon name="plus" size={18} /> New document</button></section>

          <section className="stats-grid" aria-label="Workspace summary">
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Documents analyzed</span><span className="stat-icon lavender"><Icon name="file" size={18} /></span></div><div className="stat-value">{reviewedCount}</div><div className="stat-foot">Completed in this session</div><div className="mini-bars" aria-hidden="true"><i style={{height:'35%'}}/><i style={{height:'52%'}}/><i style={{height:'43%'}}/><i style={{height:'66%'}}/><i style={{height:'54%'}}/><i style={{height:'79%'}}/><i style={{height:'62%'}}/><i style={{height:'93%'}}/></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Source-linked findings</span><span className="stat-icon coral"><Icon name="shield" size={18} /></span></div><div className="stat-value">{findingCount}</div><div className="stat-foot">Exact quotes matched in source</div><div className="risk-meter"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-label">Text extracted</span><span className="stat-icon mint"><Icon name="clock" size={18} /></span></div><div className="stat-value">{new Intl.NumberFormat('en-US').format(extractedCharacters)} <small>chars</small></div><div className="stat-foot">Current document in memory</div><div className="time-line" aria-hidden="true"><svg viewBox="0 0 180 36" preserveAspectRatio="none"><path d="M0 29 C18 28 20 17 39 20 S60 31 77 18 S97 20 112 12 S132 24 147 10 S166 9 180 3" /></svg></div></article>
          </section>

          <div className="content-grid">
            <section className="panel upload-panel">
              <div className="section-heading"><div><h2>Get started with a document</h2><p>Extract text locally, then send it to your configured AI for analysis.</p></div><span className="secure-label"><Icon name="lock" size={13} /> TEXT EXTRACTED LOCALLY</span></div>
              <div className={`dropzone ${dragging ? 'dropzone-active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}>
                <div className="upload-illustration"><div className="upload-glow"/><div className="paper paper-back"/><div className="paper paper-front"><span/><span/><span/><span/></div><div className="upload-arrow"><Icon name="upload" size={18} /></div></div>
                <h3>{extracting ? 'Extracting document text…' : selectedDocument ? selectedDocument.name : 'Drop your document here'}</h3><p>{extracting ? 'The file is being read in this browser.' : selectedDocument ? 'Ready for an AI summary or contract review.' : <>or <button className="text-button" onClick={() => inputRef.current?.click()}>browse files</button> from your computer</>}</p>
                <div className="file-types"><span>PDF</span><span>DOCX</span><span>TXT</span><i>Up to 20 MB</i></div>
                <input ref={inputRef} className="file-input" type="file" accept=".pdf,.txt,.docx,application/pdf,text/plain" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
              </div>
              <div className="quick-actions"><span className="quick-label">QUICK ACTIONS</span><button disabled={extracting || analyzing} onClick={() => runAnalysis('review')}><span className="quick-icon purple-bg"><Icon name="spark" size={16} /></span><span><strong>{analyzing ? 'Analyzing document…' : 'Review a contract'}</strong><small>Find risks with source excerpts</small></span><Icon name="arrow" size={16} /></button><button disabled={extracting || analyzing} onClick={() => runAnalysis('summary')}><span className="quick-icon blue-bg"><Icon name="file" size={16} /></span><span><strong>Summarize a document</strong><small>Get the key points, faster</small></span><Icon name="arrow" size={16} /></button><button onClick={() => { setActiveNav('Legal research'); setNotice('Legal research is planned for a later version.') }}><span className="quick-icon green-bg"><Icon name="search" size={16} /></span><span><strong>Research a legal question</strong><small>Coming soon</small></span><Icon name="arrow" size={16} /></button><button onClick={loadSampleDocument}><span className="quick-icon blue-bg"><Icon name="file" size={16} /></span><span><strong>Load synthetic sample</strong><small>Safe test contract</small></span><Icon name="arrow" size={16} /></button><p className="privacy-note">Document text is sent to the AI provider you configure only when you request analysis. Don’t submit confidential records unless your organization approves the provider.</p></div>
            </section>

            <section className="panel activity-panel"><div className="section-heading activity-heading"><div><h2>Recent documents</h2><p>Your latest work, all in one place.</p></div><button className="link-button" onClick={() => setActiveNav('Documents')}>View all <Icon name="arrow" size={14} /></button></div>
              <div className="document-list">{visibleDocuments.length ? visibleDocuments.map((document, index) => <button className="document-row" key={`${document.name}-${index}`} onClick={() => openDocument(document)}><span className={`document-icon ${document.type === 'PDF' ? 'pdf-icon' : 'doc-icon'}`}><Icon name={document.icon} size={17} /></span><span className="document-info"><strong>{document.name}</strong><small>{document.type} <i>·</i> {document.updated}</small></span><span className={`status-pill ${document.tone}`}><i />{document.status}</span><Icon name="more" size={17} /></button>) : <div className="empty-state">{search ? `No documents match “${search}”.` : 'No files in this session yet. Upload a document to get started.'}</div>}</div>
              <div className="activity-footer"><span className="activity-avatars"><i>LF</i></span><span><strong>Current session</strong><small> Document text stays in browser memory until you leave this page.</small></span><button className="icon-button" aria-label="Upload a document" onClick={() => inputRef.current?.click()}><Icon name="plus" size={16} /></button></div>
            </section>
          </div>

          <footer className="page-footer"><span>LegalFlow AI helps you work through legal documents with confidence.</span><span>AI outputs need review by a qualified lawyer</span></footer>
        </div>
      </main>
      {analysisResult && <div className="analysis-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAnalysisResult(null) }}><section className="analysis-dialog" role="dialog" aria-modal="true" aria-labelledby="analysis-title"><header className="analysis-header"><div><span className="analysis-kicker">AI DOCUMENT {analysisResult.mode === 'review' ? 'REVIEW' : 'SUMMARY'}</span><h2 id="analysis-title">{analysisResult.documentName}</h2></div><button className="analysis-close" aria-label="Close analysis" onClick={() => setAnalysisResult(null)}>×</button></header><div className="analysis-body"><section className="analysis-overview"><h3>Summary</h3><p>{analysisResult.summary}</p><h3>Key points</h3><ul>{analysisResult.keyPoints.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ul><div className="analysis-disclaimer">{analysisResult.disclaimer}</div>{analysisResult.omittedFindings > 0 && <p className="omitted-note">{analysisResult.omittedFindings} finding(s) were omitted because the quoted source text could not be matched exactly.</p>}</section><div className="analysis-columns"><section className="finding-column"><div className="analysis-section-title"><h3>Findings</h3><span>{analysisResult.findings.length} source-linked</span></div>{analysisResult.findings.length ? analysisResult.findings.map((finding, index) => <article key={`${index}-${finding.title}`} className={`finding-card ${activeFinding === finding ? 'finding-active' : ''}`}><div className="finding-title-row"><span className={`severity-tag ${finding.severity}`}>{finding.severity}</span><h4>{finding.title}</h4></div><p>{finding.analysis}</p><p className="finding-recommendation"><strong>Review point:</strong> {finding.recommendation}</p><button className="source-link" onClick={() => setActiveFinding(finding)}>View matching source text <Icon name="arrow" size={14} /></button></article>) : <div className="analysis-empty">No source-linked risks were identified in the reviewed text. This does not establish that the document is risk-free.</div>}</section><section className="source-column"><div className="analysis-section-title"><h3>Document source</h3><span>{selectedDocument?.type}</span></div>{activeFinding && selectedDocument ? (() => { const sourceStart = Math.max(0, activeFinding.start - 240); const sourceEnd = Math.min(selectedDocument.text.length, activeFinding.end + 240); return <pre className="source-excerpt">{sourceStart > 0 ? '…' : ''}{selectedDocument.text.slice(sourceStart, activeFinding.start)}<mark>{selectedDocument.text.slice(activeFinding.start, activeFinding.end)}</mark>{selectedDocument.text.slice(activeFinding.end, sourceEnd)}{sourceEnd < selectedDocument.text.length ? '…' : ''}</pre> })() : <pre className="source-excerpt">{selectedDocument?.text?.slice(0, 1800) || 'No extracted source text.'}</pre>}</section></div></div></section></div>}
      {notice && <div className="toast" role="status"><span className="toast-check">✓</span>{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}>×</button></div>}
    </div>
  )
}

Dashboard.propTypes = {
  user: PropTypes.shape({ displayName: PropTypes.string, email: PropTypes.string, getIdToken: PropTypes.func.isRequired }).isRequired,
  onSignOut: PropTypes.func.isRequired,
}

function App() {
  const { user, loading, configured, signOut } = useAuth()

  if (loading) return <main className="auth-loading"><span className="loading-spinner" />Checking your session…</main>
  if (!configured || !user) return <AuthScreen />
  return <Dashboard user={user} onSignOut={signOut} />
}

export default App

