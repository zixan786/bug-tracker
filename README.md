# BugTracker - Full-Stack Bug Tracking Application

A comprehensive bug tracking and project management system built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Features

### 🐛 Bug Management
- Create, view, edit, and delete bugs
- Comprehensive bug details (priority, severity, status, type)
- Bug assignment and tracking
- Comments and discussions
- File attachments support
- Advanced filtering and search

### 📊 Project Management
- Create and manage projects
- Team member management
- Project-specific bug tracking
- Project status tracking

### 👥 User Management
- Role-based access control (Admin, Developer, Tester, Viewer)
- User authentication with JWT
- Profile management
- Password management

### 📈 Dashboard & Analytics
- Overview dashboard with statistics
- Recent bugs and projects
- Personal bug assignments
- Project progress tracking

### 🎨 Modern UI/UX
- Material-UI design system
- Responsive design for all devices
- Dark/light theme support
- Intuitive navigation

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Vite** for build tooling

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **TypeORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Zod** for validation

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bugtracker
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

1. **Create PostgreSQL Database:**
```sql
CREATE DATABASE bugtracker;
```

2. **Configure Environment Variables:**

Create `backend/.env` file:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bugtracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Database Migration & Seeding

```bash
# Navigate to backend directory
cd backend

# Run database seeding (creates tables and sample data)
npm run seed
```

This will create sample users with the following credentials:
- **Admin:** admin@bugtracker.com / admin123
- **Developer:** developer@bugtracker.com / dev123
- **Tester:** tester@bugtracker.com / test123
- **Viewer:** viewer@bugtracker.com / view123

## Running the Application

### Development Mode

1. **Start Backend Server:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

2. **Start Frontend Development Server:**
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

3. **Start Both Servers Concurrently:**
```bash
# From root directory
npm run start:dev
```

### Production Build

1. **Build Backend:**
```bash
cd backend
npm run build
npm start
```

2. **Build Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change password
- `DELETE /api/users/:id` - Delete user (Admin only)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/my` - Get my projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Bugs
- `GET /api/bugs` - Get all bugs (with filtering)
- `GET /api/bugs/:id` - Get bug by ID
- `POST /api/bugs` - Create bug
- `PUT /api/bugs/:id` - Update bug
- `DELETE /api/bugs/:id` - Delete bug
- `POST /api/bugs/:id/comments` - Add comment to bug

## Project Structure

```
bugtracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and app configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── models/          # TypeORM entities
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Database scripts
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Main server file
│   ├── .env                 # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API service functions
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store and slices
│   │   ├── styles/          # Global styles and theme
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── .env                 # Environment variables
│   └── package.json
└── package.json             # Root package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please create an issue in the GitHub repository.
