# BudgetWise Backend API

A robust Node.js backend API for the BudgetWise application, built with Express, TypeScript, and Supabase.

## 🚀 Features

- **User Authentication**: Secure signup, login, and JWT-based authentication
- **Database Integration**: Supabase PostgreSQL with Row Level Security
- **Type Safety**: Full TypeScript implementation
- **Validation**: Request validation with Joi
- **Security**: Helmet, CORS, rate limiting, and password hashing
- **Error Handling**: Comprehensive error handling and logging
- **API Documentation**: Well-structured RESTful API endpoints

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Run the setup script to create .env file
   npm run setup
   ```
   
   Or manually:
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your Supabase configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:8081
   ```

4. **Database Setup**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Run the SQL script from `database/schema.sql`
   - This will create all necessary tables, indexes, and RLS policies

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Budget Management
- `GET /api/budget/goals` - Get monthly goals
- `POST /api/budget/goals` - Create monthly goal
- `GET /api/budget/transactions` - Get transactions
- `POST /api/budget/transactions` - Create transaction
- `GET /api/budget/history` - Get monthly history

## 🗄️ Database Schema

### Tables
- **users**: User accounts and authentication
- **categories**: Expense categories (default + user-created)
- **monthly_goals**: Monthly budget goals
- **transactions**: Individual expense transactions
- **monthly_history**: Finalized monthly data for history

### Key Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic Timestamps**: Created/updated timestamps
- **Indexes**: Optimized for common queries
- **Foreign Keys**: Referential integrity
- **JSONB**: Flexible storage for complex data

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Row Level Security**: Database-level access control

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── database/
│   └── schema.sql       # Database schema
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: JWT token expiration time
- `CORS_ORIGIN`: Allowed CORS origins

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name budgetwise-api
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## 📊 Monitoring

The API includes:
- Health check endpoint: `GET /health`
- Request logging with Morgan
- Error logging and tracking
- Performance monitoring ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
