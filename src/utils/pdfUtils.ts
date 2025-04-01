import { jsPDF } from "jspdf";

/**
 * Generates a PDF from the HTML report content
 * @param reportHTML - The HTML report content
 * @param studentName - The student's name to use in the filename
 */
export const generatePDF = (reportHTML: string, studentName: string): void => {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Parse the report to extract sections
    const parser = new DOMParser();
    const reportDoc = parser.parseFromString(reportHTML, 'text/html');
    
    // Clean up the student name for filename (remove spaces, special chars)
    const safeStudentName = studentName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    
    // Add title
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153); // Blue color
    doc.text('College Application Plan', 105, 20, { align: 'center' });
    
    // Add student name if provided
    if (studentName) {
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`For: ${studentName}`, 105, 30, { align: 'center' });
    }
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Helper function to add text with wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number): number => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * 7); // Return the new Y position
    };
    
    let yPosition = 45; // Starting Y position
    
    // Overview Section
    const overviewSection = reportDoc.getElementById('overview');
    if (overviewSection) {
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 153); // Blue color
      doc.text('OVERVIEW', 20, yPosition);
      yPosition += 10;
      
      // Extract text content from overview section (excluding the heading)
      const overviewContent = overviewSection.innerHTML
        .replace(/<h2>.*?<\/h2>/i, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      yPosition = addWrappedText(overviewContent, 20, yPosition, 170);
      yPosition += 15;
    }
    
    // Timeline Section
    const timelineSection = reportDoc.getElementById('timeline');
    if (timelineSection) {
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 153); // Blue color
      doc.text('PLAN', 20, yPosition);
      yPosition += 10;
      
      // Attempt to extract timeline data
      const timelineDataElement = timelineSection.querySelector('.timeline-data');
      
      if (timelineDataElement && timelineDataElement.textContent) {
        try {
          // Parse the timeline data
          const timelineData = JSON.parse(timelineDataElement.textContent);
          
          // Create a more compact timeline representation
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          
          timelineData.forEach((period: any, index: number) => {
            // Check if we need a new page
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Period heading
            doc.setFontSize(12);
            doc.setTextColor(0, 102, 204);
            doc.text(period.period, 20, yPosition);
            yPosition += 5;
            
            // Events
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            if (period.events && period.events.length > 0) {
              period.events.forEach((event: any) => {
                // Check if we need a new page
                if (yPosition > 270) {
                  doc.addPage();
                  yPosition = 20;
                }
                
                // Event title and category
                doc.setFont('helvetica', 'bold');
                doc.text(`• ${event.title} (${event.category})`, 25, yPosition);
                yPosition += 5;
                
                // Event description
                doc.setFont('helvetica', 'normal');
                const description = `  Deadline: ${event.deadline} - ${event.description}`;
                yPosition = addWrappedText(description, 28, yPosition, 162);
                yPosition += 5;
              });
            } else {
              doc.text('No events scheduled for this period.', 25, yPosition);
              yPosition += 5;
            }
            
            yPosition += 5;
          });
        } catch (error) {
          console.error('Error parsing timeline data for PDF:', error);
          yPosition = addWrappedText('Timeline data could not be displayed properly.', 20, yPosition, 170);
        }
      } else {
        // If timeline data can't be parsed, include whatever text content we can find
        const timelineContent = timelineSection.innerHTML
          .replace(/<h2>.*?<\/h2>/i, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        yPosition = addWrappedText(timelineContent, 20, yPosition, 170);
      }
      
      yPosition += 15;
    }
    
    // Next Steps Section
    const nextStepsSection = reportDoc.getElementById('next-steps');
    if (nextStepsSection) {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 153); // Blue color
      doc.text('NEXT STEPS', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      // Extract list items
      const listItems = nextStepsSection.querySelectorAll('li');
      if (listItems.length > 0) {
        Array.from(listItems).forEach((item, index) => {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Clean the text content
          const itemText = item.textContent?.replace(/\s+/g, ' ').trim() || '';
          yPosition = addWrappedText(`${index + 1}. ${itemText}`, 20, yPosition, 170);
          yPosition += 5;
        });
      } else {
        // If no list items, include whatever text content we can find
        const nextStepsContent = nextStepsSection.innerHTML
          .replace(/<h2>.*?<\/h2>/i, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        yPosition = addWrappedText(nextStepsContent, 20, yPosition, 170);
      }
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const today = new Date().toLocaleDateString();
      doc.text(`College Application Planner | Generated on ${today} | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`college_plan_${safeStudentName}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('There was an error generating the PDF. Please try again later.');
  }
}; 