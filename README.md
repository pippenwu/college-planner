# CollegeGPT

An AI-powered tool that helps students get personalized college counseling advice by analyzing their academic profile and interests.

## Features

- Student profile input form collecting key academic and personal information
- AI-generated report with the following sections:
  - Recommended reach/target/safety schools
  - Recommended majors
  - Essay theme ideas
  - Summer activity suggestions
  - Application strategy
- PDF export functionality
- Clean, responsive UI built with React, TypeScript, Vite, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js v16+
- npm v7+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collegegpt.git
cd collegegpt
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root with your OpenAI API key:
```
VITE_OPENAI_API_KEY=your-api-key-here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and visit [http://localhost:5173](http://localhost:5173)

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