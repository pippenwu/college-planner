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
      return generateFallbackReport(studentData);
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

      Please follow these specific instructions carefully to create a structured JSON report with three sections:
      1. overview
      2. timeline
      3. nextSteps

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
      - Essay theme suggestions should reference real essay angles, case studies, or sample prompts.
      - Recommended activities and programs may be chosen from a curated internal list (assume this is embedded), such as ArtEffect, iGEM, HOSA, Wharton Global Youth, AMC, YoungArts, NYT Summer School, etc.

      ---

      ### Output Format:
      You must return valid, parseable JSON with the following structure:

      {
        "overview": {
          "text": "A concise (≤100 words) summary of the student's current academic position, strengths, and readiness. Focus on facts — avoid generic praise. Include test score and GPA context."
        },
        "timeline": [
          {
            "period": "Spring 2023",
            "events": [
              {
                "title": "Apply to Veritas AI Scholars Program",
                "category": "academics",
                "description": "This selective AI program provides hands-on mentorship and aligns with your interest in computer science. Deadline: March 15.",
                "deadline": "2023-03-15"
              }
            ]
          }
        ],
        "nextSteps": [
          {
            "title": "Register for the December SAT",
            "description": "Registration deadline is November 3. Focus on improving your math score from 680 to 730+ by using Khan Academy's official SAT practice.",
            "priority": 1
          }
        ]
      }

      For the timeline:
      - Start with the current season of the current year
      - Include at least 6 periods spanning approximately 2 years
      - Use realistic academic seasons: Winter (Jan-Feb), Spring (Mar-May), Summer (Jun-Aug), and Fall (Sep-Dec)

      For nextSteps:
      - Include exactly 5 high-priority, immediately actionable items for the next 30-60 days
      - Be specific and strategic (e.g., register for SAT, contact research mentor, etc.)
      - Order them by priority (1 = highest priority)

      Style & Tone:
      - Use clear, professional language
      - Be honest but supportive. If a student's current profile does not align with Ivy League admissions, state that clearly and recommend better-fit options
      - Ensure each section offers new value — do not repeat the same points across sections

      Return ONLY valid JSON with no additional text, comments, or explanations. The response must be parseable by JSON.parse().
      DO NOT wrap the JSON in markdown code blocks (do not use \```json or \``` tags).
      DO NOT include any extra whitespace, newlines, or formatting that would break JSON parsing.
    `;

    try {
      console.log('Using Gemini model: gemini-2.0-flash-thinking-exp-01-21');
      // Use only gemini-2.0-flash model as specified
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Check if the text is wrapped in code blocks (```json ... ```)
        let jsonText = text;
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonText = codeBlockMatch[1].trim();
          console.log('Extracted JSON from code block');
        }
        
        // Try to parse the response as JSON
        const jsonData = JSON.parse(jsonText);
        console.log('Successfully generated JSON report using gemini-2.0-flash-thinking-exp-01-21');
        return jsonData;
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('AI response was:', text.substring(0, 200) + '...');
        // Fall back to the basic HTML report if parsing fails
        return generateFallbackReport(studentData);
      }
    } catch (modelError) {
      console.error('Error using Gemini model gemini-2.0-flash-thinking-exp-01-21:', modelError);
      console.log('Using fallback report generator due to model error.');
      return generateFallbackReport(studentData);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Use fallback report generator if Gemini API fails
    console.log('Using fallback report generator due to API error.');
    return generateFallbackReport(studentData);
  }
}

/**
 * Generate a fallback report when Gemini is not available
 */
function generateFallbackReport(studentData) {
  // Return a simple structured fallback report
  return {
    overview: {
      text: "The report cannot be generated at this time. Please try again later."
    },
    timeline: [
      {
        period: "Current Semester",
        events: [
          {
            title: "Report Generation Error",
            category: "academics",
            description: "The timeline data could not be generated. Please try again later.",
            deadline: new Date().toISOString().split('T')[0]
          }
        ]
      }
    ],
    nextSteps: [
      {
        title: "Try Again Later",
        description: "Please try submitting your information again later when the service is available.",
        priority: 1
      }
    ]
  };
}

/**
 * Helper function to get limited report data for free users
 */
function getLimitedReportData(reportData) {
  // Create a copy of the report data
  const limitedData = JSON.parse(JSON.stringify(reportData));
  
  // For timeline, only show 60% of the periods
  if (limitedData.timeline && Array.isArray(limitedData.timeline)) {
    const visibleCount = Math.ceil(limitedData.timeline.length * 0.6);
    limitedData.timeline = limitedData.timeline.slice(0, visibleCount);
  }
  
  // Replace nextSteps with a premium content message
  limitedData.nextSteps = [
    {
      title: "Unlock Premium Content",
      description: "Unlock the full report to access 5 specific, immediately actionable next steps tailored to your profile.",
      priority: 1
    },
    {
      title: "Complete Timeline",
      description: "The full report includes a complete timeline with all recommended actions.",
      priority: 2
    },
    {
      title: "Detailed College Recommendations",
      description: "Access personalized college recommendations with admission statistics.",
      priority: 3
    }
  ];
  
  return limitedData;
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
      doc.fontSize(12).text(reportData.overview.text);
      doc.moveDown();
      
      // Timeline
      doc.fontSize(16).text('Application Timeline', { underline: true });
      doc.fontSize(12);
      
      reportData.timeline.forEach((period, i) => {
        doc.text(`${period.period}:`, { bold: true });
        period.events.forEach((event, j) => {
          doc.text(`   • ${event.title} (${event.category})`, { bold: true });
          doc.text(`     ${event.description}`);
          if (event.deadline) {
            doc.text(`     Deadline: ${event.deadline}`);
          }
          if (j < period.events.length - 1) doc.moveDown(0.5);
        });
        if (i < reportData.timeline.length - 1) doc.moveDown();
      });
      doc.moveDown();
      
      // Next Steps
      doc.fontSize(16).text('Immediate Next Steps', { underline: true });
      doc.fontSize(12);
      
      // Sort next steps by priority
      const sortedNextSteps = [...reportData.nextSteps].sort((a, b) => a.priority - b.priority);
      
      sortedNextSteps.forEach((step, i) => {
        doc.text(`${i + 1}. ${step.title}`, { bold: true });
        doc.text(`   ${step.description}`);
        if (i < sortedNextSteps.length - 1) doc.moveDown(0.5);
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