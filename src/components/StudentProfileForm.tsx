import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateCollegeReport, type StudentProfile } from "../services/openaiService";
import { generatePDF } from "../utils/pdfUtils";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Textarea } from "./ui/textarea";

// Define form schema using Zod
const formSchema = z.object({
  // Student Information
  studentName: z.string().optional(),
  highSchool: z.string().optional(),
  currentGrade: z.enum(["<9th", "9th", "10th", "11th", "12th"]).optional(),

  // Intended Major and College List
  intendedMajors: z.string().optional(),
  collegeList: z.string().optional(),
  preferredLocation: z.enum(["Northeast", "Southeast", "Midwest", "West", "Any"]).optional(),
  preferredSize: z.enum(["Small (<5000)", "Medium (5000-15000)", "Large (>15000)", "Any"]).optional(),
  preferredPrestige: z.enum(["T20", "T50", "T100", "Any"]).optional(),

  // Academics & Standardized Testing
  satScore: z.string().optional(),
  actScore: z.string().optional(),
  toeflScore: z.string().optional(),
  ieltsScore: z.string().optional(),
  apScores: z.array(z.object({
    subject: z.string().optional(),
    score: z.number().min(1).max(5).optional().default(5)
  })).optional(),
  courses: z.array(z.object({
    name: z.string().optional(),
    grade: z.string().optional()
  })).optional(),

  // Extracurricular Activities
  activities: z.array(z.object({
    name: z.string().optional(),
    position: z.string().optional(),
    timeInvolved: z.string().optional(),
    notes: z.string().optional()
  })).optional().default([{ name: "", position: "", timeInvolved: "", notes: "" }]),

  // Additional Information
  additionalInfo: z.string().optional(),
});

// Define the form values type based on the schema
type FormValues = z.infer<typeof formSchema>;

// Define form sections
const FORM_SECTIONS = [
  {
    id: "student-info",
    title: "Student Information",
    description: "Basic information about you",
  },
  {
    id: "college-preferences",
    title: "Intended Major and College List",
    description: "Your academic interests and college preferences",
  },
  {
    id: "academics",
    title: "Academics & Standardized Testing",
    description: "Your academic performance and test scores",
  },
  {
    id: "extracurriculars",
    title: "Extracurricular Activities",
    description: "Your activities, awards, and honors",
  },
  {
    id: "additional",
    title: "Additional Information",
    description: "Any other relevant information",
  },
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
      studentName: "",
      highSchool: "",
      intendedMajors: "",
      collegeList: "",
      preferredLocation: undefined,
      preferredSize: undefined,
      preferredPrestige: undefined,
      satScore: "",
      actScore: "",
      toeflScore: "",
      ieltsScore: "",
      activities: [{ name: "", position: "", timeInvolved: "", notes: "" }],
      courses: [{ name: "", grade: "" }],
      apScores: [{ subject: "", score: 5 }],
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
    console.log("Form submitted with data:", data);
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

  // Add this function to show form errors
  const handleFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    alert("Please fill out all required fields before submitting.");
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
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "student-info":
        return (
          <div className="space-y-6" key="student-info-section">
            <FormField
              key="studentName-field"
              control={form.control}
              name="studentName"
              render={({ field }) => {
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                };
                
                return (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        value={field.value} 
                        onChange={handleChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              key="highSchool-field"
              control={form.control}
              name="highSchool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current High School</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your high school name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              key="currentGrade-field"
              control={form.control}
              name="currentGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Grade</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your current grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="<9th">Before 9th Grade</SelectItem>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "college-preferences":
        return (
          <div className="space-y-6" key="college-preferences-section">
            <FormField
              key="intendedMajors-field"
              control={form.control}
              name="intendedMajors"
              render={({ field }) => {
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                };
                
                return (
                  <FormItem>
                    <FormLabel>Intended Major(s)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Computer Science, Business, Engineering" 
                        value={field.value} 
                        onChange={handleChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      You can list multiple majors separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              key="collegeList-field"
              control={form.control}
              name="collegeList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College List (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the colleges you're considering applying to..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              key="preferredLocation-field"
              control={form.control}
              name="preferredLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred College Location</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="Northeast">Northeast</SelectItem>
                      <SelectItem value="Southeast">Southeast</SelectItem>
                      <SelectItem value="Midwest">Midwest</SelectItem>
                      <SelectItem value="West">West</SelectItem>
                      <SelectItem value="Any">Any Location</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              key="preferredSize-field"
              control={form.control}
              name="preferredSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred College Size</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="Small (<5000)">Small (&lt;5000 students)</SelectItem>
                      <SelectItem value="Medium (5000-15000)">Medium (5000-15000 students)</SelectItem>
                      <SelectItem value="Large (>15000)">Large (&gt;15000 students)</SelectItem>
                      <SelectItem value="Any">Any Size</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              key="preferredPrestige-field"
              control={form.control}
              name="preferredPrestige"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred College Prestige</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred prestige" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="T20">Top 20</SelectItem>
                      <SelectItem value="T50">Top 50</SelectItem>
                      <SelectItem value="T100">Top 100</SelectItem>
                      <SelectItem value="Any">Any Ranking</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "academics":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="satScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SAT Score (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your SAT score" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ACT Score (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your ACT score" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="toeflScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TOEFL Score (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your TOEFL score" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ieltsScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IELTS Score (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your IELTS score" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">AP Scores</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentScores = form.getValues("apScores") || [];
                    form.setValue("apScores", [
                      ...currentScores,
                      { subject: "", score: 5 }
                    ]);
                  }}
                >
                  Add AP Score
                </Button>
              </div>
              {form.watch("apScores")?.map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`apScores.${index}.subject`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Calculus BC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`apScores.${index}.score`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score (1-5)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Course History</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentCourses = form.getValues("courses") || [];
                    form.setValue("courses", [
                      ...currentCourses,
                      { name: "", grade: "" }
                    ]);
                  }}
                >
                  Add Course
                </Button>
              </div>
              {form.watch("courses")?.map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`courses.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., AP Calculus BC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`courses.${index}.grade`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "extracurriculars":
        return (
          <div className="space-y-6">
            {form.watch("activities")?.map((_, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Activity {index + 1}</h3>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const currentActivities = form.getValues("activities");
                        form.setValue(
                          "activities",
                          currentActivities.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`activities.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Debate Team Captain" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`activities.${index}.position`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Captain, President, Member" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`activities.${index}.timeInvolved`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Involved (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10 hours/week" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`activities.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional context about this activity..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentActivities = form.getValues("activities");
                form.setValue("activities", [
                  ...currentActivities,
                  { name: "", position: "", timeInvolved: "", notes: "" }
                ]);
              }}
            >
              Add Another Activity
            </Button>
          </div>
        );

      case "additional":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other context or information you'd like to provide..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

  // If a report has been generated, show the report instead of the form
  if (result) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Your College Application Plan</h2>
        <div className="prose max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result }}></div>
        <div className="mt-8 flex justify-between">
          <Button onClick={() => {
            setResult(null);
            setSubmittedData(null);
            setCurrentSection(0);
            setCompletedSections([]);
          }}>
            Start Over
          </Button>
          
          <Button 
            onClick={() => {
              if (result) {
                generatePDF(result, submittedData?.studentName || "Student");
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Download Report as PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-8">
            <ProgressIndicator />
            <div key={`section-${FORM_SECTIONS[currentSection].id}`}>
              {renderSection(FORM_SECTIONS[currentSection].id)}
            </div>
            {renderNavigationButtons()}
          </form>
        </Form>
      </div>
    </div>
  );
} 