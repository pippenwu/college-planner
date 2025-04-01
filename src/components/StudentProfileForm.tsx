import { zodResolver } from "@hookform/resolvers/zod";
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

export function StudentProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  
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

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!result ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Generating Report..." : "Generate College Report"}
          </Button>
        </form>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your College Counseling Report</h2>
            <Button 
              onClick={() => {
                setResult(null);
                setSubmittedData(null);
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