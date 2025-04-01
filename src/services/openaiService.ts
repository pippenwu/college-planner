// Using Google's Gemini API which offers a free tier
// You'll need to get an API key from https://aistudio.google.com/app/apikey
// but the free tier is generous (up to 60 requests per minute)

// Define the StudentProfile type to match our form schema exactly
interface StudentProfile {
  // Student Information
  studentName?: string;
  highSchool?: string;
  currentGrade?: string;

  // Intended Major and College List
  intendedMajors?: string;
  collegeList?: string;
  preferredLocation?: "Northeast" | "Southeast" | "Midwest" | "West" | "Any";
  preferredSize?: "Small (<5000)" | "Medium (5000-15000)" | "Large (>15000)" | "Any";
  preferredPrestige?: "T20" | "T50" | "T100" | "Any";

  // Academics & Standardized Testing
  testScores?: Array<{
    testName?: string;
    score?: string;
  }>;
  apScores?: Array<{
    subject?: string;
    score?: number;
  }>;
  courses?: Array<{
    name?: string;
    grade?: string;
  }>;

  // Extracurricular Activities
  activities?: Array<{
    name?: string;
    notes?: string;
  }>;

  // Additional Information
  additionalInfo?: string;

  // New course history field
  courseHistory?: string;
}

// Get Gemini API key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Function to generate a college report using Gemini API
export async function generateCollegeReport(profile: StudentProfile): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("No Gemini API key found in environment variables");
    return generateFallbackReport(profile);
  }

  try {
    console.log("Constructing prompt with profile data:", JSON.stringify(profile, null, 2));
    const prompt = constructPrompt(profile);
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096, // Increased token limit for more detailed reports
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.length > 0) {
      const content = data.candidates[0].content.parts[0].text;
      
      // Don't replace newlines with <br> since we're now using proper HTML
      return content;
    } else {
      console.error("Unexpected API response format:", data);
      return generateFallbackReport(profile);
    }

  } catch (error) {
    console.error("Error generating report:", error);
    return generateFallbackReport(profile);
  }
}

