import { jsPDF } from "jspdf";

/**
 * Generate a PDF from the report content and download it
 * @param content The HTML content to convert to PDF
 * @param studentName Student name for file naming
 */
export function generatePDF(content: string, studentName: string) {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Convert HTML to text
    const reportText = content.replace(/<[^>]*>/g, "");
    
    // Add title
    doc.setFontSize(16);
    doc.text("College Application Plan", 20, 20);
    
    // Add content
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(reportText, 170);
    doc.text(splitText, 20, 30);
    
    // Generate filename
    const safeStudentName = studentName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `college_plan_${safeStudentName}_${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    console.log("PDF generated successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again later.");
  }
} 