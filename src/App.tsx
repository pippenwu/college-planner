import { useEffect, useState } from 'react';
import { StudentProfileForm } from './components/StudentProfileForm';

// Success stories to display in the animated banner
const SUCCESS_STORIES = [
  { name: "Emma Johnson", school: "Stanford University" },
  { name: "Michael Chen", school: "MIT" },
  { name: "Sophia Rodriguez", school: "Harvard University" },
  { name: "James Wilson", school: "Princeton University" },
  { name: "Olivia Kim", school: "Yale University" },
  { name: "Ethan Patel", school: "Columbia University" },
  { name: "Isabella Martinez", school: "Duke University" },
  { name: "Aiden Wang", school: "University of Chicago" },
  { name: "Zoe Thompson", school: "Northwestern University" },
  { name: "Lucas Garcia", school: "Johns Hopkins University" },
  { name: "Ava Patel", school: "Caltech" },
  { name: "Noah Washington", school: "UC Berkeley" },
  { name: "Maya Singh", school: "Dartmouth College" },
  { name: "Jackson Lee", school: "Cornell University" },
  { name: "Lily Nguyen", school: "Vanderbilt University" },
  { name: "Mason Brown", school: "Rice University" },
  { name: "Chloe Davis", school: "Brown University" },
  { name: "Gabriel Jones", school: "University of Pennsylvania" },
  { name: "Amelia Robinson", school: "Carnegie Mellon University" },
  { name: "Elijah Hernandez", school: "UCLA" },
  { name: "Harper Adams", school: "Georgetown University" },
  { name: "David Kim", school: "University of Michigan" },
  { name: "Sofia Wilson", school: "Washington University in St. Louis" },
  { name: "Ryan Taylor", school: "Boston College" },
];

function App() {
  const [currentStory, setCurrentStory] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cycle through success stories
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStory((prev) => (prev + 1) % SUCCESS_STORIES.length);
        setIsAnimating(true);
      }, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentStory]);

  // Set initial animation
  useEffect(() => {
    setIsAnimating(true);
  }, []);

  return (
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
  );
}

export default App; 