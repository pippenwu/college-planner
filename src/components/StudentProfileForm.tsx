import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateCollegeReport } from "../services/openaiService";
import ReportDisplay from "./ReportDisplay";
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
  highSchool: z.string().min(1, "High school is required"),
  currentGrade: z.enum(["<9th", "9th", "10th", "11th", "12th"], {
    required_error: "Current grade is required",
  }),

  // Intended Major and College List
  intendedMajors: z.string().min(1, "Please enter at least one major or 'Undecided'"),
  collegeList: z.string().optional(),

  // Academics & Testing
  testScores: z.array(z.object({
    testName: z.string().optional(),
    score: z.string().optional(),
  })).default([{ testName: "SAT", score: "" }]),
  courseHistory: z.string().optional(),

  // Extracurricular Activities
  activities: z.array(z.object({
    name: z.string().optional(),
    notes: z.string().optional()
  })).optional().default([{ name: "", notes: "" }]),

  // Additional Information
  additionalInfo: z.string().optional(),
});

// Define the form values type based on the schema
type FormValues = z.infer<typeof formSchema>;

// Define form sections
const FORM_SECTIONS = [
  {
    id: "student-info",
    title: "Basic Info",
    description: "Tell us about yourself",
  },
  {
    id: "majors-colleges",
    title: "Majors & Colleges",
    description: "Your academic interests and colleges",
  },
  {
    id: "academics",
    title: "Academics",
    description: "Your scores and coursework",
  },
  {
    id: "activities",
    title: "Activities",
    description: "Your extracurricular activities",
  }
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
      testScores: [{ testName: "SAT", score: "" }],
      courseHistory: "",
      activities: [{ name: "", notes: "" }],
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
      const report = await generateCollegeReport(data);
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

  // Function to render field labels with required indicator
  const FieldLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <FormLabel>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );

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
                        placeholder="John Smith" 
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
                  <FieldLabel required>Current High School</FieldLabel>
                  <FormControl>
                    <Input placeholder="Westlake High School" {...field} />
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
                  <FieldLabel required>Current Grade</FieldLabel>
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

      case "majors-colleges":
        return (
          <div className="space-y-6" key="majors-colleges-section">
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
                    <FieldLabel required>Intended Major(s)</FieldLabel>
                    <FormControl>
                      <Input 
                        placeholder="Computer Science, Business Analytics" 
                        value={field.value} 
                        onChange={handleChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 text-sm mt-1">
                      You can list multiple majors. If not yet decided, you may put "Undecided."
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
                  <FormLabel>College List</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Stanford, MIT, UC Berkeley, NYU, University of Michigan"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500 text-sm mt-1">
                    Colleges you intend to apply to. If you do not have an idea yet, you may leave this list blank.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "academics":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Test Scores</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentScores = form.getValues("testScores") || [];
                    form.setValue("testScores", [
                      ...currentScores,
                      { testName: "", score: "" }
                    ]);
                  }}
                >
                  Add Test Score
                </Button>
              </div>
              
              <FormDescription className="text-gray-500 text-sm">
                Enter scores for tests you've taken. For AP or IB exams, include the subject (e.g., "Calculus BC: 5").
              </FormDescription>
              
              {form.watch("testScores")?.map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`testScores.${index}.testName`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a test" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white">
                              <SelectItem value="SAT">SAT</SelectItem>
                              <SelectItem value="ACT">ACT</SelectItem>
                              <SelectItem value="PSAT/NMSQT">PSAT/NMSQT</SelectItem>
                              <SelectItem value="TOEFL">TOEFL</SelectItem>
                              <SelectItem value="IELTS">IELTS</SelectItem>
                              <SelectItem value="AP">AP Exam</SelectItem>
                              <SelectItem value="IB">IB Exam</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`testScores.${index}.score`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                placeholder={
                                  form.watch(`testScores.${index}.testName`) === "SAT" ? "1480" :
                                  form.watch(`testScores.${index}.testName`) === "ACT" ? "32" :
                                  form.watch(`testScores.${index}.testName`) === "PSAT/NMSQT" ? "1420" :
                                  form.watch(`testScores.${index}.testName`) === "TOEFL" ? "105" :
                                  form.watch(`testScores.${index}.testName`) === "IELTS" ? "7.5" :
                                  form.watch(`testScores.${index}.testName`) === "AP" ? "Calculus BC: 5" :
                                  form.watch(`testScores.${index}.testName`) === "IB" ? "Mathematics HL: 7" :
                                  "Score or status"
                                } 
                                {...field} 
                                className="flex-grow"
                              />
                              {form.watch(`testScores.${index}.testName`) && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {form.watch(`testScores.${index}.testName`) === "SAT" ? "/ 1600" :
                                   form.watch(`testScores.${index}.testName`) === "ACT" ? "/ 36" :
                                   form.watch(`testScores.${index}.testName`) === "PSAT/NMSQT" ? "/ 1520" :
                                   form.watch(`testScores.${index}.testName`) === "TOEFL" ? "/ 120" :
                                   form.watch(`testScores.${index}.testName`) === "IELTS" ? "/ 9" :
                                   form.watch(`testScores.${index}.testName`) === "AP" ? "(1-5)" :
                                   form.watch(`testScores.${index}.testName`) === "IB" ? "(1-7)" :
                                   form.watch(`testScores.${index}.testName`) === "Other" ? "" : ""}
                                </span>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => {
                        const currentScores = form.getValues("testScores");
                        form.setValue(
                          "testScores",
                          currentScores.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-red-500"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="courseHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course History</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="AP Calculus BC (A+), AP Biology (A), AP Computer Science (A), Honors Chemistry (A-), Spanish III (B+)"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List courses you've taken with grades if available (include AP scores if applicable)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "activities":
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
                        <Input placeholder="Debate Team" {...field} />
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
                      <FormLabel>Activity Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="President, 5 hours/week, 4 years. Won regional championship, organized fundraiser for local shelter."
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
                  { name: "", notes: "" }
                ]);
              }}
            >
              Add Another Activity
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Navigation buttons
  const renderNavigationButtons = () => {
    // Activities is now the last section (index 3)
    const isLastSection = currentSection === FORM_SECTIONS.length - 1;
    
    return (
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousSection}
          disabled={currentSection === 0}
        >
          Previous
        </Button>
        
        {!isLastSection ? (
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
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : "Generate Plan"}
          </Button>
        )}
      </div>
    );
  };

  // If a report has been generated, show the report display component instead of the form
  if (result) {
    return (
      <ReportDisplay 
        report={result}
        studentName={submittedData?.studentName}
        studentGrade={submittedData?.currentGrade}
        onStartOver={() => {
          setResult(null);
          setSubmittedData(null);
          setCurrentSection(0);
          setCompletedSections([]);
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {isLoading && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg text-center animate-pulse">
          <p className="text-lg font-semibold mb-4">
            <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />
            Creating your personalized college application plan...
          </p>
          <p className="text-sm text-gray-600 mb-4">This may take a minute or two</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: "100%" }}></div>
          </div>
        </div>
      )}
      
      {result && !isLoading ? (
        <ReportDisplay 
          report={result} 
          studentName={submittedData?.studentName}
          studentGrade={submittedData?.currentGrade}
          onStartOver={() => {
            setResult(null);
            setSubmittedData(null);
            setCurrentSection(0);
            setCompletedSections([]);
          }}
        />
      ) : (
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
      )}
    </div>
  );
} 