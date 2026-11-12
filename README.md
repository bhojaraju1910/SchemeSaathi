# SchemeSaathi (ಸ್ಕೀಮ್‌ಸಾಥಿ / स्कीमसाथी)

> **A Privacy-First Social Protection Discovery Engine for Indian Families**

SchemeSaathi helps Indian households discover central and state government social-protection schemes they may be potentially eligible for. Designed for academic review and public welfare impact, it provides plain-language explanations of *why* each scheme was recommended in **English**, **Kannada (ಕನ್ನಡ)**, and **Hindi (हिन्दी)**, without collecting sensitive identifying information like Aadhaar, bank accounts, or phone numbers.

---

## 1. Key Features

- **Algorithmic Eligibility Engine**: Evaluates user profile rules using deterministic relational logic (`gte`, `lte`, `eq`, `in`, `includesAny`).
- **High vs. Medium Relevance Tiers**: 
  - **High Match**: All required criteria are affirmatively satisfied.
  - **Medium Match**: No required criteria failed, but unconfirmed or missing fields require user self-verification.
  - **Exclusion**: Any failed mandatory rule immediately excludes the scheme.
- **Privacy By Design**: No Aadhaar, phone, or bank details collected. Income is provided as a broad bracket.
- **Full Tri-lingual Localization**: UI and scheme metadata in English, Kannada, and Hindi with immediate language switching.
- **Official Portal Outlinks**: Direct links to designated portals (such as [myScheme.gov.in](https://www.myscheme.gov.in/) and Seva Sindhu). Every official link click is logged for transparency.
- **Personal Welfare Dashboard**: Metrics for Available Schemes, Potential Matches, Bookmarked Shortlist, and Portal Interactions.
- **Admin Management & Interactive Rule Builder**: Admins can create and edit schemes, update structured criteria rules, and adjust multi-language titles and benefits.
- **Clear Sample Data Indicators**: All sample schemes are marked with an explicit `Sample data` badge to avoid misrepresentation.

---

## 2. Tech Stack

- **Frontend**: React 19, Vite 8, React Router 7, Tailwind CSS 4, `lucide-react`, `i18next` & `react-i18next`
- **Backend**: Node.js & Express.js REST API, JSON Web Tokens (JWT), `bcryptjs` password hashing, `helmet`, `cors`, `morgan`, `express-rate-limit`
- **Database**: Mongoose / MongoDB with built-in zero-dependency in-memory fallback for instant local and sandbox review
- **Testing**: Node.js native test runner (`tsx --test`) for pure eligibility engine functions
- **Fonts**: Rubik for headings, IBM Plex Sans for body text

---

## 3. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (React SPA)                                |
|  Navbar | Language Selector (en/kn/hi) | Scheme Cards | Match & Sample Badges     |
|  Pages: Landing | Profile | Recommendations | Directory | Dashboard | Admin Portal|
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JWT Bearer)
                                           v
+-----------------------------------------------------------------------------------+
|                                SERVER (Express.js)                                |
|  - Rate Limiter & Helmet Security Middleware                                      |
|  - JWT Authentication & RBAC (Role: User / Admin)                                 |
|  - API Endpoints (/api/auth, /api/profile, /api/schemes, /api/saved, /api/admin)  |
+---------------------+-------------------------------------+-----------------------+
                      |                                     |
                      v                                     v
+-------------------------------------+   +-----------------------------------------+
|     ELIGIBILITY ENGINE SERVICE      |   |       PERSISTENCE LAYER (Mongoose)      |
|  - evaluateRule(rule, profile)      |   |  - User & Profile Models                |
|  - matchSchemes(profile, schemes)   |   |  - Scheme & EligibilityCriteria Models  |
|  - Exclusion & High/Medium Sorting  |   |  - SavedScheme & Application Models     |
|  - Reasons & Missing Generators     |   |  - MongoDB Atlas or In-Memory Store     |
+-------------------------------------+   +-----------------------------------------+
```

---

## 4. Getting Started Locally

### Prerequisites
- Node.js (v20 or v22 LTS recommended)
- npm (v9+)
- (Optional) MongoDB local or MongoDB Atlas connection string. If omitted, SchemeSaathi automatically boots with its pre-loaded in-memory datastore.

### Installation
Clone or navigate to the repository root:
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
```

### Environment Variables (`.env`)
```env
PORT=3000
MONGODB_URI="" # Leave blank to run in-memory, or provide MongoDB Atlas URI
JWT_SECRET="schemesaathi_super_secret_jwt_key_2026"
CLIENT_URL="http://localhost:3000"
```

---

## 5. Running the Application

### Seed Initial Demo Data
```bash
npm run seed
```
Seeds 12 sample schemes across education, healthcare, senior citizens, agriculture, housing, and women welfare with criteria rules, plus the **Admin** and **Demo User** accounts.

### Start the Full-Stack Server
```bash
npm run dev
```
Starts Express.js and the Vite middleware unified on **`http://localhost:3000`**.

### Run Unit Tests
```bash
npm test
```
Executes the test suite for the eligibility engine covering all operators (`gte`, `lte`, `eq`, `in`, `includesAny`), missing field handling, optional vs. required rules, and High/Medium sorting.

---

## 6. Demo Accounts & 2-Minute Review Script

### Credentials
| Account Type | Email | Password | Pre-configured Profile |
| :--- | :--- | :--- | :--- |
| **Demo User** | `demo@schemesaathi.test` | `Demo@123` | Age 62, Karnataka, Low Income, Senior Citizen |
| **Admin** | `admin@schemesaathi.test` | `Admin@123` | System Administrator |

### 2-Minute College Review Script
1. **Login as Demo User**: On the login page, click the **"Login as Demo User (Senior Citizen)"** one-click button (or enter `demo@schemesaathi.test` / `Demo@123`).
2. **Review Profile**: Navigate to **Profile**. Note that the user is age 62, resident of Karnataka, low-income bracket, and categorized as a Senior Citizen. No sensitive ID numbers are requested.
3. **Inspect Recommendations**: Go to **My Matches** (`/recommendations`).
   - Notice **High Match**: *Sample Senior Citizen Social Security Pension* is ranked first with all 4 passed reasons displayed with checkmarks.
   - Notice **Medium Match**: *Sample Rural Artisan Support* appears with a cautionary badge and a clear "Please confirm: Occupation verified as traditional artisan" alert.
4. **Open Details & Save**: Click **View Details** on a scheme card. Review the required documents checklist and plain-language eligibility rules. Click **Save Scheme** to bookmark it.
5. **Switch Language to Kannada (ಕನ್ನಡ)**: In the top navigation bar, select **ಕನ್ನಡ** from the language selector. Notice the entire interface, titles, and benefits update smoothly.
6. **Visit Dashboard**: Open the **Dashboard** to see the 4 updated stat cards: Available Schemes, Potential Matches, Saved Schemes (1), and Portal Clicks.
7. **Log in as Admin**: Log out and log in with `admin@schemesaathi.test` / `Admin@123` (or click "Login as Admin Demo").
8. **Edit Scheme Rules**: Open **Admin Portal** (`/admin`). Click the Edit icon on any scheme. In the **Eligibility Rule Builder**, adjust a rule or add a new condition, then save. Return to the user view to see the matching engine immediately reflect the updated rules.

---

## 7. Replacing Sample Data with Real Verified Schemes

All seed data in `server/src/seed/schemes.json` is flagged with `isSample: true` and uses generic names. To replace this with real, verified government schemes:

1. Obtain official guidelines from [myScheme.gov.in](https://www.myscheme.gov.in/) or state welfare departments.
2. In `server/src/seed/schemes.json` (or via the Admin UI at `/admin/new`):
   - Replace title and description with the official gazette title (e.g., "Pradhan Mantri Awas Yojana").
   - Set `applyUrl` and `sourceUrl` to the verified `.gov.in` domain.
   - Set `isSample: false`.
   - Update `lastVerified` to the date of your verification review.
   - Add structured rules matching the official eligibility requirements.
   - Provide reviewed translations in Kannada (`kn`) and Hindi (`hi`).

---

## 8. Limitations & Future Work

- **Bhashini API Integration**: Integrate Government of India's [Bhashini](https://bhashini.gov.in/) translation API for automated high-fidelity translation across all 22 official Indian languages.
- **Voice-Assisted Search**: Implement speech-to-text input in local dialects for low-literacy citizens.
- **WhatsApp & SMS Alerts**: Opt-in notifications when new schemes matching a family's profile are published by state or central ministries.
- **Direct Application Sandboxing**: Partner with state single-window portals (e.g. Seva Sindhu) for secure document pre-verification.
- **Native Speaker Localization Review**: Machine-assisted translations for Kannada and Hindi should be reviewed and verified periodically by native linguistic experts.

---

## 9. Ethics & Compliance Disclaimer

SchemeSaathi does not process government applications, approve claims, or act as an agent of any ministry. All matched results are **strictly informational guidance** based on user-provided demographic estimates. Users must confirm eligibility requirements and submit official applications directly on authorized government websites.
