// Using Google's Gemini API which offers a free tier
// You'll need to get an API key from https://aistudio.google.com/app/apikey
// but the free tier is generous (up to 60 requests per minute)

// Define the StudentProfile type to match our form schema exactly
export interface StudentProfile {
  // Student Information
  studentName?: string;
  highSchool?: string;
  currentGrade?: "<9th" | "9th" | "10th" | "11th" | "12th";

  // Intended Major and College List
  intendedMajors?: string;
  collegeList?: string;
  preferredLocation?: "Northeast" | "Southeast" | "Midwest" | "West" | "Any";
  preferredSize?: "Small (<5000)" | "Medium (5000-15000)" | "Large (>15000)" | "Any";
  preferredPrestige?: "T20" | "T50" | "T100" | "Any";

  // Academics & Standardized Testing
  satScore?: string;
  actScore?: string;
  toeflScore?: string;
  ieltsScore?: string;
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
    position?: string;
    timeInvolved?: string;
    notes?: string;
  }>;

  // Additional Information
  additionalInfo?: string;
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
  const {
    studentName,
    highSchool,
    currentGrade,
    intendedMajors,
    collegeList,
    preferredLocation,
    preferredSize,
    preferredPrestige,
    satScore,
    actScore,
    toeflScore,
    ieltsScore,
    apScores,
    courses,
    activities,
    additionalInfo
  } = profile;

  // Format standardized test scores
  const testScores = [
    satScore ? `SAT: ${satScore}` : null,
    actScore ? `ACT: ${actScore}` : null,
    toeflScore ? `TOEFL: ${toeflScore}` : null,
    ieltsScore ? `IELTS: ${ieltsScore}` : null
  ].filter(Boolean).join(", ");

  // Format AP scores
  const formattedAPScores = apScores && apScores.length > 0
    ? apScores
      .filter(ap => ap.subject)
      .map(ap => `${ap.subject}: ${ap.score || "N/A"}`)
      .join(", ")
    : "None provided";

  // Format course history
  const formattedCourses = courses && courses.length > 0
    ? courses
      .filter(course => course.name)
      .map(course => `${course.name}: ${course.grade || "N/A"}`)
      .join("; ")
    : "None provided";

  // Format activities
  const formattedActivities = activities && activities.length > 0
    ? activities
      .filter(activity => activity.name)
      .map(activity => {
        let result = activity.name || "";
        if (activity.position) result += `, Position: ${activity.position}`;
        if (activity.timeInvolved) result += `, Time: ${activity.timeInvolved}`;
        if (activity.notes) result += `, Notes: ${activity.notes}`;
        return result;
      })
      .join("\n- ")
    : "None provided";

  // Get the country from the high school name if possible
  const possibleCountry = highSchool && (
    highSchool.toLowerCase().includes("taiwan") ? "Taiwan" :
    highSchool.toLowerCase().includes("china") ? "China" :
    highSchool.toLowerCase().includes("korea") ? "South Korea" :
    highSchool.toLowerCase().includes("japan") ? "Japan" :
    highSchool.toLowerCase().includes("india") ? "India" :
    "the United States"
  );

  return `
Generate a comprehensive college application plan for a high school student with the following profile:

STUDENT PROFILE:
- Name: ${studentName || "Not provided"}
- High School: ${highSchool || "Not provided"}
- Current Grade: ${currentGrade || "Not provided"}
- Intended Major(s): ${intendedMajors || "Not provided"}
- Preferred College Location: ${preferredLocation || "Not provided"}
- Preferred College Size: ${preferredSize || "Not provided"}
- Preferred College Prestige: ${preferredPrestige || "Not provided"}
- Test Scores: ${testScores || "None provided"}
- AP Scores: ${formattedAPScores}
- Course History: ${formattedCourses}
- College List (if provided): ${collegeList || "None provided"}
- Extracurricular Activities: ${formattedActivities.replace(/\n/g, " ")}
- Additional Information: ${additionalInfo || "None provided"}

Based on this profile, create a structured college application plan with the following three clearly defined sections:

<section id="overview">
<h2>OVERVIEW</h2>
<p>Provide a thorough assessment of the student's current academic and extracurricular standing. Analyze their strengths and areas for improvement. Consider their current grade level and how much time they have before college applications. Assess how their current profile aligns with their potential college and career goals. If they've specified target schools or majors, evaluate their current competitiveness for those options.</p>
</section>

<section id="timeline">
<h2>PLAN</h2>
<p>Create a detailed timeline from the student's current grade through senior year (12th grade). For each period, provide specific, actionable recommendations with real deadlines and details.</p>

<div class="timeline-data">
[
  {
    "period": "Current Semester (${currentGrade || 'Current Grade'})",
    "events": [
      {
        "title": "Event 1 Title",
        "category": "academics",
        "description": "Detailed description of what to do",
        "deadline": "Specific deadline or date range",
        "url": "Website URL if applicable"
      },
      {
        "title": "Event 2 Title",
        "category": "testing",
        "description": "Detailed description of what to do",
        "deadline": "Specific deadline or date range",
        "url": "Website URL if applicable"
      }
      // Add 3-5 more events
    ]
  },
  {
    "period": "Summer ${new Date().getFullYear()}",
    "events": [
      // Include 4-6 specific summer events with full details
    ]
  },
  {
    "period": "Fall Semester",
    "events": [
      // Include 4-6 specific events for next fall
    ]
  },
  // Continue with more periods: Spring, Summer, etc. until graduation
]
</div>

<p>Include guidance on course selection, standardized test dates, specific summer programs with application deadlines, extracurricular development, college visits, and application milestones.</p>

<p>Note that the student appears to be from ${possibleCountry} based on their high school, and tailor recommendations accordingly, including country-specific information.</p>
</section>

<section id="next-steps">
<h2>NEXT STEPS</h2>
<ul>
<!-- List 5-7 specific, actionable steps with details -->
<li><strong>Step 1:</strong> Specific action with deadline and details</li>
<li><strong>Step 2:</strong> Specific action with deadline and details</li>
<li><strong>Step 3:</strong> Specific action with deadline and details</li>
<li><strong>Step 4:</strong> Specific action with deadline and details</li>
<li><strong>Step 5:</strong> Specific action with deadline and details</li>
</ul>
</section>

For the PLAN section, ensure that the JSON data in the timeline-data div is valid and complete, as it will be parsed and used to create an interactive timeline visualization. Each event must include all the fields shown in the example (title, category, description, deadline, url). Use the following categories consistently: academics, testing, extracurricular, application, college-prep, campus-visit.

Present the overall report in proper HTML format with clear sections and proper HTML tags.`;
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