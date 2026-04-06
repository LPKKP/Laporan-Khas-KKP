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

**Deploy the real rules:** Copy the entire **`firestore.rules`** file from this repository into Firebase Console → Firestore → **Rules**, then **Publish**. Do not use an older snippet; the file matches the app (division-scoped reports, profile username, admin panel, audit log, etc.).

Summary of what `firestore.rules` enforces:

- **kkpReports**: Authenticated users read/write only where division access matches their role (admins see all).
- **userRoles**: Authenticated users can read; each user can create their own doc; **every user can update their own doc to change `username` (and similar) as long as `role` and `division` stay unchanged**—so admins and everyone else can fix typos on **Profil** without help; admins can still update any user; denied users can re-apply; only admins can delete.
- **divisionLookup**: Anyone can `get` a single doc by division (needed for login lookup). No `list` (prevents enumeration). Authenticated users can create/update/delete (see file for details).

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
| sickLeaveOccInfectious, sickLeaveOccInfectiousYTD | string/number | Section A (cuti sakit — penyakit berjangkit pekerjaan) |
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
| | username | string | **Required.** Set in profile. |
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
| `profile.html` | Edit profile: **username** (required) and change own password |
| `form.html` | KKP report form; saves to Firestore, downloads PDF |
| `data.html` | List reports; View/Download regenerates PDF from data |
| `admin.html` | Admin-only; manage user roles, division list, **set password for user** (non-admin) |

### Admin: Set user password (forgotten password)

Admins can set a new password for any non-admin user from the website (no email sent). User contacts admin (e.g. by phone); admin opens **Admin** → **Set kata laluan untuk pengguna**, selects the user by **username – bahagian**, enters the new password and confirms. This uses a **Firebase Cloud Function** (`setUserPassword`). You must deploy the function once (see below).

### Deploy Cloud Function (admin set password)

To enable **Admin → Set kata laluan untuk pengguna**, deploy the callable function once:

1. Install [Firebase CLI](https://firebase.google.com/docs/cli) and log in: `firebase login`.
2. In the project root, run: `firebase init functions` (if you have no `functions` folder yet). Choose TypeScript or JavaScript; the repo includes a `functions` folder with JavaScript.
3. From the project root: `cd functions && npm install && cd ..`
4. Deploy: `firebase deploy --only functions`
5. The function `setUserPassword` is in region `asia-southeast1`. If you use another region, change it in `functions/index.js` and in `admin.html` (search for `asia-southeast1`).

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
