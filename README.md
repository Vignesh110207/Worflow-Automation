# FlowForge Advanced

A full-stack workflow automation platform built with **Spring Boot** (backend) and **React + Vite** (frontend). Supports role-based access control, multi-step workflow execution, approvals, audit logs, and real-time execution tracking.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3, Spring Security, JWT |
| Frontend | React 18, Vite, React Router |
| Database | MySQL 8 |
| Auth | JWT (role-based: admin / developer / user) |

---

## Features

- **Role-based access** — Admin, Developer, User roles with protected routes
- **Workflow builder** — Create multi-step workflows with task, approval, and notification steps
- **Execution engine** — Trigger workflows manually, track status in real time
- **Approval flows** — Pause execution at approval steps, approve or reject
- **Execution logs** — Per-step log entries with level filtering (info / success / warn / error)
- **Audit logs** — Every user action logged with name, email, role, and IP
- **Admin panel** — Manage users, view system stats, promote/demote roles
- **Secure registration** — New accounts are always created as `user` role; only admins can assign elevated roles

---

## Project Structure

```
flowise-spring/
├── backend/          # Spring Boot API (port 8080)
│   └── src/main/java/com/flowise/
│       ├── controller/   # REST endpoints
│       ├── service/      # Business logic
│       ├── entity/       # JPA entities
│       ├── repository/   # Spring Data repos
│       ├── security/     # JWT filter + util
│       └── config/       # Security config + data seeder
└── frontend/         # React + Vite app (port 5173)
    └── src/
        ├── pages/        # Auth, Dashboard, Workflows, Admin
        ├── components/   # Layout, common UI components
        ├── context/      # AuthContext (JWT state)
        └── services/     # Axios API calls
```

---

## Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/flowise-spring.git
cd flowise-spring
```

### 2. Configure the database

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/flowise_advanced?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
```

### 3. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`. On first run, three demo users are seeded automatically.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@flowforge.com | admin123 |
| Developer | dev@flowforge.com | dev123 |
| User | user@flowforge.com | user123 |

---

## API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public (creates user role only) |
| GET | `/api/auth/me` | Authenticated |
| GET/POST | `/api/workflows` | Developer, Admin |
| POST | `/api/workflows/:id/execute` | All roles |
| GET | `/api/executions` | Developer, Admin |
| POST | `/api/executions/:id/approve` | Assigned user, Admin |
| POST | `/api/executions/:id/retry` | Developer, Admin |
| GET | `/api/executions/logs` | Developer, Admin |
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/audit-logs` | Admin |

---

## Sample Workflow

**Employee Onboarding** — a 3-step workflow to try right away:

1. **Create the workflow** — log in as Developer → Workflows → New Workflow
   - Name: `Employee Onboarding`
   - Add 3 steps: IT Setup → Manager Approval → Send Welcome

2. **Execute it** — log in as User → User Workflows → Execute
   - Fill in employee details and submit

3. **Approve** — log in as Admin → Executions → find the run → click Approve

4. **Monitor** — Sidebar → Execution Logs to see every step logged in real time

---

## Environment Notes

- JWT secret is configured in `application.properties` — change it before deploying to production
- The Vite dev server proxies `/api` to `localhost:8080` automatically (see `vite.config.js`)
- Database schema is auto-created by Hibernate (`spring.jpa.hibernate.ddl-auto=update`)

---

## License

MIT
