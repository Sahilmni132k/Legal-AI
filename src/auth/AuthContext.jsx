import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { AuthContext } from './context'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }

    let unsubscribe
    let cancelled = false
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => console.error('Could not set Firebase Auth persistence:', error))
      .finally(() => {
        if (!cancelled) {
          unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser)
            setLoading(false)
          }, () => setLoading(false))
        }
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    configured: isFirebaseConfigured,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUp: async (name, email, password) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() })
      return credential
    },
    signInWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
    sendPasswordReset: (email) => sendPasswordResetEmail(auth, email),
    signOut: () => firebaseSignOut(auth),
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired }

