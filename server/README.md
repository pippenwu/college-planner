# CollegeGPT API Server

This is the backend server for CollegeGPT, providing APIs for beta code verification, payment processing, and report generation.

## Overview

The server provides the following features:
- Beta code verification
- JWT-based authentication
- Payment processing with KryptoGO
- Report generation with OpenAI
- PDF generation

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```
cd server
npm install
```

3. Create a `.env` file in the server directory with the following variables:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key
KRYPTOGO_CLIENT_ID=your_kryptogo_client_id
KRYPTOGO_API_SECRET=your_kryptogo_api_secret
BETA_CODE=betatester2024
```

4. Start the server:
```
npm start
```

For development with hot reloading:
```
npm run dev
```

## API Endpoints

### Auth Routes

- `POST /api/auth/verify-beta` - Verify beta code and get JWT token
- `GET /api/auth/validate-token` - Validate JWT token

### Payment Routes

- `POST /api/payment/initialize` - Initialize a payment with KryptoGO
- `POST /api/payment/verify` - Verify a payment with KryptoGO
- `POST /api/payment/webhook` - Receive payment status webhooks from KryptoGO
- `GET /api/payment/:paymentId` - Get payment status

### Report Routes

- `POST /api/report/generate` - Generate a report with OpenAI
- `GET /api/report/:reportId` - Get a generated report (limited or full based on payment)
- `GET /api/report/:reportId/pdf` - Download report as PDF (requires payment)

## Security

This server includes basic security measures:
- JWT-based authentication
- Authorization middleware
- Input validation
- API key protection

For production use, additional security measures should be implemented:
- Rate limiting
- IP filtering
- Enhanced logging and monitoring
- HTTPS enforcement
- Database integration for persistent storage

## Current Limitations

This is a simple Express server with in-memory storage:
- All data is stored in memory and will be lost on server restart
- For production use, integrate with a database
- Actual KryptoGO API calls are mocked - update with real API integration

## License

MIT 