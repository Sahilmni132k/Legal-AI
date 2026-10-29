import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

function Brand() {
  return <div className="auth-brand"><span className="brand-mark"><span /></span><span className="brand-name">legalflow<span>AI</span></span></div>
}

function SetupInstructions() {
  return (
    <div className="auth-setup" role="status">
      <div className="setup-icon">⚙</div>
      <h2>Connect your Firebase project</h2>
      <p>Authentication is wired into the app. Add your Firebase project settings to enable sign-in and AI reviews.</p>
      <ol>
        <li>Create a Firebase project and register a <strong>Web app</strong>.</li>
        <li>In <strong>Authentication → Sign-in method</strong>, enable Email/Password and Google.</li>
        <li>Copy the web app values into <code>.env.local</code> using the keys in <code>.env.example</code>.</li>
        <li>Copy <code>.env.server.example</code> to <code>.env</code> and add your OpenAI API key plus Firebase Admin service account JSON.</li>
        <li>Restart the dev server, then sign in here.</li>
      </ol>
      <div className="setup-note">Keep the service account JSON and OpenAI API key server-side in <code>.env</code>. Never put them in a VITE_ variable or commit them.</div>
    </div>
  )
}

const friendlyErrors = {
  'auth/invalid-credential': 'That email and password combination could not be verified.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
  'auth/email-already-in-use': 'An account with this email may already exist. Try signing in.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a little while, then try again.',
  'auth/network-request-failed': 'Could not reach Firebase. Check your connection and try again.',
  'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication settings.',
}

function messageFor(error) {
  return friendlyErrors[error?.code] || 'Authentication could not be completed. Check your Firebase settings and try again.'
}

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, sendPasswordReset, configured } = useAuth()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function run(action) {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await action()
    } catch (authError) {
      setError(messageFor(authError))
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (mode === 'reset') {
      if (!email.trim()) {
        setError('Enter your email address and we’ll send a reset link.')
        return
      }
      run(async () => {
        await sendPasswordReset(email.trim())
        setSuccess('If an account exists for that email, a password reset link is on its way.')
      })
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Choose a password with at least 6 characters.')
      return
    }
    run(() => mode === 'signup' ? signUp(name, email.trim(), password) : signIn(email.trim(), password))
  }

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
      <header className="auth-top"><Brand /><span className="auth-top-caption">LEGAL WORK, IN BETTER FLOW</span></header>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-kicker"><span /> YOUR LEGAL WORKSPACE</div>
          <h1>Make room for<br /><span>the work that matters.</span></h1>
          <p>Review documents, surface key details, and keep your legal work moving—with a little help from AI.</p>
          <div className="auth-story-rule" />
          <div className="auth-story-points"><span><i>✓</i> Your workspace, organized</span><span><i>✓</i> Your work, ready when you are</span></div>
          <div className="auth-quote"><div className="quote-mark">“</div><p>Less time searching through documents. More time making the decisions that count.</p><span>LEGALFLOW AI</span></div>
        </section>

        <section className="auth-card">
          <div className="auth-card-heading"><div className="auth-card-icon">✳</div><div><h2>{mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}</h2><p>{mode === 'signup' ? 'Start your legal workspace today.' : mode === 'reset' ? 'We’ll email you a secure reset link.' : 'Sign in to continue to your workspace.'}</p></div></div>

          {configured ? <>
            {mode !== 'reset' && <button className="google-button" disabled={busy} onClick={() => run(signInWithGoogle)}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.21Z"/><path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.55 0-4.71-1.72-5.48-4.04H3.28v2.51A9.74 9.74 0 0 0 12 21.6Z"/><path fill="#FBBC05" d="M6.52 13.69a5.87 5.87 0 0 1 0-3.74V7.44H3.28a9.74 9.74 0 0 0 0 8.76l3.24-2.51Z"/><path fill="#EA4335" d="M12 5.91c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 2.97 14.63 2 12 2a9.74 9.74 0 0 0-8.72 5.44l3.24 2.51C7.29 7.63 9.45 5.91 12 5.91Z"/></svg>Continue with Google</button>}
            {mode !== 'reset' && <div className="auth-divider"><span />or continue with email<span /></div>}
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'signup' && <label>Full name<input type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
              <label>Email address<input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              {mode !== 'reset' && <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>}
              {mode === 'signin' && <button className="forgot-link" type="button" onClick={() => { setMode('reset'); setError(''); setSuccess('') }}>Forgot password?</button>}
              {error && <div className="auth-message auth-error" role="alert">{error}</div>}
              {success && <div className="auth-message auth-success" role="status">{success}</div>}
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}<span>→</span></button>
            </form>
            <div className="auth-switch">{mode === 'reset' ? <>Remember your password? <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }}>Back to sign in</button></> : mode === 'signup' ? <>Already have an account? <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }}>Sign in</button></> : <>New to LegalFlow? <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Create an account</button></>}</div>
          </> : <SetupInstructions />}
          <div className="auth-legal"><span><b>🔒</b> Secure sign-in powered by Firebase</span><span>By continuing, you agree to our Terms & Privacy Policy.</span></div>
        </section>
      </div>
      <footer className="auth-footer"><span>© 2026 LegalFlow AI</span><span>Thoughtful tools for legal work</span><span>Need help? <a href="mailto:support@legalflow.ai">Contact us</a></span></footer>
    </main>
  )
}

