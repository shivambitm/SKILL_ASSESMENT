# Skill Assessment & Reporting Portal - User Guide

## 🚀 Quick Start Guide

### Application Access

- **Frontend:** http://localhost:5173/
- **Backend API:** http://localhost:5000/api/
- **Health Check:** http://localhost:5000/health

### Default Login Credentials

```
Admin Account:
Email: admin@example.com
Password: admin123

User Account:
Email: user@example.com
Password: user123
```

## 👥 User Roles & Capabilities

### 🔑 Regular Users Can:

- ✅ Register new accounts
- ✅ Login and manage profile
- ✅ Take interactive quizzes
- ✅ View personal dashboard with performance metrics
- ✅ Check quiz history and results
- ✅ View leaderboard and compare performance
- ✅ Switch between themes (Light, Dark, Premium, Anime)

### 🔐 Admin Users Can:

- ✅ All user capabilities PLUS:
- ✅ Manage users (view, edit, deactivate)
- ✅ Create and manage skill categories
- ✅ Create, edit, and delete quiz questions
- ✅ View comprehensive system reports
- ✅ Access user performance analytics
- ✅ Monitor system health and statistics

## 🎯 How to Use the Application

### For Regular Users:

1. **Registration & Login**

   - Visit http://localhost:5173/
   - Click "Register" if new user or "Login" if existing
   - Complete the registration form with valid details
   - Login with your credentials

2. **Taking Quizzes**

   - Navigate to "Take Quiz" from the menu
   - Select a skill category (JavaScript, React, Node.js, etc.)
   - Click "Start Quiz" to begin
   - Answer multiple-choice questions within 5 minutes
   - Navigate between questions using Next/Previous buttons
   - Click "Complete Quiz" when finished

3. **Viewing Performance**

   - Dashboard shows your overall performance statistics
   - Quiz History page displays all past attempts
   - Leaderboard shows how you compare with other users
   - Filter results by skill category or time period

4. **Profile Management**
   - Click your name in the header to access profile
   - Edit personal information (name, email)
   - Change password securely
   - View account statistics

### For Admin Users:

1. **User Management**

   - Access "Admin" section from the menu
   - View all registered users
   - Edit user information and roles
   - Activate/deactivate user accounts
   - Filter and search users

2. **Skills Management**

   - Create new skill categories
   - Edit existing skills (name, description, category)
   - Activate/deactivate skills
   - View skill statistics

3. **Questions Management**

   - Create new quiz questions for each skill
   - Edit question text and answer options
   - Set difficulty levels (Easy, Medium, Hard)
   - Assign point values
   - Link questions to skill categories

4. **Reports & Analytics**
   - View system-wide performance reports
   - Identify skill gaps across users
   - Monitor quiz completion rates
   - Generate user performance reports
   - Export data for further analysis

## 🎨 Theme System

The application supports multiple themes:

- **Light Theme:** Clean, minimal design
- **Dark Theme:** Easy on the eyes for night use
- **Premium Theme:** Professional purple-accented design
- **Anime Theme:** Colorful, vibrant interface

Switch themes using the theme switcher in the header.

## 📱 Mobile Compatibility

The application is fully responsive and works on:

- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones
- ✅ All modern browsers

## 🔧 Technical Features

### Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting to prevent abuse

### Performance

- Redis caching for faster responses
- Database query optimization
- Pagination for large datasets
- Lazy loading for better UX

### User Experience

- Real-time feedback and notifications
- Loading states and error handling
- Intuitive navigation
- Accessibility features

## 🐛 Troubleshooting

### Common Issues:

1. **Can't Login**

   - Check if credentials are correct
   - Ensure account is active
   - Try refreshing the page

2. **Quiz Won't Start**

   - Verify skill is selected
   - Check internet connection
   - Ensure questions exist for the skill

3. **Performance Issues**

   - Clear browser cache
   - Disable browser extensions
   - Check network connection

4. **Data Not Loading**
   - Refresh the page
   - Check if backend server is running
   - Verify API endpoints are accessible

### Debug Information:

- Open browser developer tools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Report issues with specific error messages

## 📊 System Architecture

```
Frontend (React) → API Gateway → Backend (Node.js) → Database (SQLite)
                                      ↓
                                  Redis Cache
```

### Key Components:

- **Frontend:** React 18 with TypeScript
- **Backend:** Node.js with Express
- **Database:** SQLite with proper indexing
- **Cache:** Redis for performance optimization
- **Authentication:** JWT tokens
- **Validation:** Joi schemas

## 🚀 Deployment Ready

The application is production-ready with:

- Docker containerization
- Environment-based configuration
- Health monitoring
- Comprehensive logging
- Security best practices

## 📞 Support

For issues or questions:

1. Check this user guide
2. Review the PROJECT_STATUS_REPORT.md
3. Check browser console for errors
4. Contact the development team with specific details

---

**Happy Learning! 🎓**

The Skill Assessment & Reporting Portal is designed to make skill evaluation simple, engaging, and insightful for both learners and administrators.
