import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { usePayment } from '../context/PaymentContext';
import { generateCollegeReport } from "../services/openaiService";
import ReportDisplay from "./ReportDisplay";
import SchoolLogos from "./SchoolLogos";
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
  const [pendingReportData, setPendingReportData] = useState<FormValues | null>(null);
  
  // Get payment state from context
  const { isPaid, initiatePayment, isProcessingPayment } = usePayment();
  
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

  // Use useEffect to generate the report when payment is successful
  useEffect(() => {
    const generateReport = async () => {
      if (isPaid && pendingReportData) {
        setIsLoading(true);
        try {
          const report = await generateCollegeReport(pendingReportData);
          setResult(report);
          setPendingReportData(null);
        } catch (error) {
          console.error("Error generating report:", error);
          toast.error("Failed to generate report. Please try again later.", {
            icon: '❌',
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca'
            },
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    generateReport();
  }, [isPaid, pendingReportData]);

  // Function to move to the next section
  const goToNextSection = () => {
    // Mark current section as completed
    if (!completedSections.includes(currentSection)) {
      setCompletedSections(prev => [...prev, currentSection]);
    }
    
    // Make sure we're not already on the last section
    const lastSectionIndex = FORM_SECTIONS.length - 1;
    if (currentSection < lastSectionIndex) {
      // Use a callback to ensure we're using the latest state
      setCurrentSection(prevSection => {
        const nextSection = prevSection + 1;
        console.log(`Setting section from ${prevSection} to ${nextSection}`);
        return nextSection;
      });
    } else {
      console.warn(`Already at last section (${currentSection}), can't go forward`);
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
    console.log("Current section at submission:", currentSection);
    
    // Only proceed with submission if we're actually on the last section
    const lastSectionIndex = FORM_SECTIONS.length - 1;
    if (currentSection !== lastSectionIndex) {
      console.warn("Form submission attempted from non-last section. Preventing submission.");
      return;
    }
    
    setIsLoading(true);
    setSubmittedData(data);
    try {
      // Call OpenAI API through our service to generate the report
      const report = await generateCollegeReport(data);
      setResult(report);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again later.", {
        icon: '❌',
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca'
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to show form errors
  const handleFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fill out all required fields before submitting.", {
      icon: '⚠️',
      duration: 4000,
      style: {
        borderRadius: '10px',
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fecaca'
      },
    });
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
                  ? 'bg-academic-navy text-white border-academic-navy' 
                  : completedSections.includes(index)
                    ? 'bg-academic-gold text-white border-academic-gold'
                    : 'bg-white text-academic-slate border-academic-light'}`}
              onClick={() => jumpToSection(index)}
            >
              {completedSections.includes(index) 
                ? <Check className="w-5 h-5" /> 
                : index + 1}
            </div>
            <span className="text-xs mt-1 text-center">{section.title}</span>
            {index < FORM_SECTIONS.length - 1 && (
              <div className="absolute left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-0.5 bg-academic-light -z-10" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 h-2 w-full bg-academic-light rounded-full overflow-hidden">
        <div 
          className="h-full bg-academic-gold transition-all duration-300"
          style={{ 
            width: `${((currentSection + 1) / FORM_SECTIONS.length) * 100}%` 
          }} 
        />
      </div>
    </div>
  );

  // Render the appropriate section based on currentSection
  const renderSection = (sectionId: string) => {
    // Log current section to help with debugging
    console.log(`Rendering section: ${sectionId}, current index: ${currentSection}`);
    
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
                    <FormDescription className="text-gray-500 text-sm">
                      You can list multiple majors. If not yet decided, you may put "Undecided."
                    </FormDescription>
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
                  <FormDescription className="text-gray-500 text-sm">
                    Colleges you intend to apply to. If you do not have an idea yet, you may leave this list blank.
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="Stanford, MIT, UC Berkeley, NYU, University of Michigan"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
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
                <FormLabel className="text-base">Test Scores</FormLabel>
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
              
              <FormDescription className="text-gray-500 text-sm mb-2">
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
                  <FormLabel className="text-base">Course History</FormLabel>
                  <FormDescription className="text-gray-500 text-sm mb-2">
                    List courses you've taken with grades if available (include AP scores if applicable)
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="AP Calculus BC (A+), AP Computer Science A (A), AP Physics C (A-), Honors Chemistry (A), English Literature (A-), Spanish III (B+)"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "activities":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <FormLabel className="text-base">Activities</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentActivities = form.getValues("activities");
                    form.setValue("activities", [
                      ...currentActivities,
                      { name: "", notes: "" }
                    ]);
                  }}
                >
                  Add Activity
                </Button>
              </div>
              
              <FormDescription className="text-gray-500 text-sm mb-2">
                Enter your extracurricular activities, leadership roles, work experience, and other involvements.
              </FormDescription>
              
              {form.watch("activities")?.map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="w-1/4">
                    <FormField
                      control={form.control}
                      name={`activities.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Textarea 
                              placeholder="Activity name (e.g., Debate Team, Volunteer Work)" 
                              {...field} 
                              className="w-full min-h-[90px] resize-none"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="w-2/3">
                    <FormField
                      control={form.control}
                      name={`activities.${index}.notes`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Textarea 
                              placeholder="Details (e.g., President, 3 years, 5 hrs/week, achievements)" 
                              {...field} 
                              className="w-full min-h-[90px] resize-none"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("activities").length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => {
                        const currentActivities = form.getValues("activities");
                        form.setValue(
                          "activities",
                          currentActivities.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-red-500"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Navigation buttons
  const renderNavigationButtons = () => {
    const lastSectionIndex = FORM_SECTIONS.length - 1;
    const isLastSection = currentSection === lastSectionIndex;
    const isFirstSection = currentSection === 0;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousSection}
            disabled={isFirstSection}
            className="border-academic-navy text-academic-navy hover:bg-academic-cream disabled:opacity-50"
          >
            Previous
          </Button>
          
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log(`Next button clicked, moving from section ${currentSection} to ${currentSection + 1}`);
              goToNextSection();
            }}
            disabled={isLastSection}
            className="bg-academic-navy hover:bg-academic-slate text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
        
        {isLastSection && (
          <div className="pt-6 border-t border-gray-100">
            <Button 
              type="submit" 
              className="w-full bg-academic-burgundy hover:bg-academic-navy text-white py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : "Generate Plan"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Scroll function for "Try Now" button
  const scrollToForm = () => {
    document.getElementById('application-form')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  // Fill form with sample data and go to last section
  const loadTemplateData = () => {
    // Sample form data
    const templateData = {
      studentName: "Alex Johnson",
      highSchool: "Lincoln High School",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Computer Science, Data Science",
      collegeList: "Stanford University, MIT, UC Berkeley, Carnegie Mellon, Georgia Tech",
      testScores: [
        { testName: "SAT", score: "1480" },
        { testName: "AP", score: "Calculus BC: 5" },
        { testName: "AP", score: "Computer Science A: 5" }
      ],
      courseHistory: "AP Calculus BC (A+), AP Computer Science A (A), AP Physics C (A-), Honors Chemistry (A), English Literature (A-), Spanish III (B+)",
      activities: [
        { 
          name: "Robotics Team", 
          notes: "Team Captain, 4 years, 8 hrs/week, Led team to state finals"
        },
        { 
          name: "Math Club", 
          notes: "Vice President, 3 years, 3 hrs/week, Organized math competitions"
        },
        { 
          name: "Coding Volunteer", 
          notes: "Instructor, 2 years, 4 hrs/week, Taught coding to middle school students"
        }
      ],
      additionalInfo: "I developed an app that helps students track their homework and study time. It has over 500 users at my school. I'm also passionate about using technology to solve environmental problems."
    };
    
    // Reset the form with template data
    form.reset(templateData);
    
    // Mark all sections as complete
    setCompletedSections([0, 1, 2]);
    
    // Go to the last section
    setCurrentSection(FORM_SECTIONS.length - 1);
    
    // Scroll to the form
    scrollToForm();
    
    // Show a toast or alert to instruct the user
    toast.success(
      "Demo profile loaded! Review the information and click 'Generate Plan' when ready.", 
      {
        icon: '👨‍🎓',
        duration: 5000,
        style: {
          borderRadius: '10px',
          background: '#f0f9ff',
          color: '#0c4a6e',
          border: '1px solid #bae6fd'
        },
      }
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
    <div className="max-w-full overflow-hidden">
      {/* Hero Section */}
      <div className="mb-12 pt-8 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-academic-navy via-academic-burgundy to-academic-navy bg-clip-text text-transparent drop-shadow-sm leading-tight">
          Your dream school<br />
          is within reach.
        </h1>
        <p className="text-xl text-academic-slate mb-8 max-w-3xl mx-auto">
          A personalized, data-backed college planning tool — trusted by students admitted to top schools.
        </p>
        
        {/* School Logos Section */}
        <SchoolLogos />
        
        <p className="text-sm text-academic-slate mb-6 mt-4 max-w-2xl mx-auto">
          Simply answer a few questions about your academic profile and goals to receive a personalized college application timeline and strategic recommendations. All your information is processed securely and never stored on our servers.
        </p>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button 
            onClick={scrollToForm}
            className="bg-academic-burgundy hover:bg-academic-navy text-white px-8 py-6 text-lg rounded-lg shadow-lg transition-all hover:shadow-xl border-2 border-academic-burgundy hover:border-academic-navy"
          >
            Start Planning
          </Button>
          
          <Button 
            onClick={loadTemplateData}
            className="bg-white hover:bg-academic-cream text-academic-navy px-8 py-6 text-lg rounded-lg shadow-lg transition-all hover:shadow-xl border-2 border-academic-gold hover:border-academic-navy"
          >
            Use Demo Profile
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="mb-8 p-6 bg-academic-navy/10 rounded-lg text-center animate-pulse">
          <p className="text-lg font-semibold mb-4 text-academic-navy">
            <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />
            Creating your personalized college application plan...
          </p>
          <p className="text-sm text-academic-slate">This may take a minute or two</p>
        </div>
      )}
      
      {isProcessingPayment && !isLoading && (
        <div className="mb-8 p-6 bg-academic-navy/10 rounded-lg text-center animate-pulse">
          <p className="text-lg font-semibold mb-4 text-academic-navy">
            <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />
            Processing your payment...
          </p>
          <p className="text-sm text-academic-slate">Please complete the payment to generate your plan</p>
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
        <div id="application-form" className="bg-white shadow-md border border-academic-light rounded-lg p-6 mb-6 overflow-hidden">
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-8 max-w-full">
              <ProgressIndicator />
              <div key={`section-${FORM_SECTIONS[currentSection].id}`} className="max-w-full">
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