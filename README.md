# PlannerX

> A modern, scenario-driven planning and productivity system built for professionals and teams. Streamline project execution, organize hierarchical plans with sections and tasks, run customizable focus sessions, track calendar milestones, and manage workflows seamlessly.

---

## ✨ Features

- **Workspaces & Collaboration**: Organize plans into distinct workspaces (Engineering, Design, Operations, Personal). Full card interactivity with quick action menus.
- **Hierarchical Plans & Sections**:
  - Plans with section-based task breakdown.
  - Lifecycle management: **Active**, **Stashed** (temporary hold), and **Archived** (historical) states with instant restore and filter tabs.
  - Multi-tier progress calculation and time estimates.
- **Deep Focus Mode**:
  - Built-in Pomodoro, Deep Work, and Sprint intervals.
  - Fully customizable work and break durations directly from the Focus view or Settings page.
  - Auto-tracked active sessions linked to selected tasks.
  - Resilient timer state persisted with localStorage sync.
- **Compact Calendar & Activity Stream**:
  - Space-efficient mini-calendar date picker.
  - Daily session activity stream showing completed focus blocks and time spent.
- **Clean SaaS UI / UX**:
  - Professional typography and high-contrast tokens.
  - Built-in **Light & Dark mode** with custom OKLCH color palettes.
  - Collapsible desktop sidebar and fluid mobile drawer navigation.

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
│   ├── controllers/     # API request handlers (plans, workspaces, items, sessions, auth)
│   ├── middleware/      # Auth verification, error handling, rate limiting
│   ├── models/          # Mongoose data schemas (User, Workspace, Plan, Section, Item, Session)
│   ├── routes/          # Express route definitions
│   └── server.js        # Server entry point
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api/         # Axios API clients for backend endpoints
│   │   ├── components/  # Reusable UI components, modals, headers, progress bars
│   │   ├── context/     # React Contexts (AuthContext, ThemeContext, ToastContext)
│   │   ├── hooks/       # Custom React hooks (usePlan, useLocalStorage)
│   │   ├── layouts/     # MainLayout (with collapsible sidebar) & AuthLayout
│   │   ├── pages/       # Route views (Dashboard, Workspaces, Calendar, Focus, Settings)
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
