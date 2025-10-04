# Coiffeur Platform

A modern, full-stack coiffeur platform built with Next.js 14, Supabase, and TypeScript. This platform provides appointment booking, payment processing, product management, and comprehensive salon management features.

## 🏗️ Architecture

This is a monorepo built with:

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Payments**: Stripe & SumUp integration
- **Deployment**: Netlify (Frontend) + Supabase (Backend)
- **Monorepo**: PNPM workspaces with Turborepo

## 📁 Project Structure

```
├── apps/
│   └── web/                 # Next.js 14 application
├── packages/
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   └── types/               # Shared TypeScript types
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── policies/            # RLS policies
│   ├── edge/               # Edge functions
│   └── config.toml         # Supabase configuration
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PNPM 8+
- Supabase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coiffeur-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Start Supabase locally**
   ```bash
   pnpm db:start
   ```

5. **Run database migrations**
   ```bash
   pnpm db:reset
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Supabase Studio: http://localhost:54323

## 🗄️ Database Schema

The platform includes comprehensive database schema with:

- **Users & Profiles**: Customer and staff management with role-based access
- **Services & Categories**: Service catalog with pricing and availability
- **Appointments**: Booking system with conflict prevention (EXCLUDE constraint)
- **Products & Orders**: E-commerce functionality for product sales
- **Payments**: Integrated payment tracking for Stripe and SumUp
- **Notifications**: Multi-channel notification system

### Key Features

- **Row Level Security (RLS)**: All tables are secured with comprehensive RLS policies
- **Time Conflict Prevention**: EXCLUDE constraints prevent double-booking
- **Audit Trails**: Automatic timestamp tracking on all entities
- **Soft Deletes**: Status-based deletion rather than hard deletes

## 🔐 Security

- **Row Level Security**: Enforced on all database tables
- **Role-Based Access**: Customer, Staff, Admin, Super Admin roles
- **API Security**: Edge functions with JWT authentication
- **Payment Security**: PCI-compliant payment processing
- **Data Validation**: TypeScript types and database constraints

## 💳 Payment Integration

### Stripe
- Credit/debit card payments
- Subscription billing
- Webhook handling
- Refund management

### SumUp
- Terminal payments
- Mobile payments
- Swiss market optimization
- QR code payments

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev                 # Start development server
pnpm build              # Build all packages
pnpm lint               # Run ESLint
pnpm type-check         # TypeScript type checking
pnpm format             # Format code with Prettier

# Database
pnpm db:start           # Start Supabase locally
pnpm db:stop            # Stop Supabase
pnpm db:reset           # Reset database
pnpm db:migration       # Create new migration
pnpm db:generate        # Generate TypeScript types

# Testing
pnpm test               # Run tests
```

### Code Quality

- **ESLint**: Configured for Next.js and TypeScript
- **Prettier**: Code formatting with Tailwind CSS plugin
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks
- **Lint-staged**: Staged file linting

## 🚦 CI/CD

GitHub Actions workflows for:

- **Continuous Integration**: Lint, type-check, build, test
- **Deployment**: Automated deployment to Netlify
- **Release Management**: Automated releases with changelog generation
- **Security**: Dependency auditing and vulnerability scanning

## 📱 Features

### Customer Features
- Online appointment booking
- Service catalog browsing
- Payment processing
- Appointment management
- Product purchasing
- Notification preferences

### Staff Features
- Appointment calendar
- Customer management
- Service scheduling
- Payment tracking
- Inventory management

### Admin Features
- User management
- Service configuration
- Reporting dashboard
- Payment analytics
- System configuration

## 🌐 Internationalization

- **next-intl**: Multi-language support
- **Supported Languages**: German, English, French, Italian
- **Localized Content**: UI, emails, SMS notifications
- **Currency Support**: CHF, EUR, USD

## 📊 Analytics & Monitoring

- **Google Analytics**: Web analytics
- **Sentry**: Error tracking and performance monitoring
- **Supabase Analytics**: Database and API metrics
- **Custom Dashboards**: Business intelligence reporting

## 🛡️ Compliance

- **GDPR**: European data protection compliance
- **Swiss Data Protection**: Local privacy law compliance
- **PCI DSS**: Payment card industry standards
- **Accessibility**: WCAG 2.1 guidelines

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the coiffeur industry**