import React from 'react';
import { getAcademicLevel, getExpectedGraduationYear } from '../utils/helpers';

interface OverviewSectionProps {
  content: string;
  studentName?: string;
  studentGrade?: string;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ 
  content, 
  studentName, 
  studentGrade 
}) => {
  // Clean up the HTML content
  const cleanContent = content.replace(/<h2>.*?<\/h2>/i, '').trim();
  
  // Get student academic info if available
  const academicLevel = studentGrade ? getAcademicLevel(studentGrade) : null;
  const graduationYear = studentGrade ? getExpectedGraduationYear(studentGrade) : null;

  return (
    <div className="overview-section bg-white rounded-lg p-6 shadow-md">
      {studentName && (
        <div className="student-info mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold mb-2">
            {studentName}'s Profile
          </h3>
          {academicLevel && graduationYear && (
            <p className="text-gray-600">
              {academicLevel} Student | Expected Graduation: {graduationYear}
            </p>
          )}
        </div>
      )}
      
      <div className="overview-content">
        <div 
          className="prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      </div>
    </div>
  );
};

export default OverviewSection; 