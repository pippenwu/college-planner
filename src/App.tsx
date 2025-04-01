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
    <div className="min-h-screen bg-academic-cream/50 py-12 px-4">
      <header className="max-w-3xl mx-auto mb-12 text-center">
        {/* Animated success banner */}
        <div className="relative h-12 overflow-hidden bg-academic-navy/10 rounded-lg shadow-sm">
          <div 
            className={`absolute w-full transition-all duration-700 ease-in-out ${
              isAnimating ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            <p className="py-3 text-academic-navy font-medium">
              <span className="font-bold">{SUCCESS_STORIES[currentStory].name}</span> got into{" "}
              <span className="font-bold">{SUCCESS_STORIES[currentStory].school}</span> using this planner! 🎉
            </p>
          </div>
        </div>
      </header>

      <main>
        <StudentProfileForm />
      </main>
      
      <footer className="max-w-3xl mx-auto mt-16 text-center text-academic-slate text-sm font-body border-t border-academic-light pt-4">
        <p>© {new Date().getFullYear()} College Application Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App; 