import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import KryptogoPaymentProvider from './components/payment/PaymentProvider';
import { StudentProfileForm } from './components/StudentProfileForm';
import { PaymentProvider } from './context/PaymentContext';

// Success stories showing students who got admitted to top universities
const SUCCESS_STORIES = [
  { name: "Emma Chen", school: "Harvard University" },
  { name: "Marcus Johnson", school: "Stanford University" },
  { name: "Sophia Patel", school: "MIT" },
  { name: "David Kim", school: "Yale University" },
  { name: "Olivia Martinez", school: "Princeton University" },
  { name: "Ethan Wilson", school: "Columbia University" },
];

// Alternative message formats for success stories
const SUCCESS_PHRASES = [
  "was accepted to", 
  "earned admission to",
  "received an offer from",
  "secured a spot at",
  "achieved their dream of attending",
  "celebrated their acceptance to"
];

// Error Boundary component to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("App crashed:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <summary>Show error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', marginTop: 20, background: '#444', color: 'white', border: 'none', borderRadius: 4 }}
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentStory, setCurrentStory] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isReportVisible, setIsReportVisible] = useState(false);

  // Cycle through success stories
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsAnimating(false);
      
      // Wait for fade out animation to complete
      setTimeout(() => {
        setCurrentStory((prev) => (prev + 1) % SUCCESS_STORIES.length);
        // Also rotate through different phrases
        setCurrentPhrase((prev) => (prev + 1) % SUCCESS_PHRASES.length);
        setIsAnimating(true);
      }, 500);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  // Log when App mounts
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <ErrorBoundary>
      <KryptogoPaymentProvider>
        <PaymentProvider>
          <div className="min-h-screen bg-academic-cream flex flex-col overflow-hidden">
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#FFFFFF',
                  color: '#1e293b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                },
              }}
            />
            <header className="w-full py-6 px-4 sm:px-6 relative z-10">
              <div className="max-w-6xl mx-auto w-full">
                {/* Only show success stories when no report is visible */}
                {!isReportVisible && (
                  <div className="h-14 mb-4 relative overflow-hidden">
                    <div 
                      className={`absolute inset-0 p-3 rounded-lg bg-academic-navy/10 text-academic-navy flex items-center justify-center transition-all duration-500 ease-in-out ${
                        isAnimating 
                          ? 'translate-y-0' 
                          : '-translate-y-full'
                      }`}
                    >
                      <span className="block">
                        <span className="font-semibold">{SUCCESS_STORIES[currentStory].name}</span>{" "}
                        {SUCCESS_PHRASES[currentPhrase]}{" "}
                        <span className="font-semibold">{SUCCESS_STORIES[currentStory].school}</span>! 🎉
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </header>

            <main className="flex-grow w-full px-4 sm:px-6 overflow-x-hidden relative z-10">
              <div className="max-w-6xl mx-auto w-full">
                <StudentProfileForm onReportVisibilityChange={setIsReportVisible} />
              </div>
            </main>

            <footer className="w-full py-4 px-4 sm:px-6 text-academic-slate border-t border-academic-light relative z-10 mt-12">
              <div className="max-w-6xl mx-auto w-full text-center text-xs">
                © {new Date().getFullYear()} College Application Planner. All rights reserved.
              </div>
            </footer>
          </div>
        </PaymentProvider>
      </KryptogoPaymentProvider>
    </ErrorBoundary>
  );
}

export default App; 