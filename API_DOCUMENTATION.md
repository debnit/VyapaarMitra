
# VyapaarMitra API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-app.replit.app/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication Routes (`/api/auth`)

#### POST /register
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210",
  "role": "msme_owner"
}
```

#### POST /login
Login existing user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### MSME Bazaar Routes (`/api/msme-bazaar`)

#### POST /onboard
Complete MSME onboarding (₹199 fee)
```json
{
  "businessName": "ABC Manufacturing",
  "businessType": "Manufacturing",
  "gstNumber": "27AABCU9603R1ZM",
  "udyamNumber": "UDYAM-OD-06-0123456",
  "industrySector": "Textiles",
  "businessAddress": "123 Industrial Area",
  "city": "Bhubaneswar",
  "state": "Odisha",
  "pincode": "751024",
  "annualTurnover": 5000000,
  "employeeCount": 25
}
```

#### GET /profile
Get MSME profile details

#### PUT /profile
Update MSME profile

### Loan Routes (`/api/loans`)

#### GET /lenders
Get available lenders and their terms

#### POST /apply
Submit loan application
```json
{
  "loanType": "working_capital",
  "requestedAmount": 500000,
  "purpose": "Working capital for inventory purchase",
  "documents": {}
}
```

#### GET /applications
Get user's loan applications

### Compliance Routes (`/api/compliance`)

#### GET /requirements
Get compliance requirements for MSME

#### POST /track
Add compliance tracking item
```json
{
  "requirementType": "gst_filing",
  "description": "Monthly GST filing for March 2024",
  "dueDate": "2024-04-20",
  "status": "pending"
}
```

#### GET /track
Get compliance tracking items

#### PUT /track/:id
Update compliance status

### Procurement Routes (`/api/procurement`)

#### POST /request
Submit procurement request
```json
{
  "materialType": "raw_material",
  "specifications": "Cotton fabric, 100% pure",
  "quantity": 1000,
  "unit": "meters",
  "targetPrice": 50,
  "deliveryLocation": "Bhubaneswar, Odisha",
  "urgency": "medium"
}
```

#### GET /requests
Get procurement requests

#### GET /suppliers
Get available suppliers

### Navarambh Routes (`/api/navarambh`)

#### POST /case
Submit distressed business case
```json
{
  "businessIssue": "financial_distress",
  "description": "Unable to meet loan obligations due to market downturn",
  "financialDetails": {
    "totalDebt": 2000000,
    "monthlyRevenue": 150000,
    "assets": 3000000
  },
  "urgency": "high"
}
```

#### GET /cases
Get cases (for owners) or assigned cases (for consultants)

### Agent Hub Routes (`/api/agent-hub`)

#### POST /register
Register as an agent
```json
{
  "agentType": "loan_broker",
  "specialization": "MSME Loans",
  "experience": 5,
  "serviceAreas": ["Odisha", "West Bengal"],
  "commissionRate": 2.5,
  "certifications": ["CIBIL Certified", "Banking Diploma"]
}
```

#### GET /opportunities
Get available opportunities for agents

### Dashboard Routes (`/api/dashboard`)

#### GET /metrics
Get dashboard overview with key metrics

## Error Responses
All errors follow this format:
```json
{
  "error": "Error message",
  "details": "Additional error details (in development mode)"
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
