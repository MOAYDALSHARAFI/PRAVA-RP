import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DeveloperSettings, ScenarioReport } from '../types';
import { DEFAULT_DEVELOPER_SETTINGS } from '../data/initialData';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the exact database ID from config
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Health check connection test as required by Firebase skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
    }
    return false;
  }
}

// Initial connection test
validateFirestoreConnection().catch(() => {});

const SETTINGS_DOC_ID = 'global_config';

/**
 * Loads shared settings from Firestore
 */
export async function loadSharedSettings(): Promise<DeveloperSettings | null> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DeveloperSettings;
    }
  } catch (e) {
    console.warn('Failed loading shared settings from Firestore:', e);
  }
  return null;
}

/**
 * Saves shared settings to Firestore for all users & devices
 */
export async function saveSharedSettings(settings: DeveloperSettings): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('Failed saving shared settings to Firestore:', e);
    return false;
  }
}

/**
 * Real-time subscription to shared settings
 * When ANY admin/officer changes settings, ALL users get the update instantly!
 */
export function subscribeToSharedSettings(
  callback: (settings: DeveloperSettings) => void
): () => void {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as DeveloperSettings;
        callback({
          ...DEFAULT_DEVELOPER_SETTINGS,
          ...remoteData,
          sectorStatus: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorStatus,
            ...(remoteData.sectorStatus || {}),
          },
          sectorLogos: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorLogos,
            ...(remoteData.sectorLogos || {}),
          },
          sectorChannels: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorChannels,
            ...(remoteData.sectorChannels || {}),
          },
          sectorTemplates: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorTemplates,
            ...(remoteData.sectorTemplates || {}),
          },
          roleCategoriesConfig: {
            ...DEFAULT_DEVELOPER_SETTINGS.roleCategoriesConfig,
            ...(remoteData.roleCategoriesConfig || {}),
          },
        });
      }
    },
    (err) => {
      console.warn('Settings subscription error:', err);
    }
  );
}

/**
 * Saves a scenario report to shared cloud reports
 */
export async function saveSharedReport(report: ScenarioReport): Promise<boolean> {
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(docRef, report);
    return true;
  } catch (e) {
    console.warn('Failed saving report to Firestore:', e);
    return false;
  }
}

/**
 * Loads shared reports history from Firestore
 */
export async function loadSharedReports(): Promise<ScenarioReport[]> {
  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const reports: ScenarioReport[] = [];
    snap.forEach((d) => {
      reports.push(d.data() as ScenarioReport);
    });
    return reports;
  } catch (e) {
    console.warn('Failed loading shared reports:', e);
    return [];
  }
}
