const express = require('express');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini API with specific endpoint
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
      apiEndpoint: "https://generativelanguage.googleapis.com/v1beta"
    })
  : null;

// In-memory storage for reports (replace with DB in production)
const reportStore = [];

/**
 * Generate report
 * POST /api/report/generate
 * 
 * Generates a report based on student profile data
 * Request: { studentData: Object }
 * Response: { reportId: string, reportData: Object }
 */
router.post('/generate', async (req, res) => {
  try {
    const { studentData } = req.body;
    
    if (!studentData) {
      return res.status(400).json({
        success: false,
        message: 'Missing student data'
      });
    }

    // Generate a unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Call Gemini to generate the report
    const reportData = await generateReportWithAI(studentData);
    
    // Store the report (in memory for now)
    const report = {
      id: reportId,
      studentData,
      reportData,
      createdAt: new Date().toISOString()
    };
    
    reportStore.push(report);
    
    return res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportId,
        reportData
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

/**
 * Get report
 * GET /api/report/:reportId
 * 
 * Gets a generated report. Requires payment verification for full report.
 * Response: Limited report data for free users, full report for paid users
 */
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Find the report
    const report = reportStore.find(r => r.id === reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Check if user has a payment token (in Authorization header)
    const authHeader = req.headers.authorization;
    let isPaid = false;
    let tokenData = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        // Verify the token is for this report
        if (tokenData.reportId === reportId) {
          isPaid = tokenData.isPaid === true;
        }
      } catch (err) {
        // Invalid token, but we'll still return the free report
        console.error('Token verification error:', err);
      }
    }
    
    // Return limited or full report based on payment status
    const responseData = {
      success: true,
      data: {
        reportId: report.id,
        createdAt: report.createdAt,
        isPaid,
        // Return limited or full report based on payment status
        report: isPaid ? report.reportData : getLimitedReportData(report.reportData)
      }
    };
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Get report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report',
      error: error.message
    });
  }
});

/**
 * Download report as PDF
 * GET /api/report/:reportId/pdf
 * 
 * Generates and downloads a PDF of the report. Requires payment verification.
 */
