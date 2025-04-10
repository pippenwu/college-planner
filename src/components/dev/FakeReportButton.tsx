import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { ReportData } from '../ReportDisplay';

// Create a global state object to hold the test report without using localStorage
// This will still be cleared on refresh, but allows sharing between components
type GlobalTestState = {
  testReport: ReportData | null;
  showReport: boolean;
};

// Create a global object that will be accessible across components
declare global {
  interface Window {
    __TEST_STATE__: GlobalTestState;
  }
}

// Initialize global state if not exists
if (typeof window !== 'undefined') {
  window.__TEST_STATE__ = window.__TEST_STATE__ || {
    testReport: null,
    showReport: false
  };
}

export function FakeReportButton() {
  const generateFakeReport = () => {
    // Generate a fake report with dummy data
    const fakeReport: ReportData = {
      overview: {
        text: "This is a sample college application plan generated for testing purposes. It contains mock data to help you test the payment integration and other features of the application."
      },
      timeline: [
        {
          period: "Summer Before Senior Year",
          events: [
            {
              title: "Research colleges",
              category: "Application",
              description: "Make a list of colleges you're interested in applying to",
              deadline: "2024-06-15",
            },
            {
              title: "Start working on Common App",
              category: "Application",
              description: "Create account and fill out basic information",
              deadline: "2024-07-01",
            },
            {
              title: "Brainstorm essay topics",
              category: "Essay Brainstorming",
              description: "Think about meaningful experiences to write about",
              deadline: "2024-07-15",
            }
          ]
        },
        {
          period: "Fall Senior Year",
          events: [
            {
              title: "Finalize college list",
              category: "Application",
              description: "Decide on safety, target, and reach schools",
              deadline: "2024-09-15",
            },
            {
              title: "Write essays",
              category: "Essay Brainstorming",
              description: "Complete Common App and supplemental essays",
              deadline: "2024-10-15",
            },
            {
              title: "Submit early applications",
              category: "Application",
              description: "Early Decision/Early Action deadlines",
              deadline: "2024-11-01",
            }
          ]
        }
      ],
      nextSteps: [
        {
          title: "Create your Common App account",
          description: "Visit commonapp.org to set up your account and start getting familiar with the application process.",
          priority: 1
        },
        {
          title: "Schedule college entrance exams",
          description: "Register for upcoming SAT or ACT tests if you haven't already taken them or want to improve your scores.",
          priority: 2
        },
        {
          title: "Request recommendation letters",
          description: "Ask teachers, counselors, and mentors who know you well to write recommendation letters.",
          priority: 3
        }
      ]
    };

    // Store in the global test state
    window.__TEST_STATE__.testReport = fakeReport;
    window.__TEST_STATE__.showReport = true;

    // Show success message
    toast.success('Fake report generated for testing!', {
      duration: 3000,
      icon: '🧪',
    });

    // Force a re-render of the application
    window.dispatchEvent(new Event('test-report-generated'));
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button
        onClick={generateFakeReport}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        (Test) Use Mock Report
      </Button>
    </div>
  );
} 