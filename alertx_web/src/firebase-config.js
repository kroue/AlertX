// Firebase configuration file.
// This file prefers REACT_APP_* environment variables but falls back to the
// web app config you pasted so the app can run in development when .env is
// not present. The API key here is a client-side key (acceptable to include
// in client bundles), but DO NOT place service-account JSON in the client.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Default web config (from user-provided snippet). These are safe client
// values (apiKey is public-facing). We still prefer REACT_APP_* values when
// present so you can override them in .env.
const defaultConfig = {
  apiKey: 'AIzaSyCtaTOBvrONNeMcFkcT8UfvXQTdNhnAfpg',
  authDomain: 'alertx-32a7a.firebaseapp.com',
  projectId: 'alertx-32a7a',
  // corrected storage bucket host to the common appspot.com form
  storageBucket: 'alertx-32a7a.appspot.com',
  messagingSenderId: '828408740050',
  appId: '1:828408740050:web:40d7db521794950168550b',
  measurementId: 'G-CJFSTM0KD9',
};

const rawConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
};

// Trim any accidental whitespace from env values
const firebaseConfig = Object.fromEntries(
  Object.entries(rawConfig).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
);

/* eslint-disable no-console */
if (!firebaseConfig.apiKey) {
  console.error('FIREBASE CONFIG: REACT_APP_FIREBASE_API_KEY is MISSING. Add it to .env and restart the dev server.');
} else if (typeof firebaseConfig.apiKey === 'string' && !firebaseConfig.apiKey.startsWith('AIza')) {
  console.warn('FIREBASE CONFIG: apiKey present but does not look like a typical Firebase web API key (does not start with "AIza"). Please verify the value.');
} else {
  console.log('FIREBASE CONFIG: apiKey present (not printed).');
}
/* eslint-enable no-console */

export default firebaseConfig;

// Initialize Firebase app and auth for runtime usage in the app.
// The Firebase SDK functions are imported at top-of-file.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Provide both the default config object and a named `auth` export so
// client files can import `{ auth }` or the default config as needed.
export { auth };
