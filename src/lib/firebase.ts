import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Firebase web API keys are intentionally public — security is enforced
// through Firestore rules and Firebase Auth, not by hiding this config.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyCUfqzTvMdA3mFH860sWf_PYCyXSwZRLi8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'daycal-7cac9.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'daycal-7cac9',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'daycal-7cac9.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '768025081132',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:768025081132:web:7a3088fa759c28da6a2889',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

export const isFirebaseConfigured = true

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} catch (error) {
  console.warn('Firebase initialization failed.', error)
}

export { app, auth, db, storage }
