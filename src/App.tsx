import { StudentProfileForm } from './components/StudentProfileForm';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <header className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">CollegeGPT - Updated</h1>
        <p className="text-gray-600">AI-Powered College Counseling Advice</p>
      </header>

      <main>
        <StudentProfileForm />
      </main>
      
      <footer className="max-w-3xl mx-auto mt-16 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} CollegeGPT. All rights reserved.</p>
        <p className="mt-1">AI-powered college counseling for affordable, personalized advice.</p>
      </footer>
    </div>
  );
}

export default App; 