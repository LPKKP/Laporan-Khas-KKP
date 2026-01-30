# Laporan-Khas-KKP

KKP (Keselamatan & Kesihatan Pekerjaan) performance reporting system. Users log in with Firebase Authentication, submit quarterly reports via a web form, and view/download PDFs generated on demand from Firestore data.

## Tech Stack

- **Frontend**: Static HTML, CSS, JavaScript
- **Auth**: Firebase Authentication (email/password)
- **Database**: Cloud Firestore
- **PDF**: jsPDF + jsPDF-Autotable (client-side generation)
- **Hosting**: GitHub Pages (static)

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and open your project (or create one).
2. Enable **Authentication** → **Sign-in method** → **Email/Password** (turn it on).
3. Ensure **Firestore Database** is created (Native mode).

### 2. Create Users

**Option A – Self-registration (recommended):** Users sign up at `register.html` with email, password, and division (Bahagian/Zon/Unit). They can then log in with either **email** or **division** + password.

**Option B – Manual (admin):** In Firebase Console → **Authentication** → **Users** → **Add user**. Enter Email and Password. Then create a `userRoles` doc and optionally a `divisionLookup` doc (see Data Model) so they can log in with division.

### 3. Assign Admin Role

The admin panel (`admin.html`) checks the `userRoles` collection in Firestore. Only users with `role: 'admin'` can access it.

**To make a user an admin:**

1. In Firebase Console → **Firestore Database** → **Start collection** (if needed).
2. Create a collection named `userRoles`.
3. Add a document with:
   - **Document ID**: the user's email (e.g. `admin@example.com`)
   - **Fields**:
     - `role` (string): `admin` or `user`
     - `createdAt` (timestamp): optional, set to current time

Example document:

| Field     | Type     | Value        |
|-----------|----------|--------------|
| role      | string   | admin        |
| createdAt | timestamp| (server time)|

**Document ID** = `admin@example.com` (the email of the user who should be admin).

### 4. Firestore Security Rules (Recommended)

