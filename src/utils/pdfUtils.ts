import html2pdf from 'html2pdf.js';

export function generatePDF(reportContent: string, studentName: string = 'Student') {
  // Create a container for the PDF content
  const element = document.createElement('div');
  element.className = 'pdf-container';
  
  // Add a styled header
  const header = document.createElement('div');
  header.style.textAlign = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h1');
  title.textContent = 'College Counseling Report';
  title.style.color = '#2563eb';
  title.style.marginBottom = '10px';
  
  const subtitle = document.createElement('h2');
  subtitle.textContent = `Prepared for: ${studentName}`;
  subtitle.style.color = '#4b5563';
  
  header.appendChild(title);
  header.appendChild(subtitle);
  
  // Convert markdown to HTML (simple version)
  const content = document.createElement('div');
  content.innerHTML = markdownToHtml(reportContent);
  content.style.lineHeight = '1.6';
  content.style.fontSize = '14px';
  
  // Add footer
  const footer = document.createElement('div');
  footer.style.marginTop = '30px';
  footer.style.borderTop = '1px solid #e5e7eb';
  footer.style.paddingTop = '15px';
  footer.style.textAlign = 'center';
  footer.style.fontSize = '12px';
  footer.style.color = '#6b7280';
  
  const date = new Date();
  footer.textContent = `Generated on ${date.toLocaleDateString()} by CollegeGPT`;
  
  // Assemble the document
  element.appendChild(header);
  element.appendChild(content);
  element.appendChild(footer);
  
  // Set PDF options
  const options = {
    margin: [15, 15],
    filename: `college_report_${studentName.replace(/\s+/g, '_').toLowerCase()}_${date.toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Generate and download PDF
  return html2pdf().set(options).from(element).save();
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Convert headings
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
    // Convert lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/<\/li>\n\n<li>/g, '</li></ul><ul><li>')
    .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
    
    // Convert paragraphs
    .replace(/\n\n((?!<h|<ul|<p)[^\n]*)/g, '<p>$1</p>')
    
    // Convert bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert line breaks
    .replace(/\n(?!<)/g, '<br />');
  
  return html;
} 