/*
  Utility script to set the `isOperator` custom claim for a user using the
  Firebase Admin SDK. Run this from a trusted environment (your dev machine
  with a service account key, CI runner with credentials, or a server).

  Usage (PowerShell):
    $env:SERVICE_ACCOUNT_PATH = 'path\to\serviceAccountKey.json'
    node .\scripts\setOperatorClaim.js <uid>

  OR set GOOGLE_APPLICATION_CREDENTIALS env var to the service account JSON
  path and run the command without SERVICE_ACCOUNT_PATH.
*/

const admin = require('firebase-admin');
const fs = require('fs');

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: node scripts/setOperatorClaim.js <uid>');
    process.exit(1);
  }

  const saPath = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saPath || !fs.existsSync(saPath)) {
    console.error('Service account JSON path not set or file does not exist.');
    console.error('Set SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to the JSON file path.');
    process.exit(1);
  }

  const serviceAccount = require(saPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  try {
    await admin.auth().setCustomUserClaims(uid, { isOperator: true });
    console.log(`Successfully set isOperator=true for uid=${uid}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to set custom claim:', err);
    process.exit(2);
  }
}

main();
