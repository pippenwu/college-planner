# CollegeGPT - College Application Planner

CollegeGPT is a web application that helps students plan their college applications by generating personalized timelines and recommendations based on their academic profile.

## Project Structure

The project consists of two main parts:
- `server/` - Express backend that handles sensitive operations
- `src/` - React frontend for user interaction

## Features

- Generate personalized college application plans
- Interactive timeline visualization
- PDF report generation
- Payment processing with KryptoGO
- Beta code access for testing

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- API keys for OpenAI and KryptoGO

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collegegpt.git
cd collegegpt
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

4. Create the backend `.env` file in the `server` directory:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this_in_production
OPENAI_API_KEY=your_openai_api_key
KRYPTOGO_CLIENT_ID=your_kryptogo_client_id
KRYPTOGO_API_SECRET=your_kryptogo_api_secret
BETA_CODE=betatester2024
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a separate terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal)

## Deployment

The application is designed to be easily deployed to platforms like Vercel or Netlify for the frontend, and services like Heroku or Railway for the backend.

## Security Considerations

This project now implements several security best practices:
- JWT-based authentication
- Server-side payment verification
- Secure storage of API keys
- No client-side persistence of sensitive data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- OpenAI API
- HTML2PDF.js for PDF generation

## Project Structure

- `src/components` - React components including the student profile form
- `src/services` - Service layer for API calls to OpenAI
- `src/utils` - Utility functions including PDF generation
- `src/lib` - Shared utilities like class name merging
- `src/components/ui` - Reusable UI components built with Tailwind

## License

MIT

## Acknowledgments

- ShadCN UI - For the component templates
- OpenAI - For the AI capabilities 