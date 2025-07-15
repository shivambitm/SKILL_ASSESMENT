# Skill Assessment & Reporting Portal

A comprehensive web-based system for skill assessment through quizzes, user management, and detailed reporting. Built with React, Node.js, Express, and MySQL.

## Features

### User Features

- **User Registration & Authentication**: Secure JWT-based authentication
- **Interactive Quizzes**: Take skill-based multiple-choice quizzes
- **Performance Tracking**: View detailed quiz history and performance analytics
- **Leaderboard**: Compare performance with other users
- **Personal Dashboard**: Overview of achievements and progress

### Admin Features

- **User Management**: Full CRUD operations for user accounts
- **Skill Management**: Create and manage skill categories
- **Question Management**: Add, edit, and organize quiz questions
- **Comprehensive Reports**: User performance, skill gaps, and system analytics
- **Real-time Analytics**: Dashboard with charts and statistics

### Technical Features

- **Role-based Access Control**: Admin and user roles with appropriate permissions
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live performance tracking
- **Secure APIs**: JWT authentication and input validation
- **Database Optimization**: Proper indexing and query optimization
- **Caching**: Redis integration for improved performance
- **Testing**: Unit tests for backend routes
- **Docker Support**: Containerized deployment

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Tanstack Query** for data fetching
- **Lucide React** for icons

### Backend

- **Node.js** with Express
- **TypeScript** for type safety
- **MySQL** database with proper schema design
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Redis** for caching
- **Joi** for input validation
- **Jest** for testing

### DevOps

- **Docker** containerization
- **Docker Compose** for multi-service setup
- **Environment-based configuration**
- **Health checks** and monitoring

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Redis (optional, for caching)
- npm or yarn

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/shivambitm/SKILL_ASSESMENT.git
   or can use SSH -> git clone https://github.com/shivambitm/SKILL_ASSESMENT.git
   cd SKILL_ASSESMENT
   ```

2. **Install dependencies**

   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Configuration**

   Create `backend/.env` file:

   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=skill_assessment

   # Redis Configuration (optional)
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**

   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE skill_assessment;

   # Run migrations (automatically handled by the app)
   cd backend
   npm run dev
   ```

5. **Seed Database** (Optional)

   ```bash
   cd backend
   npm run seed
   ```

6. **Start Development Servers**

   ```bash
   # Start both frontend and backend
   npm run dev:full

   # You will see like this in the Terminal
   hp@DESKTOP-HICFBA3 MINGW64 /f/SKILL_ASSESMENT (feature/fix-errors)
   $ npm run dev
   ```

> skill-assessment-frontend@1.0.0 dev
> node scripts/dev.js

════════════════════════════════════════════════════════════════════════════════
🚀 SKILL ASSESSMENT PORTAL - DEVELOPMENT MODE
Full-Stack Development Environment
⏱ Started at 14:24:10
════════════════════════════════════════════════════════════════════════════════

💻 Frontend Dev Server: http://localhost:5173
🗄 Backend API Server: http://localhost:5002
⚡ Hot Reload: Enabled

Press Ctrl+C to stop all servers
────────────────────────────────────────────────────────────────────────────────

[14:24:11] [BACKEND] [nodemon] 3.1.10
[14:24:11] [BACKEND] [nodemon] to restart at any time, enter `rs`
[14:24:11] [BACKEND] [nodemon] watching extensions: ts,json
[14:24:11] [BACKEND] [nodemon] starting `ts-node --transpile-only src/server.ts src/server.ts`
[14:24:11] [FRONTEND] ✅ VITE v6.3.5 ready in 421 ms
[14:24:11] [FRONTEND] ➜ Local: http://localhost:5173/
[14:24:11] [FRONTEND] ➜ Network: use --host to expose
[14:24:12] [BACKEND] Environment: development
[14:24:12] [BACKEND] Development mode: Rate limiting is relaxed
[14:24:12] [BACKEND] Auth routes module loaded
[14:24:13] [BACKEND] Starting server in development environment
[14:24:13] [BACKEND] Mounting auth routes...
[14:24:13] [BACKEND] All routes mounted successfully
[14:24:13] [BACKEND] ✅ Database connected successfully
[14:24:13] [BACKEND] Database migrations completed successfully
[14:24:13] [BACKEND] Connecting to Redis...
[14:24:13] [BACKEND] Redis connection skipped in development mode
[14:24:13] [BACKEND] Server running on port 5002
[14:24:13] [BACKEND] Rate limiting: Relaxed (Development)
[14:24:22] [FRONTEND] Browserslist: caniuse-lite is outdated. Please run:
[14:24:22] [FRONTEND] npx update-browserslist-db@latest
[14:24:22] [FRONTEND] Why you should do it regularly: https://github.com/browserslist/update-db#readme

# Or start individually

# Backend

cd backend && npm run dev

# Frontend

npm run dev

````

### Production Deployment

#### Using Docker

1. **Build and start services**

