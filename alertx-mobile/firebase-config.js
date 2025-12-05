// Mobile-specific Firebase config (keeps mobile config separate from web)
// This file exports the same client-side values (apiKey, projectId, etc.)
// but lives inside the mobile folder so the mobile app can import it directly.

const firebaseConfig = {
  apiKey: 'AIzaSyCtaTOBvrONNeMcFkcT8UfvXQTdNhnAfpg',
  authDomain: 'alertx-32a7a.firebaseapp.com',
  projectId: 'alertx-32a7a',
  storageBucket: 'alertx-32a7a.appspot.com',
  messagingSenderId: '828408740050',
  appId: '1:828408740050:web:40d7db521794950168550b',
  measurementId: 'G-CJFSTM0KD9',
};

export default firebaseConfig;
