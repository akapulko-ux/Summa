
# Summa - Subscription Management Platform

A comprehensive subscription management platform with cashback system, analytics dashboard, and Telegram bot integration.

## 🎯 Project Purpose

Summa is a full-stack web application designed to help businesses manage customer subscriptions, track service usage, and provide cashback rewards. The platform includes administrative tools for service management, user analytics, automated reporting, and Telegram bot integration for customer notifications.

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling
- **Radix UI** for accessible component primitives
- **React Query (TanStack Query)** for data fetching and caching
- **React Hook Form** with Zod validation
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** as primary database
- **PDFKit** for report generation
- **Node-cron** for scheduled tasks

### Infrastructure & Tools
- **Replit** for hosting and deployment
- **Telegram Bot API** for notifications
- **File upload handling** with Multer
- **Authentication** with session management
- **Automated backups** with cron jobs

## 📋 Key Features

### 🔐 Authentication & Authorization
- Secure user authentication system
- Role-based access control (Admin/User)
- Session management
- Protected routes

### 👥 User Management
- User registration and profile management
- Telegram integration for notifications
- Custom user fields and metadata
- Activity tracking

### 🛍 Service Management
- Create and manage subscription services
- Custom fields for each service
- Service icons and descriptions
- Cashback and commission settings
- Service analytics

### 📊 Subscription Management
- Create and track user subscriptions
- Subscription status management
- Payment tracking
- Custom subscription fields
- Bulk operations

### 📈 Analytics Dashboard
- Real-time statistics and metrics
- User activity analytics
- Service popularity tracking
- Revenue and commission reports
- Interactive charts and graphs
- Trend analysis

### 📄 Reporting System
- Generate PDF, Excel, and CSV reports
- Multiple report types (subscriptions, users, services, financial, trends)
- Scheduled report generation
- Multi-language support (English/Russian)
- Download and email reports

### 🤖 Telegram Bot Integration
- Automated customer notifications
- Subscription reminders
- Custom notification templates
- Real-time message delivery
- Bot management interface

### 💾 Backup & Recovery
- Automated daily database backups
- Manual backup creation
- Backup metadata tracking
- Recovery tools

### 🌐 Internationalization
- Multi-language support (English/Russian)
- Language switcher
- Localized date and number formats

### 🎨 UI/UX Features
- Responsive design for all devices
- Dark/Light theme support
- Smooth animations and transitions
- Loading states and error handling
- Toast notifications
- Mobile-friendly navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Telegram Bot Token (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/akapulko-ux/Summa.git
cd Summa
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_postgresql_connection_string
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

4. **Initialize the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Deployment

1. **Build the application**
```bash
npm run build
```

2. **Start production server**
```bash
npm start
```

## 📁 Project Structure

```
Summa/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and API clients
│   │   └── providers/      # Context providers
├── server/                 # Backend Express application
│   ├── routes/             # API route handlers
│   ├── reports/            # Report generation service
│   ├── telegram/           # Telegram bot integration
│   ├── backup/             # Backup management
│   ├── notifications/      # Notification system
│   └── middleware/         # Express middleware
├── shared/                 # Shared TypeScript schemas
├── uploads/                # File upload storage
├── reports/                # Generated reports
└── backups/                # Database backups
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## 🌟 Key Components

### Admin Dashboard
- Real-time analytics and metrics
- User and service management
- System monitoring and performance
- Backup management

### Client Interface
- Service browsing and subscription
- Personal subscription management
- Payment tracking
- Notifications

### Reporting Engine
- Automated report generation
- Multiple export formats
- Scheduled delivery
- Custom date ranges

### Telegram Integration
- Automated notifications
- Custom message templates
- Real-time delivery status
- Bot configuration

## 📊 Database Schema

The application uses PostgreSQL with Drizzle ORM. Key entities include:

- **Users** - User accounts and profiles
- **Services** - Available subscription services
- **Subscriptions** - User subscription records
- **Transactions** - Payment and cashback tracking
- **Notifications** - Message templates and delivery logs
- **Backups** - Backup metadata and scheduling

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure session management
- Rate limiting
- File upload restrictions

## 🚀 Performance Optimizations

- Database query optimization
- Response caching
- Image optimization
- Lazy loading
- Code splitting
- Database indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the GitHub repository.

## 🔮 Future Enhancements

- Mobile application
- Advanced analytics and ML insights
- Integration with payment gateways
- Multi-tenant architecture
- Advanced notification channels
- API rate limiting and quotas

---

Built with ❤️ using modern web technologies on Replit.