```bash
cd backend
docker-compose up -d
````

2. **Build frontend**
   ```bash
   npm run build
   ```

#### Manual Deployment

1. **Build backend**

   ```bash
   cd backend
   npm run build
   ```

2. **Build frontend**

   ```bash
   npm run build
   ```

3. **Start production server**
   ```bash
   cd backend
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register a new user

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST /api/auth/login

Login user

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me

Get current user (requires authentication)

### Quiz Endpoints

#### GET /api/skills

Get all available skills

- Query params: `page`, `limit`, `search`, `category`, `isActive`

#### POST /api/quiz/start

Start a new quiz

```json
{
  "skillId": 1
}
```

#### POST /api/quiz/answer

Submit an answer

```json
{
  "quizAttemptId": 1,
  "questionId": 1,
  "selectedAnswer": "A",
  "timeTaken": 30
}
```

#### POST /api/quiz/complete

Complete quiz

```json
{
  "quizAttemptId": 1,
  "timeTaken": 300
}
```

### Admin Endpoints (requires admin role)

#### GET /api/users

Get all users with pagination and filtering

#### POST /api/skills

Create new skill

```json
{
  "name": "JavaScript",
  "description": "JavaScript fundamentals",
  "category": "Programming"
}
```

#### POST /api/questions

Create new question

```json
{
  "skillId": 1,
  "questionText": "What is JavaScript?",
  "optionA": "Programming language",
  "optionB": "Database",
  "optionC": "Web server",
  "optionD": "Operating system",
  "correctAnswer": "A",
  "difficulty": "easy",
  "points": 1
}
```

### Reports Endpoints

#### GET /api/reports/user/:userId

Get user performance report

- Query params: `period` (all, week, month)

#### GET /api/reports/skill-gaps

Get skill gap analysis (admin only)

#### GET /api/reports/overview

Get system overview (admin only)

#### GET /api/reports/leaderboard

Get user leaderboard

- Query params: `period`, `skillId`, `limit`

## Database Schema

### Users Table

- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `first_name`
- `last_name`
- `role` (admin/user)
- `is_active`
- `created_at`
- `updated_at`

### Skills Table

- `id` (Primary Key)
- `name`
- `description`
- `category`
- `is_active`
- `created_at`
- `updated_at`

### Questions Table

- `id` (Primary Key)
- `skill_id` (Foreign Key)
- `question_text`
- `option_a`, `option_b`, `option_c`, `option_d`
- `correct_answer`
- `difficulty`
- `points`
- `is_active`
- `created_at`
- `updated_at`

### Quiz Attempts Table

- `id` (Primary Key)
- `user_id` (Foreign Key)
- `skill_id` (Foreign Key)
- `total_questions`
- `correct_answers`
- `score_percentage`
- `time_taken`
- `started_at`
- `completed_at`

### Quiz Answers Table

- `id` (Primary Key)
- `quiz_attempt_id` (Foreign Key)
- `question_id` (Foreign Key)
- `selected_answer`
- `is_correct`
- `time_taken`
- `created_at`

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
npm test
```

## Default Credentials

After seeding the database:

**Admin Account:**

- Email: admin@example.com
- Password: admin123

**User Account:**

- Email: user@example.com
- Password: user123

## Performance Optimizations

1. **Database Indexing**: Strategic indexes on frequently queried columns
2. **Redis Caching**: Caching for reports and skill data
3. **Query Optimization**: Efficient database queries with proper joins
4. **Pagination**: All list endpoints support pagination
5. **Rate Limiting**: API rate limiting to prevent abuse

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcryptjs with salt rounds
3. **Input Validation**: Joi schema validation
4. **CORS Protection**: Configurable CORS origins
5. **Helmet**: Security headers
6. **Rate Limiting**: Request rate limiting
7. **SQL Injection Prevention**: Parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

What's Now Working:
✅ Profile Display: Users can view their profile information
✅ Profile Editing: Users can edit their first name, last name, and email
✅ Real-time Updates: The user context is updated when profile changes are saved
✅ Validation: Prevents duplicate emails and validates required fields
✅ Password Visibility: Eye icon to toggle password visibility
✅ Copy Functionality: Copy button for passwords
✅ Navigation: Profile accessible from header dropdown and sidebar
🚀 Test the Profile Page:
Login with demo credentials:

Email: admin@example.com
Password: admin123
Access Profile:

Click your name in the header → "Profile Settings"
Or click "Profile" in the sidebar
Or visit: {frontend_URL}/profile
Edit Profile:

Click "Edit" button
Change first name, last name, or email
Click "Save" - you should see "Profile updated successfully!"
Change Password:

Click "Change Password"
Enter current password: admin123
Enter new password and confirmation
Click "Update Password"
🔐 Available Test Accounts:
Admin: admin@example.com / admin123
User: user@example.com / user123
Your User: studyhardshivam@gmail.com / nCxYq4VyVd.A9GV
The profile page is now fully functional! 🎉