router.get('/:reportId/pdf', verifyToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Ensure user is paid and has access to this report
    if (!req.user || !req.user.isPaid || req.user.reportId !== reportId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to download this report'
      });
    }
    
    // Find the report
    const report = reportStore.find(r => r.id === reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generateReportPDF(report);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="college-plan-${reportId}.pdf"`);
    
    // Send the PDF
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

/**
 * Helper function to generate report with Gemini AI
 */
async function generateReportWithAI(studentData) {
  try {
    // Check if we have a valid API key
    if (!genAI || !process.env.GEMINI_API_KEY || 
        process.env.GEMINI_API_KEY === 'your-gemini-api-key-goes-here' ||
        process.env.GEMINI_API_KEY.includes('your')) {
      console.log('No valid Gemini API key found. Using fallback report generator.');
      return generateFallbackHtmlReport(studentData);
    }

    // Create a formatted string for student details
    const studentName = studentData.studentName || 'Student';
    const currentGrade = studentData.currentGrade || 'High School Student';
    const highSchool = studentData.highSchool || 'High School';
    
    // Format interests properly
    const interests = Array.isArray(studentData.academicInterests) 
      ? studentData.academicInterests.join(', ') 
      : (studentData.intendedMajors || 'Not specified');
    
    // Format activities properly
    const activities = Array.isArray(studentData.activities) 
      ? studentData.activities
          .filter(a => a.name || a.notes)
          .map(a => `${a.name || ''}: ${a.notes || ''}`)
          .join('\n')
      : 'Not specified';

    // Add safe handling for properties that might be undefined
    const prompt = `
      You are a professional college counselor generating a personalized and strategic college planning report for a student based on the following profile.

      Please follow these specific instructions carefully to create a structured HTML report with three sections:
      1. Overview
      2. Timeline (in JSON)
      3. Next Steps

      ---

      ### Student Profile:
      Name: ${studentName}
      Grade: ${currentGrade}
      High School: ${highSchool}
      Academic Interests: ${interests}
      Extracurricular Activities: ${activities}
      Additional Info: ${studentData.additionalInfo || ''}

      If any information is missing, make reasonable assumptions based on the high school and grade level.

      ### Contextual Instructions:
      - Today's date is ${new Date().toISOString().split('T')[0]}. Use this to ensure all recommendations are timely and relevant.
      - The student is either from the U.S. or Taiwan. Base summer programs, extracurriculars, and opportunities on what is realistically available based on their high school location.
      - For GPA and SAT benchmarks, reference actual data from Common Data Sets. Include 25th, 50th (mean), and 75th percentile scores for any recommended schools.
      - Course selection advice should include specific AP courses, how many to take, and justifications. Include anecdotes or real case examples from successful applicants or forums when possible.
      - The Common App allows 10 activities and 5 awards. Spread these throughout the timeline using real, named competitions, programs, and initiatives. Focus on key themes: leadership, community service, academic alignment, initiative, and competitiveness.
      - Essay theme suggestions should reference real essay angles, case studies, or sample prompts. Include links or descriptions of successful essays.
      - Recommended activities and programs may be chosen from a curated internal list (assume this is embedded), such as ArtEffect, iGEM, HOSA, Wharton Global Youth, AMC, YoungArts, NYT Summer School, etc.

      ---

      ### Output Format:

      #### 1. Overview Section (HTML id="overview")
      Write a concise (≤100 words) summary of the student's current academic position, strengths, and readiness. Focus on facts — avoid generic praise. Include test score and GPA context.

      #### 2. Timeline Section (HTML id="timeline")
      Output a <timeline-data>...</timeline-data> block containing structured JSON, like:

      [
        {
          "period": "Spring 2025",
          "events": [
            {
              "title": "Apply to Veritas AI Scholars Program",
              "category": "academics",
              "description": "This selective AI program provides hands-on mentorship and aligns with your interest in computer science. Deadline: March 15.",
              "deadline": "2025-03-15"
            },
            ...
          ]
        },
        ...
      ]

      Start the timeline with the current season of the current year and include at least 6 periods that span approximately 2 years. Use realistic academic seasons: Winter (Jan-Feb), Spring (Mar-May), Summer (Jun-Aug), and Fall (Sep-Dec).

      #### 3. Next Steps Section (HTML id="next-steps")
      List exactly 5 high-priority, immediately actionable recommendations for the next 30–60 days. Be specific and strategic (e.g., register for a SAT retake, contact a research mentor, start drafting the Common App essay, etc.)

      Style & Tone:
      - Use clear, professional language.
      - Be honest but supportive. If a student's current profile does not align with Ivy League admissions, state that clearly and recommend better-fit options.
      - Ensure each section offers new value — do not repeat the same points across sections.
      - Make the HTML structure readable with <h2> tags for each section, and include <div id="college-report"> as the outer container.
    `;

    try {
      console.log('Using Gemini model: gemini-2.0-flash-thinking-exp-01-21');
      // Use only gemini-2.0-flash model as specified
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Return HTML directly instead of attempting to parse as JSON
      console.log('Successfully generated HTML report using gemini-2.0-flash-thinking-exp-01-21');
      return text; // Return the HTML text directly
    } catch (modelError) {
      console.error('Error using Gemini model gemini-2.0-flash-thinking-exp-01-21:', modelError);
      console.log('Using fallback report generator due to model error.');
      return generateFallbackHtmlReport(studentData);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Use fallback report generator if Gemini API fails
    console.log('Using fallback report generator due to API error.');
    return generateFallbackHtmlReport(studentData);
  }
}

/**
 * Generate a fallback HTML report when Gemini is not available
 */
function generateFallbackHtmlReport(studentData) {
  // Return a simple message instead of a detailed fallback report
  return `
    <div class="college-report">
      <section id="overview">
        <h2>Report Generation Error</h2>
        <p>The report cannot be generated at this time. Please try again later.</p>
      </section>
      
      <section id="timeline">
        <h2>Timeline Unavailable</h2>
        <p>Timeline data could not be generated.</p>
        <timeline-data>[]</timeline-data>
      </section>
      
      <section id="next-steps">
        <h2>Next Steps</h2>
        <p>Please try submitting your information again later when the service is available.</p>
      </section>
    </div>
  `;
}

/**
 * Helper function to get limited report data for free users
 */
function getLimitedReportData(reportData) {
  // Use a regex-based approach to extract sections since we're in Node.js (no DOM)
  
  // Extract the overview section
  let overviewHtml = '';
  const overviewMatch = reportData.match(/<section id="overview">([\s\S]*?)<\/section>/i);
  if (overviewMatch && overviewMatch[0]) {
    overviewHtml = overviewMatch[0];
  } else {
    overviewHtml = '<section id="overview"><h2>Overview</h2><p>Overview not available.</p></section>';
  }
  
  // Extract and limit the timeline data
  let timelineData = [];
  const timelineDataMatch = reportData.match(/<timeline-data>([\s\S]*?)<\/timeline-data>/i);
  if (timelineDataMatch && timelineDataMatch[1]) {
    try {
      const parsedTimeline = JSON.parse(timelineDataMatch[1]);
      // Only show 60% of timeline periods
      const visibleCount = Math.ceil(parsedTimeline.length * 0.6);
      timelineData = parsedTimeline.slice(0, visibleCount);
    } catch (e) {
      console.error('Error parsing timeline data:', e);
      timelineData = [];
    }
  }
  
  // Remove any next-steps section from the report completely
  // We do this by NOT including the next-steps section in our reconstructed HTML
  
  // Create a limited version of the report HTML with premium content instead of next steps
  return `
    <div class="college-report">
      ${overviewHtml}
      
      <section id="timeline">
        <h2>Application Timeline</h2>
        <p>Below is a partial timeline with key actions to take. Unlock the full report to see all recommended steps.</p>
        <timeline-data>${JSON.stringify(timelineData)}</timeline-data>
      </section>
      
      <section id="next-steps">
        <h2>Premium Content: Next Steps</h2>
        <div class="premium-content-message">
          <p>The detailed next steps and additional recommendations are available in the full report.</p>
          <p>Unlock the full report to access:</p>
          <ul>
            <li>5 specific, immediately actionable next steps</li>
            <li>Complete timeline with all recommended actions</li>
            <li>Detailed college recommendations with admission statistics</li>
            <li>Personalized essay topic suggestions</li>
          </ul>
        </div>
      </section>
    </div>
  `;
}

/**
 * Helper function to generate a PDF for the report
 */
async function generateReportPDF(report) {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      // Collect PDF data chunks
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));
      
      // Add content to PDF
      const { reportData, studentData } = report;
      
      // Title
      doc.fontSize(25).text('College Application Plan', { align: 'center' });
      doc.moveDown();
      
      // Student Info
      doc.fontSize(16).text('Student Profile', { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${studentData.studentName || 'Student'}`);
      doc.text(`Grade: ${studentData.currentGrade || 'High School Student'}`);
      doc.text(`High School: ${studentData.highSchool || 'Not specified'}`);
      
      // Safely handle academicInterests which might be undefined or not an array
      const interests = Array.isArray(studentData.academicInterests) 
        ? studentData.academicInterests.join(', ') 
        : (studentData.intendedMajors || 'Not specified');
      
      doc.text(`Academic Interests: ${interests}`);
      doc.moveDown();
      
      // Overview
      doc.fontSize(16).text('Overview', { underline: true });
      doc.fontSize(12).text(reportData.overview);
      doc.moveDown();
      
      // Strengths
      doc.fontSize(16).text('Strengths', { underline: true });
      doc.fontSize(12);
      reportData.strengths.forEach((strength, i) => {
        doc.text(`${i + 1}. ${strength}`);
      });
      doc.moveDown();
      
      // Areas for Improvement
      doc.fontSize(16).text('Areas for Improvement', { underline: true });
      doc.fontSize(12);
      reportData.areasForImprovement.forEach((area, i) => {
        doc.text(`${i + 1}. ${area}`);
      });
      doc.moveDown();
      
      // Timeline
      doc.fontSize(16).text('Application Timeline', { underline: true });
      doc.fontSize(12);
      reportData.timeline.forEach((period, i) => {
        doc.text(`${period.period}:`, { bold: true });
        period.tasks.forEach((task, j) => {
          doc.text(`   • ${task}`);
        });
        if (i < reportData.timeline.length - 1) doc.moveDown(0.5);
      });
      doc.moveDown();
      
      // Recommended Colleges
      doc.fontSize(16).text('Recommended Colleges', { underline: true });
      doc.fontSize(12);
      reportData.recommendedColleges.forEach((college, i) => {
        doc.text(`${i + 1}. ${college.name}`, { bold: true });
        doc.text(`   ${college.reason}`);
        if (i < reportData.recommendedColleges.length - 1) doc.moveDown(0.5);
      });
      doc.moveDown();
      
      // Essay Topics
      doc.fontSize(16).text('Essay Topic Suggestions', { underline: true });
      doc.fontSize(12);
      reportData.essayTopics.forEach((topic, i) => {
        doc.text(`${i + 1}. ${topic.topic}`, { bold: true });
        doc.text(`   ${topic.rationale}`);
        if (i < reportData.essayTopics.length - 1) doc.moveDown(0.5);
      });
      doc.moveDown();
      
      // Extracurricular Recommendations
      doc.fontSize(16).text('Extracurricular Recommendations', { underline: true });
      doc.fontSize(12);
      reportData.extracurricularRecommendations.forEach((rec, i) => {
        doc.text(`${i + 1}. ${rec.activity}`, { bold: true });
        doc.text(`   ${rec.benefit}`);
        if (i < reportData.extracurricularRecommendations.length - 1) doc.moveDown(0.5);
      });
      
      // Footer
      doc.moveDown();
      doc.fontSize(10).text('Generated by CollegeGPT', { align: 'center' });
      doc.text(`Report ID: ${report.id}`, { align: 'center' });
      doc.text(`Generated on: ${new Date(report.createdAt).toLocaleDateString()}`, { align: 'center' });
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router; 