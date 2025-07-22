# Skill Assessment Project

## Overview
The Skill Assessment project is designed to provide a platform for assessing skills through a web application. It consists of a frontend built with a modern JavaScript framework and a backend powered by Node.js.

## Project Structure
```
SKILL_ASSESMENT
├── src              # Contains the source code for the application
├── frontend         # Frontend code (React, Vue, or Angular)
├── backend          # Backend code (Express or another Node.js framework)
├── render.yaml      # Configuration for deployment on Render
└── README.md        # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version X.X.X or higher)
- npm (version X.X.X or higher)
- A Redis server (if using Redis)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/shivambitm/SKILL_ASSESMENT.git
   cd SKILL_ASSESMENT
   ```

2. Install dependencies for the backend:
   ```
   cd backend
   npm install
   ```

3. Install dependencies for the frontend:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application
To run the backend:
```
cd backend
npm start
```

To run the frontend:
```
cd frontend
npm start
```

### Deployment
The project is configured for deployment on Render using the `render.yaml` file. This file specifies the services for both the frontend and backend, including environment variables and build commands.

### Environment Variables
Make sure to set the following environment variables in your deployment configuration:
- `NODE_ENV`: Set to `production`
- `PORT`: The port for the backend (default is `5000`)
- `JWT_SECRET`: Your JWT secret key
- `JWT_EXPIRE`: Token expiration time (default is `7d`)
- `DB_PATH`: Path to the database
- `REDIS_HOST`: Redis host (default is `localhost`)
- `REDIS_PORT`: Redis port (default is `6379`)
- `CORS_ORIGIN`: Allowed origins for CORS
- `VITE_API_URL`: API URL for the frontend
- Rate limiting settings as needed
- Redis settings if applicable

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.