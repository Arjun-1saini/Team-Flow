# TeamFlow — Team Task Manager

A full-stack team task manager built with the **MERN stack** (PostgreSQL instead of MongoDB) featuring role-based access control, a Kanban board, real-time dashboards, and an Apple-inspired professional UI.

![TeamFlow](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20PostgreSQL-0a84ff?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-30d158?style=flat-square)

---

## ✨ Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Role-Based Access** — Admin & Member roles with separate UI and permissions
- **Projects** — Create, edit, delete projects with color labels and priorities
- **Kanban Board** — Drag-free visual task management (To Do → In Progress → Review → Done)
- **Task Management** — Create, assign, update, delete tasks with due dates and priorities
- **Team Management** — Admins can add/remove members per project
- **Dashboard** — Live stats: task status pie chart, priority bar chart, recent activity table
- **Comments** — Per-task comment threads
- **Apple-Inspired UI** — SF Pro system fonts, dark theme, glassmorphism, micro-animations

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Recharts, Lucide    |
| Backend    | Node.js, Express.js                 |
| Database   | PostgreSQL + Sequelize ORM          |
| Auth       | JWT + bcryptjs                      |
| Deployment | Railway (backend + PostgreSQL)      |

---

## 📁 Project Structure

```
Team Flow/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── contexts/     # AuthContext, ThemeContext
│   │   ├── components/   # Layout, Sidebar
│   │   ├── pages/        # Dashboard, Projects, Tasks, Profile
│   │   └── lib/          # Axios API client
│   └── vite.config.js
│
├── server/               # Express backend
│   ├── config/           # Sequelize DB connection
│   ├── controllers/      # Auth, Projects, Tasks
│   ├── middleware/        # JWT protect, validation
│   ├── models/           # User, Project, Task, Comment, ProjectMember
│   ├── routes/           # REST API routes
│   └── index.js          # Entry point
│
├── package.json          # Root scripts (runs both servers)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/team-flow.git
cd team-flow
```

### 2. Install dependencies
```bash
npm install          # installs root + server + client deps
```

### 3. Set up PostgreSQL
```bash
psql postgres -c "CREATE DATABASE teamflow;"
```

### 4. Configure environment
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5001
DATABASE_URL=postgresql://postgres:@localhost:5432/teamflow
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 5. Run the app
```bash
npm run dev
```
- **Frontend** → http://localhost:5174  
- **Backend**  → http://localhost:5001

> Sequelize auto-creates all tables on first boot.

---

## 🌐 Deployment on Railway

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full Railway deployment guide.

**Quick summary:**
1. Push this repo to GitHub
2. Create a new Railway project → add PostgreSQL plugin
3. Deploy `server/` as a Node.js service
4. Deploy `client/` as a Static site (after `npm run build`)
5. Set `DATABASE_URL` from Railway's PostgreSQL connection string

---

## 🔑 Default Roles

| Role   | Permissions                                              |
|--------|----------------------------------------------------------|
| Admin  | Create/delete projects, manage team members, all tasks   |
| Member | View projects they're added to, create & update tasks    |

---

## 📸 Pages

- `/login` — Sign in  
- `/register` — Create account  
- `/dashboard` — Stats overview with charts  
- `/projects` — Project grid (admin: create/delete)  
- `/projects/:id` — Kanban board + team  
- `/tasks` — My tasks with filters  
- `/profile` — Update name, email, avatar  

---

## 📄 License

MIT © 2025 Arjun Saini
