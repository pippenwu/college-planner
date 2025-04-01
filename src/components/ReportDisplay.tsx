import { BarChart4, CalendarDays, CheckSquare } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { generatePDF } from '../utils/pdfUtils';
import NextStepsSection from './NextStepsSection';
import OverviewSection from './OverviewSection';
import { TimelineView } from './TimelineView';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ReportDisplayProps {
  report: string;
  studentName?: string;
  studentGrade?: string;
  onStartOver: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ 
  report, 
  studentName,
  studentGrade,
  onStartOver 
}) => {
  const [overview, setOverview] = useState<string>('');
  const [nextSteps, setNextSteps] = useState<string>('');
  const [timelineData, setTimelineData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (report) {
      parseReport(report);
    }
  }, [report]);

  const parseReport = (htmlContent: string) => {
    try {
      // Parse the report HTML to extract sections
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract overview
      const overviewSection = doc.getElementById('overview');
      if (overviewSection) {
        setOverview(overviewSection.innerHTML);
      }
      
      // Extract next steps
      const nextStepsSection = doc.getElementById('next-steps');
      if (nextStepsSection) {
        setNextSteps(nextStepsSection.innerHTML);
      }
      
      // Extract timeline data
      const timelineSection = doc.getElementById('timeline');
      if (timelineSection) {
        const timelineDataElement = timelineSection.querySelector('.timeline-data');
        
        if (timelineDataElement) {
          try {
            const timelineJSON = JSON.parse(timelineDataElement.textContent || '[]');
            setTimelineData(timelineJSON);
          } catch (err) {
            console.error('Failed to parse timeline data:', err);
            setTimelineData(null);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing report:', error);
    }
  };

  const handlePDFDownload = () => {
    if (report) {
      generatePDF(report, studentName || 'Student');
    }
  };

  return (
    <div className="report-display">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">
          Your College Application Plan
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Review your personalized plan and start taking action on the recommended steps.
        </p>
        
        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart4 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="next-steps" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span>Next Steps</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <OverviewSection 
              content={overview} 
              studentName={studentName}
              studentGrade={studentGrade}
            />
          </TabsContent>
          
          <TabsContent value="plan" className="mt-0">
            {timelineData ? (
              <TimelineView timelineData={timelineData} />
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <p className="text-gray-500 mb-4">
                  Timeline data could not be loaded properly.
                </p>
                <div 
                  className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ 
                    __html: document.getElementById('timeline')?.innerHTML || '' 
                  }} 
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="next-steps" className="mt-0">
            <NextStepsSection content={nextSteps} />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={onStartOver}
        >
          Start Over
        </Button>
        <Button 
          onClick={handlePDFDownload}
        >
          Download Report (PDF)
        </Button>
      </div>
    </div>
  );
};

export default ReportDisplay; 