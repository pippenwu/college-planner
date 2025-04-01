import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes - in production, use a backend API
});

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

export async function generateCollegeReport(studentProfile: StudentProfile): Promise<string> {
  try {
    const prompt = constructPrompt(studentProfile);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a highly experienced college counselor who helps students find the best college matches and develop application strategies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content || "Unable to generate report.";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to generate college report. Please try again later.");
  }
}

function constructPrompt(studentProfile: StudentProfile): string {
  return `
Please analyze the following student profile and provide a detailed college counseling report.
Structure the report with markdown formatting and include the following sections:
1. Recommended Schools (categorized as Reach, Target, and Safety schools)
2. Recommended Majors based on interests
3. Essay Theme Ideas
4. Summer Activity Suggestions
5. Application Strategy

Student Profile:
- Unweighted GPA: ${studentProfile.gpaUnweighted}
- Weighted GPA: ${studentProfile.gpaWeighted}
- SAT Score: ${studentProfile.satScore || "Not provided"}
- ACT Score: ${studentProfile.actScore || "Not provided"}
- TOEFL/IELTS Score: ${studentProfile.toeflScore || "Not provided"}
- Intended Major(s): ${studentProfile.intendedMajor}
- Academic Interests: ${studentProfile.academicInterests}
- Extracurricular Activities: ${studentProfile.extracurriculars}
- Awards/Honors: ${studentProfile.awards || "None specified"}
- Budget Constraints: ${studentProfile.budget}
- Preferred Location: ${studentProfile.location || "No preference"}
- College Size Preference: ${studentProfile.collegeSize || "No preference"}
- College Prestige Importance: ${studentProfile.collegePrestige || "Not specified"}
- Current College List: ${studentProfile.collegeList || "No list provided"}
- Additional Information: ${studentProfile.additionalInfo || "None provided"}

Please provide a comprehensive and personalized analysis that will help this student make informed decisions about their college application process. Be specific with your recommendations.
`;
} 