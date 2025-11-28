Firestore rules & deployment (alerts)

This project writes emergency alerts to Firestore in an `alerts` collection. If you see a "Missing or insufficient permissions" error when sending alerts, your Firestore security rules are blocking client writes. Below are example rules and deployment/testing steps.

1) Recommended: authenticated creators only

Copy this into your `firestore.rules` (or the Rules editor in the Firebase Console) to allow only signed-in users to create alert documents:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{alertId} {
      // allow authenticated users to create and read their alerts
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

2) Operator-only creators (role-based)

If only certain operator accounts should be allowed to send alerts, set a custom claim (for example `isOperator: true`) on those accounts and use rules like:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{alertId} {
      allow create: if request.auth != null && request.auth.token.isOperator == true;
      allow read: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

To set a custom claim for a user (run on a trusted server / Admin SDK):

```javascript
// Node.js (run with service account credentials)
import { getAuth } from 'firebase-admin/auth';
const auth = getAuth();
await auth.setCustomUserClaims(uid, { isOperator: true });
```

3) Development-only: permissive rules (DO NOT use in production)

```rules
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Deploying rules via Firebase CLI (PowerShell)

1. Install and login if you haven't:

```powershell
npm install -g firebase-tools
firebase login
```

2. Deploy rules from your project directory (assumes a `firestore.rules` file):

```powershell
firebase deploy --only firestore:rules
```

Testing safely with the Emulator (recommended)

1. Initialize and start emulators (Firestore + Auth):

```powershell
firebase init emulators
firebase emulators:start
```

2. Point your app to the emulator during development by setting the Firestore emulator host (example in code or using environment variables). See the Firebase emulator docs for details.

Troubleshooting checklist
- Confirm `auth.currentUser` is set before calling Firestore writes. Add a guard in the UI to require sign-in.
- Inspect logged error codes in the browser console — rules rejections return `permission-denied`.
- Use the Emulator UI to test rules without affecting production.

If you'd like, I can add a small README snippet into the codebase that shows how to toggle the emulator and add a `firestore.rules` file; tell me which rules flavor you prefer and I'll add it.
