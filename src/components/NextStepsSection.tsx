import { CheckCircle, Circle } from 'lucide-react';
import React, { useState } from 'react';

interface NextStepsSectionProps {
  content: string;
}

const NextStepsSection: React.FC<NextStepsSectionProps> = ({ content }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Clean up the HTML content and remove the heading
  const cleanContent = content.replace(/<h2>.*?<\/h2>/i, '').trim();
  
  // Parse the list items from the HTML content
  const extractSteps = (htmlContent: string): string[] => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const listItems = tempDiv.querySelectorAll('li');
    return Array.from(listItems).map(item => item.innerHTML);
  };
  
  const steps = extractSteps(cleanContent);
  
  // Toggle step completion
  const toggleStep = (index: number) => {
    setCompletedSteps(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Calculate progress percentage
  const progressPercentage = steps.length > 0 
    ? Math.round((completedSteps.length / steps.length) * 100) 
    : 0;
  
  return (
    <div className="next-steps-section bg-white rounded-lg p-6 shadow-md">
      <div className="progress-header mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Next Steps</h3>
        <span className="text-sm font-medium text-gray-600">
          {completedSteps.length} of {steps.length} completed ({progressPercentage}%)
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Steps list */}
      <ul className="space-y-3">
        {steps.map((step, index) => (
          <li 
            key={index} 
            className={`flex items-start gap-3 p-3 rounded-md transition-colors ${
              completedSteps.includes(index) 
                ? 'bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <button 
              onClick={() => toggleStep(index)}
              className="flex-shrink-0 mt-0.5"
              aria-label={completedSteps.includes(index) ? "Mark as incomplete" : "Mark as complete"}
            >
              {completedSteps.includes(index) ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <div 
              className={`flex-1 ${completedSteps.includes(index) ? 'text-gray-500' : 'text-gray-800'}`}
              dangerouslySetInnerHTML={{ __html: step }}
            />
          </li>
        ))}
      </ul>
      
      {steps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No specific next steps were provided in this report.</p>
        </div>
      )}
    </div>
  );
};

export default NextStepsSection; 