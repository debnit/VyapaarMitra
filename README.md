
# VyapaarMitra - MSME Lifecycle Management Platform

VyapaarMitra is a comprehensive platform providing services to MSMEs (Micro, Small & Medium Enterprises) across their entire lifecycle.

## Services Offered

### 1. MSMEBazaar - Onboarding Service (₹199)
- MSME registration and compliance with Government of India
- Loan facilitation with NBFCs/Banks
- Raw material procurement assistance
- Market visibility enhancement

### 2. Navarambh - Exit as a Service
- Financial restructuring for distressed MSMEs
- Asset optimization and liquidation
- Business transfer facilitation
- Closure assistance

### 3. Agent Hub
- Broker negotiation platform
- Agent management system
- Commission tracking

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT
- **Payments**: Razorpay
- **Domain**: vyapaarmitra.in

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### MSME Bazaar
- `POST /api/msme-bazaar/onboard` - MSME onboarding
- `GET /api/msme-bazaar/profile` - Get MSME profile
- `POST /api/msme-bazaar/payment` - Process onboarding payment

### Navarambh (Exit Services)
- `POST /api/navarambh/case` - Create exit case
- `GET /api/navarambh/cases` - Get cases
- `GET /api/navarambh/exit-strategies` - Get exit strategies

### Agent Hub
- `POST /api/agent-hub/register` - Agent registration
- `GET /api/agent-hub/deals` - Get agent deals
- `POST /api/agent-hub/negotiate` - Create negotiation

### Compliance
- `GET /api/compliance/types` - Get compliance types
- `POST /api/compliance/track` - Track compliance

### Loans
- `POST /api/loans/apply` - Apply for loan
- `GET /api/loans/applications` - Get loan applications

### Procurement
- `POST /api/procurement/request` - Create procurement request
- `GET /api/procurement/requests` - Get requests
- `POST /api/procurement/quotes` - Submit quote

## Environment Variables

Create a `.env` file with:

```
NODE_ENV=production
PORT=5000
DOMAIN=vyapaarmitra.in

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vyapaarmitra
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=vyapaarmitra

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Initialize database: `node scripts/init-db.sql`
5. Start the server: `node server.js`

## Database Schema

The platform uses PostgreSQL with the following main tables:
- `users` - User accounts
- `msme_profiles` - MSME business profiles
- `agent_profiles` - Agent profiles
- `navarambh_cases` - Exit service cases
- `loan_applications` - Loan applications
- `procurement_requests` - Raw material requests
- `compliance_tracking` - Compliance monitoring

## Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection prevention

## Scalability Features

- Redis caching
- Connection pooling
- Structured logging
- Error handling middleware
- Domain-based routing

## License

MIT License

## Contact

For support: support@vyapaarmitra.in
Website: https://vyapaarmitra.in
