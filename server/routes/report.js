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
 * Generates a report based on the student data. Returns the reportId and reportData.
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
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Generate report with AI
    try {
      const reportData = await generateReportWithAI(studentData);
      
      // Create report record
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
    } catch (aiError) {
      // AI service unavailable - return 503 Service Unavailable
      console.error('AI report generation failed:', aiError);
      return res.status(503).json({
        success: false,
        message: aiError.message || 'All our counselors are busy right now. Please try again later.',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
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
  const { reportId } = req.params;
  
  try {
    console.log(`PDF download requested for reportId: ${reportId}`);
    
    // Ensure user is paid
    const isPaid = req.user && req.user.isPaid === true;
    
    // Verify the user has paid for THIS specific report
    const hasAccessToThisReport = isPaid && req.user.reportId === reportId;
    
    if (!hasAccessToThisReport) {
      console.log(`Access denied: Token reportId (${req.user.reportId}) doesn't match requested reportId (${reportId})`);
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have access to download this report. Payment required.' 
      });
    }
    
    // Find the report
    const report = reportStore.find(r => r.id === reportId);
    
    if (!report) {
      console.log(`Report not found with ID: ${reportId}`);
      return res.status(404).json({
        success: false,
        message: 'Report not found. This may be because the server was restarted. Please regenerate your report.'
      });
    }
    
    console.log(`Report found, generating PDF for: ${reportId}`);
    
    // Generate PDF
    const pdfBuffer = await generateReportPDF(report);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="college-plan-${reportId}.pdf"`);
    
    // Send the PDF
    console.log('PDF generated successfully, sending to client');
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
      throw new Error('All our counselors are busy right now. Please try again later.');
    }

    // Create a formatted string for student details
    const studentName = studentData.studentName || 'Name Not Provided';
    const currentGrade = studentData.currentGrade || 'Age Unknown';
    const highSchool = studentData.highSchool || 'Unknown High School';
    
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

    // Format college list if available
    const collegeList = Array.isArray(studentData.collegeList) 
      ? studentData.collegeList.join(', ')
      : (studentData.collegeList || 'Not specified');
    
    // Format test scores if available - testScores is an array of objects with testName and score properties
    const testScores = Array.isArray(studentData.testScores) 
      ? studentData.testScores
          .filter(test => test.testName && test.score)
          .map(test => `${test.testName}: ${test.score}`)
          .join('\n')
      : 'Not specified';
    
    // Format course history properly - it's a string from the form, not an array
    const courseHistory = studentData.courseHistory || 'Not specified';

    // Add safe handling for properties that might be undefined
    const prompt = `
      You are a professional college counselor of over 20+ years experience generating a personalized and strategic college planning report for a student based on the following profile.

      Please follow these specific instructions carefully to create a structured JSON report with three sections:
      1. overview
      2. timeline
      3. nextSteps

      ---

      ### Student Profile:
      Name: ${studentName}
      Grade: ${currentGrade}
      High School: ${highSchool}
      Intended Majors: ${interests}
      Extracurricular Activities: ${activities}
      College List: ${collegeList}
      Test Scores: ${testScores}
      Course History: ${courseHistory}

      ### Output Format:
      You must return valid, parseable JSON using the following structure:

      {
        "overview": {
          "text": "..."
        },
        "timeline": [
          {
            "period": "...",
            "events": [
              {
                "title": "...",
                "category": "...",
                "description": "..."
              }
            ]
          }
        ],
        "nextSteps": [
          {
            "title": "...",
            "description": "...",
          }
        ]
      }

      ### Formatting Rules:
      - Return **only** valid JSON — no extra comments, text, or markdown formatting.
      - Do **not** wrap the output in triple backticks.
      - Ensure all text values are enclosed in double quotes and escape any special characters properly.
      - The entire response must be directly parseable using JSON.parse() with no preprocessing.

      ### Overview Instructions:
      - Provide a quantitative assessment (≤100 words) comparing the student's current academic profile to the medians of their target colleges. Include:
        - Number of APs or honors courses vs. what's typical for admitted students
        - Standardized test scores vs. CDS data — clearly state if SAT/ACT scores are within, below, or above target ranges
        - Academic trajectory — current rigor, trends, or notable gaps
        - Immediate areas for improvement, with specific, actionable focus
      - Avoid praise, generalizations, or vague descriptions and encouragement. This section must be objective, data-based, and focused on admissions-relevant gaps.

      ### Timeline Instructions:
      - Begin the timeline with the current academic season of the current year.
      - The timeline should always extend through high school graduation, up until college matriculation.
      - Adjust the number of timeline periods based on the student's current grade level.
      - Use standard academic seasons:
        - Spring: March–May
        - Summer: June–August
        - Fall: September–December
        - Winter (optional): January–February, used only for time-sensitive tasks such as test registration, summer program deadlines, or final SAT prep (especially for Grade 11–12 students).
      - Label each period with both season and grade level:
        - Example (during the school year): "Spring 2024 (sophomore)"
        - Example (summer): "Summer 2024 (rising junior)"

      ### Timeline Event Requirements:
      - Each season must include 5 specific and actionable recommendations (minimum of 3 if absolutely necessary; 5 is ideal).
      - For each event, provide a highly detailed description, including:
        - Specific data and statistics (e.g., acceptance rates, score outcomes, cost)
        - Application requirements (e.g., deadlines, documents, time commitment)
        - Quantifiable outcomes (e.g., score improvement averages, publication success)
        - Real program names and dates (when applicable)
        - Clear next steps (e.g., registration links, documents to prepare)
      
      ### Required Timeline Categories:
      - All timeline events should draw from the following categories. Each category should appear in appropriate seasons.

      1. **Academics (GPA, APs, Honors Courses)**  
        - Recommend specific AP/honors courses aligned to major interests and target school expectations.
        - Course selection recommendations must appear in the Spring before each new school year begins (e.g., junior-year course planning in Spring of sophomore year).
        - Include GPA-boosting suggestions (e.g., tutoring, study groups, summer remediation if GPA is low).
        - If the student is aiming for top schools, be strict. Top students often have 8 to 12 APs, and 4.5+ GPAs.

      2. **Standardized Testing (SAT, ACT, TOEFL if applicable)**  
        - Suggest appropriate test prep and retake timelines using national and CDS benchmarks.
        - If the student has existing test scores:
          * Do not recommend diagnostic tests or initial prep.
          * Instead, suggest score improvement strategies or additional attempts if needed.
        - Include TOEFL/IELTS if required for international students or non-native speakers.
        - Follow this general schedule unless otherwise informed:
          * Sophomore Year: PSAT, light SAT prep    
          * Junior Spring: First SAT/ACT administration
          * Senior Fall: Retake if needed before early deadlines

      3. **Extracurricular Activities**  
        - Ensure variety and alignment to competitive applications. Include activities under the following types:
          * **Leadership** (e.g., club president, leading a team, initiating a program)
          * **Community Service** (volunteering, mentorship, advocacy)
          * **Major-Related or Academic Exploration** (research, competitions, summer courses)
          * **Competitiveness** (national/international programs, contests)
          * **Initiative** (self-driven projects, independent learning, entrepreneurship)
        - Students should aim to develop a **portfolio of 10–15 meaningful activities** that can be used to fill the **10 activity slots** and **5 award slots** in the Common App. Distribute these across multiple seasons to show consistency, depth, and leadership over time.
        - When recommending activities or programs, reference **real student case studies**, anecdotal examples from past applicants, or success stories shared in college admissions forums or articles. This adds authenticity and strategic value to each suggestion.
        - Here is a list of activities for reference:
          * ArtEffect
          * Congressional Art Competition
          * From The Top Fellowship (Music)
          * International Youth Fellowship
          * Kaira Looro
          * National Association for Music Education Competitions
          * National High School Musical Theatre Awards
          * Superior Culture
          * YoungArts National Arts Competetion
          * Health Occupations Students of America (HOSA)
          * International Genetically Engineered Machine (iGEM)
          * Medic Mentor
          * Stockholm Junior Water Prize
          * British Biology Olympiad
          * Blue Ocean Entrepreneurship Competition
          * Conrad Spirit of Innovation
          * DECA
          * Diamond Challenge
          * Future Business Leaders of America
          * Harvard Undergraduate Economics Association Writing Contest
          * High School Fed Challenge
          * International Cyberfair (世界網界博覽會白金獎)
          * Model Entrepreneur Competition (MEC)
          * NFTE World Series of Innovation
          * Otis ESG
          * Rice Business Plan Competition
          * The Stock Market Game
          * Wharton Investment Competition
          * AICrowd
          * BEST Robotics Competition
          * CERN's Beamline for Schools Competition
          * Clean Tech Competition
          * Congressional App Challenge
          * CyberPatriot
          * First Robotics Competition
          * ITEX WYIE (Young Inventors)
          * Kaggle
          * Microsoft Imagine Cup (Junior)
          * MIT THINK Scholars Program
          * National Scholastic Press Association (Pacemaker and Individual Awards)
          * Technology Student Association High School Competition
          * Toshiba/NSTA ExploraVision
          * Vex Robotics Competition
          * Young Turing Program
          * International Olympiad in Artificial Intelligence
          * Austin Film Festival Young Filmmaker's Competition
          * 2023 ARML Local 美國高中數學聯賽
          * AMC
          * American Regions Mathematics League
          * Caribou Mathematics Competition
          * COMAP
          * Cybermath
          * Harvard MIT Mathematics Tournament
          * High School Mathematical Contest in Modeling (HiMCM)
          * IMMC (International Math Modeling Competition)
          * Math Without Borders Competition
          * Pi Math Contest
          * Academic Decathlon
          * National Academic League
          * National History Bowl
          * Non-Trivial
          * Odyssey of the Mind
          * Quiz Bowl Tournament of Champions
          * The Brain Bee
          * University Interscholastic League
          * Astronomy Olympiad
          * IAAC
          * Physics Bowl
          * Climate Science Olympiad
          * Astrophysics Olympiad
          * AFSA American Foreign Service Affairs
          * American Foreign Service National H.S. Essay Contest
          * High School Democrats of America
          * We The People (Constitutional Scholars)
          * Asian Debate League
          * National Speech and Debate
          * National Speech and Debate Association
          * WSDC Taiwan
          * Profile in Courage Essay Contest 
          * Adroit Prizes for Poetry and Prose
          * Bennington College Essay competition ( Young Writers Awards)
          * Betty L. Yu and Jin C. Yu Creative Writing Prize
          * DNA Day Essay Competition
          * Immerse Essay Competition
          * John Locke Essay Competition
          * Kuen Tai Writing Competition
          * Lewis Center for the Arts
          * High School Contests"
          * National Scholastic Press Association (Pacemaker and Individual Awards)
          * NCTE Student Writing Awards
          * NYTimes Contest
          * Polyphony Lit Seasonal Essay Competitions
          * Scholastic Art & Writing Awards
          * The Concord Review
          * World Historian Student Essay Competition
          * AI Song Contest
          * Cambridge Re:Think
          * MIT Inspire (Arts, Humanities, & Social Sciences)
          * Project Paradigm
          * Regeneron STS
          * Shell Eco-marathon regional mileage competitions
          * Columbia Political Review's High School Essay Contest
          * Congressional Award

      4. **Summer Activities**  
        - Recommend 1–2 summer programs per year with:
          * Application deadlines
          * Eligibility criteria
          * Program costs and aid
          * Outcomes and selectivity (e.g., publication, college credit)
        - Here is a list of summer programs for reference:
          * Aspire: Five-Week Music Performance Intensive
          * Berklee Summer Programs
          * Early College Program Summer Institute
          * High School Summer Live Courses
          * Pratt Institute Summer Precollege
          * Sotheby's Institute of Art Summer Institute
          * UAL Summer Courses
          * Manhattan School of Music Pre-college
          * Stevens Select Summer Scholars Program
          * LaunchX IN PERSON
          * Wharton Global Youth Programs (LBW)
          * Berkeley High School Entrepreneurship
          * LaunchX Online
          * Wharton Global Youth Programs (non LBW)
          * Penn State BOSS business program
          * UCLA Anderson High School Discovery
          * MathILy
          * Veritas AI
          * MIT RSI
          * PROMYS
          * Ross Math Program
          * USA/Canada Mathcamp
          * Honors Math Program
          * Wolfram High School Summer
          * Princeton AI4All
          * AI Scholars CMU
          * YSPA (Yale Summer Program in Astrophysics)
          * RAL Work Placement
          * Imperial Global Summer School
          * Inspirit AI
          * Kode With Klossy
          * NYU TISCH SUMMER HIGH SCHOOL DRAMATIC WRITING PROGRAM 
          * Chapman Summer Film Academy 
          * Socapa Screenwriting Camp
          * Iowa Young Writer's Studio
          * Kenyon Review Young Writers Workshop
          * Clinical Science, Technology and Medicine Summer Internships
          * BU Rise
          * Stanford Institutes of Medicine Summer Research Program
          * Summer Internship in Biomedical Research (SIP)
          * NTU Yau Lab
          * SSP
          * Garcia Polymers Center Summer Program
          * Salish Sea Sciences Pre-College Program
          * Penn Medicine Summer Program
          * Summer High School Internship Program (Fred Hutchinson Cancer Center)
          * Wake Forest Summer Immersion (business math science film law etc)
          * COSMOS
          * Notre Dame Leadership Seminars
          * UChicago Summer College
          * UCSB Research Mentorship Program
          * YYGS
          * Harvard: Pre-College & Secondary School Program
          * Boston College Six-Week Honors Program
          * UMass Amherst Research Intensives
          * Boston Leadership Institute
          * Boston University High School Honors
          * CMU pre-college
          * Cornell Summer Session
          * Emory Pre-College and Summer College
          * Math BioU and Bio Exlpor
          * Northwestern College Preparation Program
          * Purdue Summer College for High School Students
          * Stanford Summer Session
          * UC Berkeley Pre-College
          * UPenn Summer Academies.
          * Oxford Summer Courses
          * Barnard Pre-College Programs
          * Brown Pre-college program
          * Duke Pre-College program
          * Johns Hopkins CTY
          * KCL Pre-U
          * LMU Pre-College
          * NSLC
          * Rice University Visiting Owls
          * RISD Summer
          * Sarah Lawrence Pre-college Summer Programs
          * Smith College Summer Precollege Programs
          * SOCAPA camps (general)
          * Syracuse University Summer College
          * Tufts Pre-College Programs
          * UBC Future Global Leaders
          * UCL Pre-U
          * University of Rochester Pre-College Online
          * UMass Amherst Precollege
          * Syracuse Summer College Research Immersion
          * Columbia University Pre-College Programs
          * Adventures in Veterinary Medicine (Tufts Pre-college)
          * Bank of America Student Leaders
          * Simons Summer Research Program
          * Telluride Association Summer Seminar
          * Clark Young Scholars
          * Northwestern Medill Summer Journalism
          * Summer Journalism Program
          * Stanford Clinic Neuroscience Immersion Program (CNI-X)
          * NYU Middle/High School
          * UCLA Pre-college summer institute
          * Summer Business Programs
          * Walter Reed GEM
          * Georgetown Summer Academies
          * NYT Summer School
          * Rice Summer Camps
          * Vanderbilt Summer Academy
          * MSM Summer 
          * NTU Plus Academy
          * MSU Engineering
          * JHU EI
          * Middlebury Summer Language Immersion
          * Georgetown Global Academy
          * Stanford National Forensics Institute
          *  NIST Lab Placement (Colorado)
          * Navy STEM 

      5. **Essay Brainstorming & Application "Theme"**  
        - Begin in Spring or Summer of junior year:
        - Brainstorm 2–3 Common App essay themes with prompts
        - Explore personal narratives that align with academic/extracurricular identity
        - Ensure themes connect to activity list and intended majors

      6. **Letters of Recommendation**  
        - Include tasks such as:
          * Identifying potential recommenders by Spring of junior year
          * Building relationships through engagement and participation
          * Preparing and submitting brag sheets or draft bullet points for recommenders

      Notes:
        - Each period must prioritize seasonally appropriate actions:
          * E.g., summer = programs and projects; fall = club leadership and college visits; winter = test registration and deadlines.
          * Avoid duplicate suggestions across periods.
        - Do not suggest tasks the student has already completed (e.g., don't suggest starting SAT prep if SAT score is in profile).


      ### Next Steps Instructions:
      - Include exactly 5 high-priority, immediately actionable items for the next 30–60 days, derived from the timeline.
      - Be specific and strategic — e.g., "Register for the August SAT," "Email 2 potential research mentors," or "Draft 3 essay topic outlines." Begin each instruction with a verb.
      - For each step, include relevant data points, deadlines, or benchmarks to guide execution (e.g., score targets, word count limits, due dates).

      ### Style and Tone:
      - Use clear, professional language
      - Be honest but supportive. If a student's current profile does not align with Ivy League admissions, state that clearly and recommend better-fit options
      - Ensure each section offers new value — do not repeat the same points across sections
      - Be data-driven and specific rather than generic

      ### Contextual Instructions:
      - Today's date is ${new Date().toISOString().split('T')[0]}. Use this to ensure all recommendations are timely and relevant.
      - Assume the student is either from the U.S. or Taiwan. Base summer programs, extracurriculars, and opportunities on what is realistically available based on their high school location.
      - If any information is missing, make reasonable assumptions based on available information.
      - The Common App allows 10 activities and 5 awards. Spread these throughout the timeline using real, named competitions, programs, and initiatives. Focus on key themes: leadership, community service, academic alignment, initiative, and competitiveness.
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
      console.log('AI service unavailable.');
      throw new Error('All our counselors are busy right now. Please try again later.');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return a proper error instead of a fallback
    throw new Error('All our counselors are busy right now. Please try again later.');
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
  
  // For free users, show half the sections (rounded down) with all events in those sections
  if (limitedData.timeline && Array.isArray(limitedData.timeline)) {
    // Log original period count
    console.log(`Original period count: ${limitedData.timeline.length}`);
    
    // Calculate how many periods to keep - half of total, rounded down
    const periodsToKeep = Math.floor(limitedData.timeline.length / 2);
    console.log(`Keeping ${periodsToKeep} periods out of ${limitedData.timeline.length}`);
    
    // Keep only the first N periods (half of total)
    limitedData.timeline = limitedData.timeline.slice(0, periodsToKeep);
    
    console.log(`After slicing, keeping ${limitedData.timeline.length} periods`);
    
    // Count total events in the limited timeline
    const limitedEventCount = limitedData.timeline.reduce((count, period) => {
      if (Array.isArray(period.events)) {
        return count + period.events.length;
      }
      return count;
    }, 0);
    
    console.log(`Total events in limited timeline: ${limitedEventCount}`);
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