================================================================================
  TASKFLOW — TEAM TASK MANAGER (Full-Stack)
  Internship Assignment Submission
================================================================================

LIVE APPLICATION URL: [Add your Railway URL here after deployment]
GITHUB REPOSITORY:    [Add your GitHub repo URL here]

--------------------------------------------------------------------------------
PROJECT OVERVIEW
--------------------------------------------------------------------------------

TaskFlow is a production-grade, full-stack Team Task Manager web application
built with Node.js/Express on the backend and React on the frontend. It enables
teams to create projects, assign tasks, and track progress with role-based
access control (Admin/Member).

Key capabilities:
  - JWT-based authentication (register, login, protected routes)
  - Role-based access control (Admin vs Member permissions)
  - Project management with team collaboration
  - Task creation, assignment, and status tracking (Kanban board)
  - Real-time dashboard with overdue detection and progress metrics
  - Full REST API with proper validation and error handling
  - MongoDB database with relational data design
  - Deployed on Railway (fully live and functional)

--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

BACKEND:
  - Runtime:      Node.js (v18+)
  - Framework:    Express.js v4
  - Database:     MongoDB with Mongoose ODM
  - Auth:         JWT (jsonwebtoken) + bcryptjs for password hashing
  - Validation:   express-validator
  - Middleware:   CORS, Morgan (logging), custom error handler

FRONTEND:
  - Library:      React 18
  - Routing:      React Router v6
  - HTTP Client:  Axios (with interceptors for auth token injection)
  - State:        React Context API + useState/useEffect
  - Toast:        react-hot-toast
  - Icons:        lucide-react
  - Fonts:        Cal Sans + Plus Jakarta Sans (Google Fonts)

DEPLOYMENT:
  - Platform:     Railway (both backend and frontend)
  - Database:     MongoDB Atlas (cloud)

--------------------------------------------------------------------------------
FEATURES IN DETAIL
--------------------------------------------------------------------------------

1. AUTHENTICATION (Signup / Login)
   - User registration with name, email, password (bcrypt hashed)
   - JWT token issued on login/register (7-day expiry)
   - Token auto-attached to all API requests via Axios interceptor
   - Protected routes redirect unauthenticated users
   - Auto-generated avatar via DiceBear API

2. PROJECT & TEAM MANAGEMENT
   - Create projects with name, description, priority, color, due date
   - Project owner automatically assigned Admin role
   - Add/remove team members by searching email or name
   - Role management: Owner can promote/demote members (Admin/Member)
   - Project settings: update name, description, status, priority
   - Project deletion (owner only) — cascades to all tasks

3. TASK CREATION, ASSIGNMENT & STATUS TRACKING
   - Create tasks within projects with full metadata:
     title, description, status, priority, assignee, due date, tags
   - Four statuses: To Do → In Progress → In Review → Done
   - Four priority levels: Low, Medium, High, Critical
   - Assign tasks to any project member
   - Edit/delete tasks (Admin, task creator, or assigned user)
   - Automatic "completedAt" timestamp when task marked Done
   - Overdue detection based on due date vs current date

4. DASHBOARD (Tasks, Status, Overdue)
   - Personalized greeting with time-of-day detection
   - Stat cards: Total Projects, My Tasks, Overdue, Due This Week
   - Task breakdown by status with completion rate progress bar
   - 5 most recent tasks across all projects
   - Quick project access links
   - All data aggregated from MongoDB in a single optimized query

5. KANBAN BOARD (Project Detail)
   - 4-column kanban: To Do | In Progress | In Review | Done
   - Filter tasks by priority and status simultaneously
   - Full-text search within project tasks
   - Task cards show: title, description preview, assignee, due date,
     priority badge, tags
   - Visual overdue indicator (red date)
   - Left border color coded by priority

6. ROLE-BASED ACCESS CONTROL
   - Admin: full CRUD on tasks, can add/remove/manage members
   - Member: can create tasks, edit own/assigned tasks, view everything
   - Owner: all admin capabilities + delete project + manage all roles
   - Backend enforces all permissions server-side (not just UI)

--------------------------------------------------------------------------------
REST API ENDPOINTS
--------------------------------------------------------------------------------

AUTH:
  POST   /api/auth/register      — Register new user
  POST   /api/auth/login         — Login, returns JWT
  GET    /api/auth/me            — Get current user (protected)
  PUT    /api/auth/profile       — Update profile (protected)
  GET    /api/auth/users?search= — Search users (protected)

PROJECTS:
  GET    /api/projects           — Get all user's projects
  POST   /api/projects           — Create project
  GET    /api/projects/:id       — Get single project
  PUT    /api/projects/:id       — Update project (admin only)
  DELETE /api/projects/:id       — Delete project (owner only)
  POST   /api/projects/:id/members          — Add member (admin)
  DELETE /api/projects/:id/members/:userId  — Remove member (admin)
  PUT    /api/projects/:id/members/:userId  — Update role (owner)

TASKS:
  GET    /api/tasks/dashboard              — Dashboard statistics
  GET    /api/tasks/project/:projectId     — Get project tasks (filterable)
  POST   /api/tasks/project/:projectId     — Create task
  GET    /api/tasks/project/:projectId/:id — Get single task
  PUT    /api/tasks/project/:projectId/:id — Update task
  DELETE /api/tasks/project/:projectId/:id — Delete task

All endpoints return: { success: boolean, data/message, ... }

--------------------------------------------------------------------------------
DATABASE SCHEMA
--------------------------------------------------------------------------------