Example rules for authenticated users, role-based `userRoles`, and division-based login:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /kkpReports/{reportId} {
      allow read, write: if request.auth != null;
    }
    match /userRoles/{email} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.email == email;
      allow update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.token.email)).data.role == 'admin';
    }
    match /divisionLookup/{division} {
      allow get: if true;
      allow list: if false;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

- **kkpReports**: Authenticated users can read/write reports.
- **userRoles**: Authenticated users can read; users create their own doc; only admins can update/delete.
- **divisionLookup**: Anyone can `get` a single doc by division (needed for login lookup). No `list` (prevents enumeration). Authenticated users can create/update/delete only their own entry (email must match).

- **auditLog**: Only admins can read; only admins can create (role changes are logged). No update/delete.

**Composite index:** For non-admin users, the data page queries `kkpReports` by `division` and `createdAt`. In Firebase Console → Firestore → Indexes, create a composite index on `kkpReports` with fields `division` (Ascending) and `createdAt` (Descending) if the first run prompts you.

Adjust as needed for your security requirements.

## Data Model

### `kkpReports` (per report)

Stores only structured form data. **No PDF is stored**; PDFs are generated on demand.

| Field | Type | Description |
|-------|------|-------------|
| division | string | Bahagian/Zon/Unit |
| quarter | string | Suku Pelaporan |
| reportDate | string | Tarikh Laporan (YYYY-MM-DD) |
| totalWorkers, totalWorkersYTD | string/number | Section A |
| sickLeave, sickLeaveYTD | string/number | Section A |
| deathCases, deathCasesYTD | string/number | Section B |
| severeAccidents, severeAccidentsYTD | string/number | Section B |
| medicalCases, medicalCasesYTD | string/number | Section B |
| firstAidCases, firstAidCasesYTD | string/number | Section B |
| fireCases, fireCasesYTD | string/number | Section B |
| propertyDamage, propertyDamageYTD | string/number | Section B |
| nearMiss, nearMissYTD | string/number | Section B |
| otherIncidents, otherIncidentsYTD | string/number | Section B |
| occupationalDisease, occupationalDiseaseYTD | string/number | Section C |
| infectiousDisease, infectiousDiseaseYTD | string/number | Section C |
| meetings, meetingsYTD | string/number | Section D |
| trainings, trainingsYTD | string/number | Section D |
| briefings, briefingsYTD | string/number | Section D |
| inspections, inspectionsYTD | string/number | Section D |
| uauc, uaucYTD | string/number | Section D |
| otherActivities, otherActivitiesYTD | string/number | Section D |
| certifierName | string | Section E |
| createdAt | timestamp | Server timestamp |
| createdBy | string | Email of submitter |
| status | string | e.g. submitted |

### `userRoles` (per user)

| Document ID | Field | Type | Description |
|-------------|-------|------|-------------|
| (user email) | role | string | `admin` or `user` |
| | division | string | Bahagian/Zon/Unit (optional) |
| | createdAt | timestamp | Optional |
| | disabled | boolean | Optional, for disabling access |

### `divisionLookup` (for login with division)

| Document ID | Field | Type | Description |
|-------------|-------|------|-------------|
| (division, lowercase) | email | string | User's email for this division |

Used to resolve division → email when logging in with division + password. Division must be unique per user.

## Pages

| Page | Purpose |
|------|---------|
| `login.html` | Sign in with email or division + password |
| `register.html` | Self-register with email, password, division |
| `index.html` | Dashboard; links to form, data, admin |
| `form.html` | KKP report form; saves to Firestore, downloads PDF |
| `data.html` | List reports; View/Download regenerates PDF from data |
| `admin.html` | Admin-only; manage user roles (requires `userRoles` doc with `role: admin`) |

## Run Locally

1. Clone or download this repo.
2. Serve the folder with a local server (e.g. `npx serve .` or VS Code Live Server).
3. Open `login.html` and sign in with a Firebase Auth user.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select branch (e.g. `main`) and folder (e.g. `/ (root)`).
5. Save. The site will be at `https://<username>.github.io/<repo>/`.
6. Ensure `login.html` is the entry point (or redirect `index.html` to `login.html` for unauthenticated users).

## First-Time Setup (Quick Test)

1. **Firebase Console** → Authentication → Sign-in method → Enable **Email/Password**.
2. **Add Firestore rules** including `divisionLookup` (see section 4 above).
3. **Option A – Self-register:** Open `register.html` → sign up with email, password, division. Then in Firestore → `userRoles` → edit your doc → set `role` = `admin`.
4. **Option B – Manual:** Create user in Authentication → Add user. Create `userRoles` doc (ID = email, `role` = `admin`). Create `divisionLookup` doc (ID = division lowercase, `email` = user email) if you want division login.
5. Open `login.html` → sign in with email or division + password.
6. Use **Open Admin** to manage users.

## Testing the Flow

1. **Self-register** at `register.html` (email, password, division) or create a user in Firebase Console.
2. **Create admin role** (for first admin): Firestore → `userRoles` → document ID = that user's email, field `role` = `admin`.
3. Open `login.html` → sign in with **email** or **division** + password.
4. **Dashboard** (`index.html`): use links to Form, Data, Admin.
5. **Form** (`form.html`): fill and submit; PDF downloads, data saves to Firestore.
6. **Data** (`data.html`): list reports; View/Download regenerates PDF from saved data.
7. **Admin** (`admin.html`): list users from `userRoles`, change roles. New users who log in get a `userRoles` doc with `role: user` automatically.

## Cost Notes

- Firebase Auth (email/password): free on Spark plan.
- Firestore: free tier (50k reads, 20k writes/day; 1 GiB storage).
- PDFs are not stored; only form data is saved, keeping storage low.
