/**
 * Firebase Configuration
 *
 * To connect your Firebase project, add the following environment variables
 * to your .env.local file:
 *
 * NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
 *
 * Until then, the app runs in localStorage-only mode.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
)

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (error) {
    console.warn('Firebase initialization failed. Running in offline mode.', error)
  }
}

export { app, auth, db, storage }
