import { StudentProfileForm } from './components/StudentProfileForm';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <header className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">CollegeGPT - Updated</h1>
        <p className="text-gray-600">AI-Powered College Counseling Advice</p>
        
        {/* Test Element with Direct Style */}
        <div style={{ backgroundColor: 'red', padding: '20px', marginTop: '20px', color: 'white', fontWeight: 'bold' }}>
          This has direct styling
        </div>
        
        {/* Test Element with Tailwind */}
        <div className="bg-red-500 p-5 mt-5 text-white font-bold">
          This has Tailwind styling
        </div>
        
        {/* Test Element with Explicit CSS Class */}
        <div className="force-red-background">
          This has explicit CSS styling
        </div>
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