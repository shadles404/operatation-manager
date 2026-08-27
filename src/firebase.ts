import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

let secondaryApp: any = null;
export function getSecondaryAuth() {
  if (!secondaryApp) {
    const existing = getApps().find(a => a.name === 'SecondaryAdminAuth');
    secondaryApp = existing || initializeApp(firebaseConfig, 'SecondaryAdminAuth');
  }
  return getAuth(secondaryApp);
}

