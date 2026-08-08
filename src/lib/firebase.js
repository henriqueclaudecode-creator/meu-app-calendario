// Inicialização do Firebase (App Web). As credenciais vêm das variáveis
// VITE_FIREBASE_* (.env.local). Se elas não estiverem presentes, `firebaseAtivo`
// fica false e o app segue funcionando em modo local (sem quebrar).

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseAtivo = !!config.apiKey && !!config.projectId;

export const app = firebaseAtivo ? initializeApp(config) : null;
export const auth = firebaseAtivo ? getAuth(app) : null;
export const db = firebaseAtivo ? getFirestore(app) : null;
export const googleProvider = firebaseAtivo ? new GoogleAuthProvider() : null;
