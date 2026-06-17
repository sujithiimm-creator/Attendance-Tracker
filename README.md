# AttendTrack

AttendTrack is a multi-user class attendance tracker designed for **IIM Mumbai MBA** students. Each signed-in student has their own private subjects, active attendance log grid, and makeup class schedules.

The application is engineered with a modern, responsive, mobile-first aesthetic and supports real-time synchronization with **Firebase Firestore and Authentication** plus local-offline fallback emulation so it functions offline smoothly.

---

## 🚀 Key Features

1. **Today Tab**: Logs daily lectures (regular timetable sessions + newly scheduled extra/makeup classes) with quick attendance marking pills (**Present**, **Absent**, or **Cancelled**).
2. **Week Tab**: Navigates Mon-Sun calendar cycles. Future lectures are locked as *not yet happened*, while current and past intervals remain fully editable.
3. **Timetable Grid**: Presents a visual timetable grid color-coded per course module, with a timing details legend (venue, professor, etc.) and a chronologically sorted panel of upcoming makeup classes.
4. **Subjects Tab**: Manages course module lists. Features an SVG-animated circular attendance visual metric for every subject following compliance rules:
   - **75%+** = green (safe zone)
   - **60–74%** = amber (warning zone)
   - **Below 60%** = red (risk of debarment)
5. **Stats Tab**: Reports total cumulative attendance numbers inside an animated ring. Aggressively flags modules displaying attendance metrics below the mandatory **75%** mark to prevent course debarment.
6. **Robust Synchronization**: Connects a real-time `onSnapshot` listener to the Firestore collection and binds automatic local-first fallbacks for zero-friction sandbox previews.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vite + React 18 / 19 + TypeScript + Tailwind CSS.
- **Routing**: Single-page horizontal tab view controller.
- **Database**: Cloud Firestore client SDK calling databases directly under secure, user-level rules.
- **Security Rules**: Locked down under user level authorization matching `request.auth.uid`.

---

## 📦 Setting Up Firebase Credentials (Vercel / Local)

The app reads configuration details via `import.meta.env` keys. Simply set these environment variables during deployment (or in a `.env.local` file for local development):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

*Note: If no custom keys are declared, the app automatically runs in a fully featured offline local-first sandbox mode storing all data sheets inside the browser's `localStorage` — allowing instant preview testing!*

---

## 📂 Firestore Database Schema

User data is optimized to reside in a single document under the `users` collection to minimize transaction volumes:
- Collection path: `/users/{userId}`
- Document size boundary: ~under 1 MB.

```typescript
interface UserDocument {
  email: string;
  displayName: string;
  subjects: Subject[];
  records: { 
    [dateISO: string]: { 
      [subjectOrExtraKey: string]: "present" | "absent" | "cancelled" 
    } 
  };
  extraClasses: ExtraClass[];
  updatedAt?: any; // Firestore serverTimestamp
}
```

---

## 🔒 Firestore Security Rules

To enforce privacy, deploy these rules to Firestore via the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default global deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    // Individual standard student collections
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚢 Deployment Steps

### 1. Configure Firebase Services
1. Go to [Firebase Console](https://console.firebase.google.com/) and register a new project.
2. Enable **Authentication** and activate:
   - **Email/Password** registration.
   - **Google Sign-In** provider.
3. Open **Firestore Database** and choose **Create Database** in Production Mode.
4. Copy the rules from the rules section above and paste them into the "Rules" tab of your Firestore console. Hit **Publish**.
5. Go to Project Settings and add a **Web App** to register credentials. Copy the config variables.

### 2. Build & Deploy Frontend to Vercel
1. Push your code into a private or public **GitHub** repository.
2. In the [Vercel Dashboard](https://vercel.com/), hit **Add New Project** and import your Git repository.
3. Keep the framework preset to **Vite**.
4. Inside **Environment Variables**, add the six variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **Deploy**.

### 3. Add Authorized Redirect Domain
1. Copy the production domain generated by Vercel (e.g. `https://attendtrack.vercel.app`).
2. Go back to your Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
3. Click **Add domain** and input your Vercel production domain. *(This is mandatory for Google Sign-In popups to authorize credentials!)*

---

## 🌟 Developer Utilities

To easily test alternative schedules or start fresh:
- Click the **Reset Timetable to Default Seed** link in the footer. This swaps all current database records and re-seeds your account with the standard **IIM Mumbai Mod 5 timetable**!
