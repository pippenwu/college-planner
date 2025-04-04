import { useEffect, useState } from 'react';
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

function App() {
  const [currentStory, setCurrentStory] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Cycle through success stories
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsAnimating(false);
      
      // Wait for fade out animation to complete
      setTimeout(() => {
        setCurrentStory((prev) => (prev + 1) % SUCCESS_STORIES.length);
        setIsAnimating(true);
      }, 500);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <PaymentProvider>
      <div className="min-h-screen bg-academic-cream/50 flex flex-col overflow-hidden">
        <header className="w-full py-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto w-full">
            {isAnimating && (
              <div className="mb-4 p-3 rounded-lg bg-academic-navy/10 text-academic-navy text-center animate-fade-in overflow-hidden">
                <span className="inline-block break-words">
                  <span className="font-semibold">{SUCCESS_STORIES[currentStory].name}</span> got into{" "}
                  <span className="font-semibold">{SUCCESS_STORIES[currentStory].school}</span> using this planner! 🎉
                </span>
              </div>
            )}
            <h1 className="text-4xl font-bold text-academic-navy mb-2">College Application Planner</h1>
            <p className="text-lg text-academic-slate mb-4">Data-driven college planning, trusted by professional counselors</p>
          </div>
        </header>

        <main className="flex-grow w-full px-4 sm:px-6 overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full">
            <StudentProfileForm />
          </div>
        </main>

        <footer className="w-full py-4 px-4 sm:px-6 text-academic-slate border-t border-academic-light">
          <div className="max-w-6xl mx-auto w-full text-center">
            © {new Date().getFullYear()} College Application Planner. All rights reserved.
          </div>
        </footer>
      </div>
    </PaymentProvider>
  );
}

export default App; 