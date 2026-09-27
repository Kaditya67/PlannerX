# PlannerX

> A modern, scenario-driven planning and productivity system built for professionals and teams. Streamline project execution, organize hierarchical plans with sections and tasks, run customizable focus sessions, share pristine roadmap templates, and manage multi-tier roles seamlessly.

---

## ✨ Features

- **Workspaces & Collaboration**:
  - Organize plans into distinct workspaces (Engineering, Design, Operations, Personal).
  - Quick action menus, plan filtering by status (**Active**, **Stashed**, **Archived**), and clean collapsible metrics strips.

- **Hierarchical Plans, Sections & Tasks**:
  - Structured roadmap breakdown with collapsible sections and general unsectioned tasks.
  - Multi-tier real-time completion tracking and estimated duration analytics.
  - Flexible lifecycle management: stash plans on hold or archive historical goals with instant 1-click restore.

- **Pristine Template Export & Import**:
  - Share roadmaps as clean, reusable JSON templates with all checkboxes and session logs automatically reset to 0% fresh states.
  - 1-click Import Template tool to generate fresh plans in any workspace immediately.

- **Deep Focus Mode**:
  - Built-in Pomodoro, Deep Work, and Custom interval timers.
  - Real-time task selector linked directly to active roadmap items.
  - Resilient timer state with localStorage background preservation.

- **Compact Calendar & Activity Stream**:
  - Space-efficient mini-calendar date picker.
  - Activity feed logging completed focus blocks and time spent per day.

- **Admin & Role Management Portal (`/admin`)**:
  - **Stealth Access**: Hidden from public menus, accessible exclusively via direct URL navigation for authorized administrators.
  - **Multi-Tier Hierarchy**: `DevAdmin` (Primary Owner), `Admin`, `Manager` (Middle Access), and `User`.
  - **User Inspector**: Real-time modal view of any user's workspaces, roadmap completion percentages, and focus session stats.
  - **Account Controls**: Instant account activation, suspension (blocking), customizable suspension reason messages, and data wipe capabilities.
  - **1-Day Ephemeral Demo User**: 1-Click demo sandbox access that safely resets experimental changes daily without locking credentials.

- **Clean SaaS UI / UX**:
  - Professional typography, accessible micro-interactions, and high-contrast design tokens.
  - Built-in **Light & Dark Mode** with custom OKLCH color palettes.
  - Collapsible desktop sidebar and fluid responsive mobile drawer navigation.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies and bcrypt password hashing
- **Security**: Helmet, express-rate-limit, CORS, Morgan logging

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or higher recommended)
- MongoDB instance (local or MongoDB Atlas connection URI)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Kaditya67/PlannerX.git
cd PlannerX
```

### 2. Configure Environment Variables

#### Backend Configuration
Create `backend/.env` based on `backend/.env.example`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/planner
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Frontend Configuration
Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_API_URL=/api
VITE_APP_NAME=Planner
VITE_APP_VERSION=1.0.0
```

---

## 💻 Running Locally

### Start Backend
```bash
cd backend
npm install
npm run dev # or npm start
```
The backend server runs on `http://localhost:5000`.

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
The client will be running on `http://localhost:5173`.

---

## 📁 Project Structure

```text
PlannerX/
├── backend/
│   ├── config/          # Database connection, seeders, environment
│   ├── controllers/     # API request handlers (plans, workspaces, items, sessions, auth, admin)
│   ├── middlewares/     # Auth verification, admin guard, error handling, rate limiting
│   ├── models/          # Mongoose data schemas (User, Workspace, Plan, Section, Item, Session)
│   ├── routes/          # Express route definitions
│   └── server.js        # Server entry point
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api/         # Axios API clients for backend endpoints
│   │   ├── components/  # Reusable UI components, modals, headers, progress bars
│   │   ├── context/     # React Contexts (AuthContext, ThemeContext, ToastContext, ConfirmContext)
│   │   ├── hooks/       # Custom React hooks (usePlan, useLocalStorage)
│   │   ├── layouts/     # MainLayout (with collapsible sidebar) & AuthLayout
│   │   ├── pages/       # Route views (Dashboard, Workspaces, PlanPage, Calendar, Focus, Settings, AdminPage)
│   │   ├── utils/       # Formatters, helpers, and constant dictionaries
│   │   ├── App.jsx      # Route tree definition
│   │   ├── index.css    # Tailwind CSS v4 design tokens and theme palettes
│   │   └── main.jsx     # Frontend entry point
│   └── vite.config.js   # Vite configuration with proxy to backend
└── README.md
```

---

## 🧪 Production Build

To build the client for production:
```bash
cd frontend
npm run build
```
The output bundles will be generated in `frontend/dist/`.

---

## 🤝 Contributing & License
Contributions, feedback, and feature suggestions are welcome.
This project is maintained under the MIT License.