USER:
  name (String, required)
  email (String, unique, required)
  password (String, hashed, select:false)
  avatar (String, auto-generated)
  isActive (Boolean)
  timestamps

PROJECT:
  name, description, status, priority, color, dueDate
  owner → ref: User
  members: [{ user → ref: User, role: admin|member, joinedAt }]
  timestamps

TASK:
  title, description, status, priority, dueDate, tags[], order
  project → ref: Project
  assignedTo → ref: User
  createdBy → ref: User
  completedAt (auto-set when status=done)
  Virtual: isOverdue
  timestamps

--------------------------------------------------------------------------------
HOW TO RUN LOCALLY
--------------------------------------------------------------------------------

PREREQUISITES:
  - Node.js v18 or higher
  - MongoDB Atlas account (free tier works)
  - npm v8+

STEP 1 — Clone the repository:
  git clone <your-github-repo-url>
  cd team-task-manager

STEP 2 — Backend setup:
  cd backend
  npm install
  cp .env.example .env
  # Edit .env and fill in:
  #   MONGODB_URI=your_mongodb_atlas_uri
  #   JWT_SECRET=any_random_long_string
  #   FRONTEND_URL=http://localhost:3000
  npm run dev

STEP 3 — Frontend setup (new terminal):
  cd frontend
  npm install
  cp .env.example .env
  # Edit .env:
  #   REACT_APP_API_URL=http://localhost:5000/api
  npm start

  App opens at http://localhost:3000

STEP 4 — Test:
  Register a new account, create a project, add tasks!

--------------------------------------------------------------------------------
HOW TO DEPLOY ON RAILWAY
--------------------------------------------------------------------------------

BACKEND DEPLOYMENT:

  1. Create a MongoDB Atlas cluster (free M0 tier):
     - Go to https://cloud.mongodb.com
     - Create cluster → Connect → get connection string
     - Whitelist IP: 0.0.0.0/0 (allow all for Railway)

  2. Push code to GitHub

  3. Go to https://railway.app → New Project → Deploy from GitHub
     - Select your repo
     - Set Root Directory: backend
     - Add environment variables:
         MONGODB_URI    = mongodb+srv://...
         JWT_SECRET     = (any long random string, e.g. 64 chars)
         JWT_EXPIRES_IN = 7d
         NODE_ENV       = production
         FRONTEND_URL   = https://your-frontend-url.railway.app
     - Railway auto-detects Node.js and runs npm start
     - Get your backend URL (e.g. https://myapp-backend.railway.app)

FRONTEND DEPLOYMENT:

  1. Create another Railway service → New Service → GitHub Repo
     - Set Root Directory: frontend
     - Add environment variable:
         REACT_APP_API_URL = https://your-backend-url.railway.app/api
     - Build Command: npm run build
     - Start Command: npx serve -s build -l $PORT
     - (or use Railway's static site deploy)

  2. Update backend FRONTEND_URL with the frontend Railway URL

  Health check: GET /health on backend should return { status: "ok" }

--------------------------------------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------------------------------------

team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js    Auth logic
│   │   │   ├── projectController.js Project CRUD + team mgmt
│   │   │   └── taskController.js    Task CRUD + dashboard stats
│   │   ├── middleware/
│   │   │   ├── auth.js              JWT protect + role check
│   │   │   └── errorHandler.js      Global error handler
│   │   ├── models/
│   │   │   ├── User.js              User schema (bcrypt hooks)
│   │   │   ├── Project.js           Project + members schema
│   │   │   └── Task.js              Task schema (isOverdue virtual)
│   │   ├── routes/
│   │   │   ├── auth.js              Auth routes + validation
│   │   │   ├── projects.js          Project routes
│   │   │   └── tasks.js             Task routes
│   │   └── server.js                Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js            Sidebar + nav + mobile
│   │   │   ├── TaskCard.js          Kanban task card
│   │   │   ├── TaskModal.js         Create/edit task form
│   │   │   ├── CreateProjectModal.js New project form
│   │   │   └── AddMemberModal.js    Add team member
│   │   ├── context/
│   │   │   └── AuthContext.js       Global auth state
│   │   ├── pages/
│   │   │   ├── Login.js             Login page
│   │   │   ├── Register.js          Register page
│   │   │   ├── Dashboard.js         Stats dashboard
│   │   │   ├── Projects.js          Projects list
│   │   │   └── ProjectDetail.js     Kanban + members + settings
│   │   ├── styles/
│   │   │   └── global.css           Design system + CSS variables
│   │   ├── utils/
│   │   │   └── api.js               Axios config + API functions
│   │   ├── App.js                   Router + protected routes
│   │   └── index.js                 React entry point
│   └── package.json
│
├── .gitignore
├── package.json                     Root scripts
├── railway.json                     Railway deployment config
├── Procfile                         Process file
└── README.txt                       This file

--------------------------------------------------------------------------------
SECURITY CONSIDERATIONS
--------------------------------------------------------------------------------

  - Passwords hashed with bcrypt (cost factor 12)
  - JWT secret stored in environment variable (never in code)
  - All sensitive routes protected with JWT middleware
  - Role checks enforced server-side (not just client-side)
  - Input validation with express-validator on all POST/PUT routes
  - Mongoose schema validation as second layer
  - CORS configured to only allow frontend origin in production
  - User passwords excluded from all API responses (select: false)
  - Token expiry set (7 days by default)

--------------------------------------------------------------------------------
AUTHOR
--------------------------------------------------------------------------------

  Built for internship technical assessment.
  Full-stack implementation: Node.js + Express + MongoDB + React.
  Deployed on Railway with MongoDB Atlas.

================================================================================
