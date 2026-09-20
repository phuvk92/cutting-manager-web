# Cutting Manager Web

Enterprise React + TypeScript web frontend for the **Cutting Admin / SVG Manager** system.

---

## 1. Projects Overview

| Component | Path | Description |
|---|---|---|
| **Backend** | `/Users/phuvk/IdeaProjects/cutting-admin` | Spring Boot 3 + PostgreSQL + Spring Security JWT |
| **Frontend** | `/Users/phuvk/IdeaProjects/cutting-manager-web` | React 19 + TypeScript + Vite + Ant Design + Zustand |

---

## 2. Requirements

* **Node.js**: `>= 20.0.0`
* **npm**: `>= 10.0.0`
* **Backend**: Spring Boot server running on `http://localhost:8080` (or via Docker Compose)

---

## 3. Technology Stack

* **Core**: React 19, TypeScript (Strict mode), Vite
* **UI Framework**: Ant Design (`antd` v6), `@ant-design/icons`
* **State Management**: Zustand
* **Routing**: React Router v7 with protected routes & code splitting
* **HTTP Client**: Axios with centralized request/response interceptors & silent token refresh
* **Form Handling**: React Hook Form + Zod validation resolvers
* **Utility**: Day.js for date formatting
* **Code Quality**: ESLint, Prettier, Oxlint
* **Deployment**: Multi-stage Dockerfile + Nginx reverse proxy

---

## 4. Getting Started

### 4.1. Install Dependencies

```bash
cd /Users/phuvk/IdeaProjects/cutting-manager-web
npm install
```

### 4.2. Local Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`. API requests (`/api/*`) are proxied automatically to `http://localhost:8080`.

### 4.3. Type Checking & Code Quality

```bash
# Type check without emitting files
npm run typecheck

# Lint source code
npm run lint

# Format code with Prettier
npm run format
```

### 4.4. Production Build & Preview

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 5. Environment Variables

The application uses Vite environment variables configured in `.env.development` and `.env.production`:

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the Spring Boot backend REST API |

* `.env.development`: Points to `http://localhost:8080`
* `.env.production`: Proxied via relative path (`/api`) through Nginx

---

## 6. Authentication & Roles

### Default Seeded Admin Credentials

* **Username**: `admin`
* **Password**: `Password123!`

### Role Permissions Matrix

| Feature | ADMIN | AGENT | USER |
|---|:---:|:---:|:---:|
| **Dashboard** | Full stats & cards | Agent stats | Basic user stats |
| **View / Search SVGs** | Yes | Yes | Yes |
| **Preview SVG** | Yes | Yes | Yes |
| **Download SVG** | Yes | Yes | Yes |
| **Upload SVG** | Yes | Yes | No |
| **Delete SVG** | Yes | No | No |
| **User Management (`/users`)** | Full CRUD | No | No |
| **Audit Logs & Health (`/audit`)** | Full View | No | No |

---

## 7. Security Features

* **JWT Access & Refresh Flow**: Automatic Bearer token header attachment and queued silent token refresh upon 401 expiration.
* **Safe SVG Rendering**: Safe inline previewing using isolated object rendering to prevent arbitrary DOM XSS execution.
* **Input Validation**: Client-side validation using Zod schemas matching backend constraints.
* **No Secrets Committed**: Sensitive configuration managed through environment variables and backend authorization checks.

---

## 8. Docker Deployment

### 8.1. Build Docker Image

```bash
docker build -t cutting-manager-web:latest .
```

### 8.2. Run Docker Container

```bash
docker run -d \
  -p 80:80 \
  --name cutting-manager-web \
  cutting-manager-web:latest
```

### 8.3. Docker Compose Integration

To run both backend and frontend together with Docker Compose:

```yaml
version: '3.8'

services:
  svg-postgres:
    image: postgres:16-alpine
    container_name: svg-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: svg_manager
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  cutting-admin:
    build:
      context: ../cutting-admin
      dockerfile: Dockerfile
    container_name: cutting-admin
    restart: unless-stopped
    depends_on:
      - svg-postgres
    ports:
      - "8080:8080"
    environment:
      SERVER_PORT: 8080
      DB_URL: jdbc:postgresql://svg-postgres:5432/svg_manager
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
      FILE_STORAGE_PATH: /data/svg

  cutting-manager-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cutting-manager-web
    restart: unless-stopped
    depends_on:
      - cutting-admin
    ports:
      - "80:80"

volumes:
  postgres-data:
  svg-data:
```

---

## 9. Project Directory Structure

```text
cutting-manager-web/
├── public/                     # Static assets
├── src/
│   ├── assets/                 # App assets & media
│   ├── components/
│   │   ├── common/             # PageHeader, RoleTag, StatusTag, LoadingState, etc.
│   │   ├── layout/             # AppHeader, AppSidebar, AppFooter
│   │   └── svg/                # SafeSvgViewer
│   ├── constants/              # Auth, Storage keys, API endpoints
│   ├── features/
│   │   ├── auth/               # LoginForm, RegisterForm
│   │   ├── dashboard/          # DashboardOverview & stats widgets
│   │   ├── svg/                # SvgList, SvgUploadModal, SvgPreviewModal, SvgDetailDrawer
│   │   ├── users/              # UserList, UserModal
│   │   └── audit/              # AuditLogView & health monitor
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # MainLayout, AuthLayout
│   ├── pages/                  # Route page views
│   ├── routes/                 # ProtectedRoute, AppRoutes
│   ├── services/
│   │   ├── api/                # axiosClient & interceptors
│   │   ├── auth/               # authService
│   │   ├── svg/                # svgService
│   │   ├── users/              # userService
│   │   └── audit/              # auditService
│   ├── stores/                 # Zustand auth store
│   ├── types/                  # Strict TypeScript contracts & DTOs
│   ├── utils/                  # Formatters, Error handling, Security
│   ├── App.tsx                 # Root React component & Ant Design Theme
│   ├── main.tsx                # React DOM entrypoint
│   └── vite-env.d.ts           # Vite TypeScript definitions
├── .env.development            # Local development env
├── .env.production             # Production env
├── .env.example                # Example env
├── Dockerfile                  # Multi-stage production build
├── nginx.conf                  # Nginx configuration with proxy & SPA routing
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
└── README.md
```
