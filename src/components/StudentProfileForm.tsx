import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateCollegeReport, type StudentProfile } from "../services/openaiService";
import { generatePDF } from "../utils/pdfUtils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";

const formSchema = z.object({
  // Academic information
  gpaUnweighted: z.string().optional(),
  gpaWeighted: z.string().optional(),
  satScore: z.string().optional(),
  actScore: z.string().optional(),
  toeflScore: z.string().optional(),
  
  // Academic interests
  intendedMajor: z.string().optional(),
  academicInterests: z.string().optional(),
  
  // Extracurricular activities
  extracurriculars: z.string().optional(),
  awards: z.string().optional(),
  
  // College preferences
  budget: z.string().optional(),
  location: z.string().optional(),
  collegeSize: z.string().optional(),
  collegePrestige: z.string().optional(),
  
  // Optional additional information
  collegeList: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define sections of the form
const FORM_SECTIONS = [
  { id: 0, title: "Academic Information" },
  { id: 1, title: "Academic Interests" },
  { id: 2, title: "Extracurricular Activities" },
  { id: 3, title: "College Preferences" },
  { id: 4, title: "Additional Information" }
];

export function StudentProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  
  // Track the current section/step
  const [currentSection, setCurrentSection] = useState(0);
  
  // Track completed sections
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gpaUnweighted: "",
      gpaWeighted: "",
      satScore: "",
      actScore: "",
      toeflScore: "",
      intendedMajor: "",
      academicInterests: "",
      extracurriculars: "",
      awards: "",
      budget: "",
      location: "",
      collegeSize: "",
      collegePrestige: "",
      collegeList: "",
      additionalInfo: "",
    },
  });

  // Function to move to the next section
  const goToNextSection = () => {
    // Mark current section as completed
    if (!completedSections.includes(currentSection)) {
      setCompletedSections([...completedSections, currentSection]);
    }
    
    if (currentSection < FORM_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  // Function to move to the previous section
  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Function to jump to a specific section
  const jumpToSection = (sectionId: number) => {
    setCurrentSection(sectionId);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setSubmittedData(data);
    try {
      // Call OpenAI API through our service
      const report = await generateCollegeReport(data as StudentProfile);
      setResult(report);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Progress indicator component
  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {FORM_SECTIONS.map((section, index) => (
          <div key={section.id} className="flex flex-col items-center">
            <div 
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer
                ${currentSection === index 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : completedSections.includes(index)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-500 border-gray-300'}`}
              onClick={() => jumpToSection(index)}
            >
              {completedSections.includes(index) 
                ? <Check className="w-5 h-5" /> 
                : index + 1}
            </div>
            <span className="text-xs mt-1 text-center">{section.title}</span>
            {index < FORM_SECTIONS.length - 1 && (
              <div className="absolute left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-0.5 bg-gray-200 -z-10" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ 
            width: `${((currentSection + 1) / FORM_SECTIONS.length) * 100}%` 
          }} 
        />
      </div>
    </div>
  );

  // Render the appropriate section based on currentSection
  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Academic Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gpaUnweighted">Unweighted GPA</Label>
                  <Input
                    id="gpaUnweighted"
                    placeholder="e.g., 3.8"
                    {...form.register("gpaUnweighted")}
                  />
                  {form.formState.errors.gpaUnweighted && (
                    <p className="text-red-500 text-sm">{form.formState.errors.gpaUnweighted.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpaWeighted">Weighted GPA</Label>
                  <Input
                    id="gpaWeighted"
                    placeholder="e.g., 4.2"
                    {...form.register("gpaWeighted")}
                  />
                  {form.formState.errors.gpaWeighted && (
                    <p className="text-red-500 text-sm">{form.formState.errors.gpaWeighted.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="satScore">SAT Score (if available)</Label>
                  <Input
                    id="satScore"
                    placeholder="e.g., 1480"
                    {...form.register("satScore")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actScore">ACT Score (if available)</Label>
                  <Input
                    id="actScore"
                    placeholder="e.g., 32"
                    {...form.register("actScore")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toeflScore">TOEFL/IELTS Score (if applicable)</Label>
                  <Input
                    id="toeflScore"
                    placeholder="e.g., 105"
                    {...form.register("toeflScore")}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Academic Interests</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intendedMajor">Intended Major(s)</Label>
                <Input
                  id="intendedMajor"
                  placeholder="e.g., Computer Science, Business"
                  {...form.register("intendedMajor")}
                />
                {form.formState.errors.intendedMajor && (
                  <p className="text-red-500 text-sm">{form.formState.errors.intendedMajor.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicInterests">Academic Interests</Label>
                <textarea
                  id="academicInterests"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your academic interests, favorite subjects, etc."
                  {...form.register("academicInterests")}
                ></textarea>
                {form.formState.errors.academicInterests && (
                  <p className="text-red-500 text-sm">{form.formState.errors.academicInterests.message}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Extracurricular Activities</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="extracurriculars">Extracurricular Activities</Label>
                <textarea
                  id="extracurriculars"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="List your extracurricular activities, including clubs, sports, volunteering, work experience, etc."
                  {...form.register("extracurriculars")}
                ></textarea>
                {form.formState.errors.extracurriculars && (
                  <p className="text-red-500 text-sm">{form.formState.errors.extracurriculars.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="awards">Awards and Honors</Label>
                <textarea
                  id="awards"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="List any awards, honors, or recognition you've received"
                  {...form.register("awards")}
                ></textarea>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">College Preferences</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Constraints</Label>
                <Input
                  id="budget"
                  placeholder="e.g., $30,000/year, need financial aid, etc."
                  {...form.register("budget")}
                />
                {form.formState.errors.budget && (
                  <p className="text-red-500 text-sm">{form.formState.errors.budget.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Preferred Location</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("location", value)}
                    defaultValue={form.getValues("location")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="northeast">Northeast</SelectItem>
                      <SelectItem value="midwest">Midwest</SelectItem>
                      <SelectItem value="south">South</SelectItem>
                      <SelectItem value="west">West</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="no-preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="collegeSize">College Size</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("collegeSize", value)}
                    defaultValue={form.getValues("collegeSize")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (&lt; 5,000)</SelectItem>
                      <SelectItem value="medium">Medium (5,000 - 15,000)</SelectItem>
                      <SelectItem value="large">Large (&gt; 15,000)</SelectItem>
                      <SelectItem value="no-preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="collegePrestige">College Prestige</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("collegePrestige", value)}
                    defaultValue={form.getValues("collegePrestige")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select importance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very-important">Very Important</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="somewhat-important">Somewhat Important</SelectItem>
                      <SelectItem value="not-important">Not Important</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collegeList">College List (if you have one)</Label>
                <textarea
                  id="collegeList"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="List any colleges you're already considering"
                  {...form.register("collegeList")}
                ></textarea>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information</Label>
                <textarea
                  id="additionalInfo"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Any other information you'd like to share"
                  {...form.register("additionalInfo")}
                ></textarea>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Navigation buttons
  const renderNavigationButtons = () => (
    <div className="flex justify-between mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={goToPreviousSection}
        disabled={currentSection === 0}
      >
        Previous
      </Button>
      
      {currentSection < FORM_SECTIONS.length - 1 ? (
        <Button
          type="button"
          onClick={goToNextSection}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next
        </Button>
      ) : (
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Generating Report..." : "Generate College Report"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!result ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <ProgressIndicator />
          {renderSection()}
          {renderNavigationButtons()}
        </form>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your College Counseling Report</h2>
            <Button 
              onClick={() => {
                setResult(null);
                setSubmittedData(null);
                setCurrentSection(0);
                setCompletedSections([]);
              }}
              variant="outline"
            >
              Start Over
            </Button>
          </div>
          
          {/* Debug display of submitted data */}
          <div className="mb-4 border border-gray-200 rounded">
            <details>
              <summary className="p-3 cursor-pointer text-blue-600">Show input data used for report</summary>
              <div className="p-3 bg-gray-50 text-sm">
                <pre className="whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(submittedData, null, 2)}</pre>
              </div>
            </details>
          </div>
          
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={() => {
                if (result) {
                  generatePDF(result, "Student");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Download Report as PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 