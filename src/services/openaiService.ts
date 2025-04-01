// Using Google's Gemini API which offers a free tier
// You'll need to get an API key from https://aistudio.google.com/app/apikey
// but the free tier is generous (up to 60 requests per minute)

export interface StudentProfile {
  gpaUnweighted: string;
  gpaWeighted: string;
  satScore: string;
  actScore: string;
  toeflScore: string;
  intendedMajor: string;
  academicInterests: string;
  extracurriculars: string;
  awards: string;
  budget: string;
  location: string;
  collegeSize: string;
  collegePrestige: string;
  collegeList: string;
  additionalInfo: string;
}

// Get Gemini API key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export async function generateCollegeReport(studentProfile: StudentProfile): Promise<string> {
  try {
    // Check if API key is available
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
      console.log("No Gemini API key found. Using fallback report.");
      return generateFallbackReport(studentProfile);
    }
    
    console.log("Using Gemini API key:", GEMINI_API_KEY.substring(0, 4) + '...');
    const prompt = constructPrompt(studentProfile);
    
    // Use the gemini-2.0-flash model as shown in the API quickstart
    console.log("Sending request to Gemini API with gemini-2.0-flash model...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    console.log("API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error details:", errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("Got successful response from Gemini API");
    
    // Check if the response has the expected structure
    if (!result.candidates || !result.candidates[0]?.content?.parts) {
      console.error("Unexpected API response format:", JSON.stringify(result));
      throw new Error("Unexpected API response format");
    }
    
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate report.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Provide a fallback response for demo purposes
    return generateFallbackReport(studentProfile);
  }
}

function constructPrompt(studentProfile: StudentProfile): string {
  return `
You are a professional college counselor. Please analyze the following student profile and provide a detailed college counseling report.
Structure the report with clear sections for:
1. Recommended Schools (categorized as Reach, Target, and Safety schools)
2. Recommended Majors based on interests
3. Essay Theme Ideas
4. Summer Activity Suggestions
5. Application Strategy

Student Profile:
- Unweighted GPA: ${studentProfile.gpaUnweighted || "Not provided"}
- Weighted GPA: ${studentProfile.gpaWeighted || "Not provided"}
- SAT Score: ${studentProfile.satScore || "Not provided"}
- ACT Score: ${studentProfile.actScore || "Not provided"}
- TOEFL/IELTS Score: ${studentProfile.toeflScore || "Not provided"}
- Intended Major(s): ${studentProfile.intendedMajor || "Not provided"}
- Academic Interests: ${studentProfile.academicInterests || "Not provided"}
- Extracurricular Activities: ${studentProfile.extracurriculars || "Not provided"}
- Awards/Honors: ${studentProfile.awards || "None specified"}
- Budget Constraints: ${studentProfile.budget || "Not provided"}
- Preferred Location: ${studentProfile.location || "No preference"}
- College Size Preference: ${studentProfile.collegeSize || "No preference"}
- College Prestige Importance: ${studentProfile.collegePrestige || "Not specified"}
- Current College List: ${studentProfile.collegeList || "No list provided"}
- Additional Information: ${studentProfile.additionalInfo || "None provided"}

Provide a comprehensive and personalized analysis that will help this student make informed decisions about their college application process.
`;
}

// Fallback function that returns a demo report if the API call fails
function generateFallbackReport(studentProfile: StudentProfile): string {
  // Create a simple report based on the student profile
  const major = studentProfile.intendedMajor || "Undecided";
  
  return `Report Generation Failed. Please try again later.`;
} 