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
          maxOutputTokens: 2048,
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
      return content.replace(/\n/g, '<br />');
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

EXTRACURRICULAR ACTIVITIES:
- ${formattedActivities}

ADDITIONAL INFORMATION:
${additionalInfo || "None provided"}

Based on this profile, provide a detailed college application plan, including:

1. RECOMMENDED SCHOOLS (8-10 schools with a good mix of reach, target, and safety schools)
   - For each school, explain why it would be a good fit for this student

2. RECOMMENDED MAJORS
   - List 3-5 potential majors aligned with the student's interests
   - Explain why each would be a good fit

3. ESSAY THEME IDEAS
   - Suggest 3-5 potential essay themes based on the student's experiences
   - Provide specific angles on how to approach each theme

4. SUMMER ACTIVITY SUGGESTIONS
   - Recommend 3-5 activities to strengthen their application
   - Explain how each connects to their intended major/career path

5. APPLICATION STRATEGY
   - Timeline for completing applications
   - Tips for securing strong recommendation letters
   - Strategies for highlighting strengths and addressing weaknesses

Present the information in a well-organized format with headings and bullet points. Make all suggestions specific to the student's unique profile.`;
}

// Generate a fallback report if the API call fails
function generateFallbackReport(profile: StudentProfile): string {
  return `
<h2>College Application Plan</h2>

<p><em>Note: This is a fallback report generated without AI assistance. For a complete personalized report, please try again later.</em></p>

<h3>Initial Analysis</h3>
<p>Based on your profile ${profile.currentGrade ? `as a ${profile.currentGrade} student` : ""} ${profile.highSchool ? `at ${profile.highSchool}` : ""} ${profile.intendedMajors ? `interested in ${profile.intendedMajors}` : ""}, here are some general recommendations:</p>

<h3>Recommended Schools</h3>
<p>Consider researching schools that match your preferences for ${profile.preferredLocation || "any"} location, ${profile.preferredSize || "any"} size, and ${profile.preferredPrestige || "any"} prestige level.</p>

<h3>Next Steps</h3>
<ul>
  <li>Research colleges that offer strong programs in ${profile.intendedMajors || "your areas of interest"}</li>
  <li>Prepare for standardized tests if you haven't already</li>
  <li>Continue developing your extracurricular profile</li>
  <li>Begin thinking about potential essay topics</li>
</ul>

<p>For more detailed guidance, please try generating a report again later, or consult with a college counselor.</p>
`;
} 