// Construct a prompt for the AI based on the student's profile
function constructPrompt(profile: StudentProfile): string {
  const studentName = profile.studentName || "the student";
  const currentGrade = profile.currentGrade || "current grade";
  const highSchool = profile.highSchool || "their high school";
  
  // Format test scores
  const testScoreText = profile.testScores && profile.testScores.length > 0
    ? profile.testScores
        .filter(test => test.testName)
        .map(test => {
          const { testName, score } = test;
          if (score) {
            return `${testName}: ${score}`;
          } else if (score === "Not taken yet") {
            return `${testName}: Not taken yet`;
          } else if (score === "Test optional") {
            return `${testName}: Test optional`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n')
    : '';
  
  return `
You are acting as a highly experienced, data-driven college counselor with 20+ years of experience helping students get into top universities. You are known for being specific, straightforward, and evidence-based in your recommendations. You use real admission statistics, reference specific programs and competitions, and set concrete targets for your students.

Please create a comprehensive college application plan for ${studentName}, who is in ${currentGrade} at ${highSchool}. Format your response in HTML with the following structure:

<section id="overview">
<h2>OVERVIEW</h2>
Write a concise assessment (under 80 words) of the student's current academic profile based on the information provided. Be direct about their competitiveness for their target schools, using specific data points for context. Don't sugarcoat if their profile doesn't align with their ambitions.
</section>

<section id="timeline">
<h2>PLAN</h2>
<TIMELINE>
This section should provide a structured timeline for the student's college preparation journey, divided into logical periods (e.g., "Summer Before Junior Year", "Fall of Junior Year").

For each period, include specific tasks, deadlines, and activities categorized as follows:
- "academics": For GPA improvement, coursework, standardized tests (SAT/ACT/AP/IB/PSAT), and academic preparation
- "extracurriculars": For competitions, awards, club activities, sports, internships, jobs, volunteering, projects, leadership roles, etc.
- "application": For essays, recommendation letters, financial aid, scholarship applications, college visits, interviews, etc.

IMPORTANT: The timeline must be formatted as valid JSON inside the timeline-data tags. Do not include any text explanations within these tags, only valid JSON array data. Ensure all quotes are properly escaped and all JSON syntax is correct.

&lt;timeline-data&gt;
[
  {
    "period": "Summer Before Junior Year",
    "events": [
      {
        "title": "Begin SAT/ACT Preparation",
        "category": "academics",
        "description": "Start preparing for standardized tests by taking practice tests and identifying areas for improvement.",
        "deadline": "August 31"
      },
      {
        "title": "Research Potential Schools",
        "category": "application",
        "description": "Create an initial list of schools based on preferences, location, and academic programs.",
        "deadline": "August 15"
      }
    ]
  }
]
&lt;/timeline-data&gt;

Each event must have: title, category (from the list above), description, and deadline fields. The category must be one of: "academics", "extracurriculars", or "application".
</TIMELINE>
</section>

<section id="next-steps">
<h2>NEXT STEPS</h2>
List 3-5 immediate, specific action items with concrete metrics where applicable (e.g., "Register for SAT and aim for 1500+" not just "study for standardized tests").
</section>

Use the following information to create your plan:

${profile.intendedMajors ? `Intended Majors: ${profile.intendedMajors}` : ''}
${profile.collegeList ? `Colleges of Interest: ${profile.collegeList}` : ''}
${testScoreText ? `Test Scores:\n${testScoreText}` : ''}
${profile.courseHistory ? `Course History: ${profile.courseHistory}` : ''}

${profile.activities && profile.activities.length > 0 ? 
  `Extracurricular Activities:
${profile.activities.map(activity => 
  `- ${activity.name}${activity.notes ? `: ${activity.notes}` : ''}`
).join('\n')}` : ''}

${profile.additionalInfo ? `Additional Information: ${profile.additionalInfo}` : ''}

Be brutally honest in your assessment. If the student's profile is not competitive for their target schools, say so directly and recommend more realistic options. Reference specific statistics such as:
- Actual middle 50% GPA/SAT/ACT ranges for target schools
- Specific EC achievements of successful applicants
- Admission rates for different majors at target schools
- Case studies of similar students, both successful and unsuccessful

When recommending extracurriculars, suggest specific named competitions (e.g., "Intel ISEF," "USACO Gold Division," "DECA Internationals") rather than generic activities.

Ensure the JSON in the timeline-data section is valid and complete. Each event must include concrete, measurable goals tied to admission data.
`;
}

// Generate a fallback report if the API call fails
function generateFallbackReport(profile: StudentProfile): string {
  const studentGrade = profile.currentGrade || "current";
  const schoolName = profile.highSchool || "your school";
  const interests = profile.intendedMajors || "your areas of interest";
  
  // Create a simple timeline data structure for the fallback report
  const currentYear = new Date().getFullYear();
  const fallbackTimelineData = [
    {
      "period": `Current Semester (${studentGrade})`,
      "events": [
        {
          "title": "Focus on Academics",
          "category": "academics",
          "description": "Maintain or improve your GPA in core academic subjects.",
          "deadline": "Ongoing",
          "url": "https://www.khanacademy.org/"
        },
        {
          "title": "Take Practice Tests",
          "category": "testing",
          "description": "Complete at least one practice SAT or ACT to establish your baseline score.",
          "deadline": "Within 1 month",
          "url": "https://www.collegeboard.org/"
        },
        {
          "title": "Join a Club",
          "category": "extracurricular",
          "description": "Find and join at least one school club related to your interests.",
          "deadline": "By end of semester",
          "url": ""
        }
      ]
    },
    {
      "period": `Summer ${currentYear}`,
      "events": [
        {
          "title": "Summer Course",
          "category": "academics",
          "description": "Consider enrolling in a summer course at a local community college.",
          "deadline": "Application usually due in spring",
          "url": ""
        },
        {
          "title": "Volunteer Work",
          "category": "extracurricular",
          "description": "Look for volunteer opportunities in your area of interest.",
          "deadline": "Start searching 2 months before summer",
          "url": "https://www.volunteermatch.org/"
        }
      ]
    },
    {
      "period": `Fall ${currentYear}`,
      "events": [
        {
          "title": "PSAT/NMSQT",
          "category": "testing",
          "description": "Take the PSAT/NMSQT which is typically offered in October.",
          "deadline": "Registration usually in September",
          "url": "https://www.collegeboard.org/psat-nmsqt"
        },
        {
          "title": "College Research",
          "category": "college-prep",
          "description": "Begin researching colleges that offer strong programs in your areas of interest.",
          "deadline": "Ongoing",
          "url": "https://www.collegeboard.org/bigfuture"
        }
      ]
    }
  ];
  
  return `
<section id="overview">
<h2>OVERVIEW</h2>
<p>You are currently a ${studentGrade} student at ${schoolName}. Based on the information provided, you're interested in exploring ${interests}. At this stage, it's important to build a strong academic foundation while developing extracurricular activities that align with your interests.</p>

<p>Since this is a fallback report created without AI assistance, we're providing general guidance that would be valuable for most students. For more personalized advice, please try generating a full report again when the service is available.</p>
</section>

<section id="timeline">
<h2>PLAN</h2>
<p>Here's a general timeline to help guide your college preparation journey:</p>

<div class="timeline-data">
${JSON.stringify(fallbackTimelineData, null, 2)}
</div>

<p>This timeline provides a starting point, but you should customize it based on your specific goals and circumstances.</p>
</section>

<section id="next-steps">
<h2>NEXT STEPS</h2>
<ul>
  <li><strong>Meet with your school counselor:</strong> Schedule an appointment within the next two weeks to discuss your college plans and course selection.</li>
  <li><strong>Create a study schedule:</strong> Develop a weekly study plan to maintain or improve your grades in all subjects.</li>
  <li><strong>Research summer programs:</strong> Spend 1-2 hours looking into summer opportunities related to ${interests}.</li>
  <li><strong>Take practice standardized tests:</strong> Complete at least one practice SAT or ACT to establish your baseline score.</li>
  <li><strong>Join a relevant club or activity:</strong> Find and join at least one school club related to your interests.</li>
</ul>

<p>For more detailed guidance tailored to your specific situation, please try generating a report again later, or consult with a college counselor.</p>
</section>
  `;
} 