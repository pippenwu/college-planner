import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { usePayment } from "../context/PaymentContext";
import { reportApi } from "../services/apiClient";
import ReportDisplay, { ReportData } from "./ReportDisplay";
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
  currentGrade: z.enum(["9th", "10th", "11th", "12th"], {
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

interface StudentProfileFormProps {
  onReportVisibilityChange?: (isVisible: boolean) => void;
}

export function StudentProfileForm({ onReportVisibilityChange }: StudentProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReportData | null>(null);
  const [pendingReportData, setPendingReportData] = useState<FormValues | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  // Add flag to track if using demo data
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  
  // Get payment state from context
  const { isPaid, isProcessingPayment, resetPaymentState } = usePayment();
  
  // Form context using react-hook-form
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
    mode: "onChange",
  });

  // Load saved form data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('collegePlannerFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
        
        // If we have saved data, figure out which sections are complete
        const completedSectionIds: number[] = [];
        if (parsedData.studentName && parsedData.highSchool && parsedData.currentGrade) {
          completedSectionIds.push(0);
        }
        if (parsedData.intendedMajors && parsedData.collegeList) {
          completedSectionIds.push(1);
        }
        if (parsedData.testScores?.length || parsedData.courseHistory || parsedData.activities?.length) {
          completedSectionIds.push(2);
        }
        
        setCompletedSections(completedSectionIds);
        // Set current section to the next incomplete section, or the last one if all are complete
        const nextSection = completedSectionIds.length < FORM_SECTIONS.length ? completedSectionIds.length : FORM_SECTIONS.length - 1;
        setCurrentSection(nextSection);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);
  
  // Listen for test-report-generated events and check the global test state
  useEffect(() => {
    const handleTestReportGenerated = () => {
      if (typeof window !== 'undefined' && window.__TEST_STATE__) {
        if (window.__TEST_STATE__.showReport && window.__TEST_STATE__.testReport) {
          setResult(window.__TEST_STATE__.testReport);
        } else {
          setResult(null);
        }
      }
    };
    
    // Initial check
    handleTestReportGenerated();
    
    // Add event listener
    window.addEventListener('test-report-generated', handleTestReportGenerated);
    
    return () => {
      window.removeEventListener('test-report-generated', handleTestReportGenerated);
    };
  }, []);
  
  // Update the parent component when a report is shown or hidden
  useEffect(() => {
    if (onReportVisibilityChange) {
      onReportVisibilityChange(result !== null);
    }
  }, [result, onReportVisibilityChange]);

  // Use useEffect to generate the report when payment is successful
  useEffect(() => {
    const generateReport = async () => {
      if (isPaid && pendingReportData) {
        setIsLoading(true);
        try {
          // Reset payment state whenever generating a new report
          resetPaymentState();
          const response = await reportApi.generateReport(pendingReportData);
          if (response.success && response.data) {
            setResult(response.data.reportData);
          } else {
            throw new Error("Failed to generate report");
          }
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
  }, [isPaid, pendingReportData, resetPaymentState]);

  // Function to move to the next section
  const goToNextSection = () => {
    // Validate current section fields before marking complete
    const currentSectionId = FORM_SECTIONS[currentSection].id;
    const formValues = form.getValues();
    let isSectionValid = true;
    
    // Check required fields based on section
    switch (currentSectionId) {
      case "student-info":
        // Required: highSchool, currentGrade
        isSectionValid = !!formValues.highSchool && !!formValues.currentGrade;
        break;
      case "majors-colleges":
        // Required: intendedMajors
        isSectionValid = !!formValues.intendedMajors;
        break;
      // academics and activities sections don't have required fields
      default:
        isSectionValid = true;
    }
    
    // Only mark as complete if all required fields are filled
    if (isSectionValid && !completedSections.includes(currentSection)) {
      setCompletedSections(prev => [...prev, currentSection]);
    }
    
    // Make sure we're not already on the last section
    const lastSectionIndex = FORM_SECTIONS.length - 1;
    if (currentSection < lastSectionIndex) {
      // Use a callback to ensure we're using the latest state
      setCurrentSection(prevSection => {
        const nextSection = prevSection + 1;
        console.log(`Setting section from ${prevSection} to ${nextSection}`);
        
        // Save form data to localStorage if not using demo data
        if (!isUsingDemoData) {
          const formData = form.getValues();
          localStorage.setItem('collegePlannerFormData', JSON.stringify(formData));
        }
        
        return nextSection;
      });
    } else {
      console.warn(`Already at last section (${currentSection}), can't go forward`);
    }
  };

  // Function to go to the previous section
  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prevSection => {
        const newSection = prevSection - 1;
        
        // Save form data to localStorage if not using demo data
        if (!isUsingDemoData) {
          const formData = form.getValues();
          localStorage.setItem('collegePlannerFormData', JSON.stringify(formData));
        }
        
        return newSection;
      });
    }
  };

  // Function to jump to a specific section
  const jumpToSection = (sectionId: number) => {
    // Only allow jumping to completed sections or the next section
    if (completedSections.includes(sectionId) || sectionId <= Math.max(...completedSections, 0) + 1) {
      setCurrentSection(sectionId);
      
      // Save form data to localStorage if not using demo data
      if (!isUsingDemoData) {
        const formData = form.getValues();
        localStorage.setItem('collegePlannerFormData', JSON.stringify(formData));
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted with data:", data);
    console.log("Current section at submission:", currentSection);
    
    // Clear saved form data from localStorage on successful submission
    localStorage.removeItem('collegePlannerFormData');
    
    // Only proceed with submission if we're actually on the last section
    const lastSectionIndex = FORM_SECTIONS.length - 1;
    if (currentSection !== lastSectionIndex) {
      console.warn("Form submission attempted from non-last section. Preventing submission.");
      return;
    }
    
    setIsLoading(true);
    try {
      // Reset payment state whenever generating a new report
      resetPaymentState();
      
      // Call our backend API to generate the report
      const response = await reportApi.generateReport(data);
      
      if (response.success && response.data) {
        // Store the reportId in localStorage for future reference
        localStorage.setItem('current_report_id', response.data.reportId);
        
        // Set the result with the JSON report data
        setResult(response.data.reportData);
      } else {
        console.error("API response error:", response);
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
      }
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
  const FieldLabel = ({ children, required, htmlFor }: { children: React.ReactNode, required?: boolean, htmlFor?: string }) => (
    <FormLabel htmlFor={htmlFor}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );

  // Progress indicator component
  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {FORM_SECTIONS.map((section, index) => (
          <div key={section.id} className="flex flex-col items-center z-10">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer
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
          </div>
        ))}
        
        {/* Connector lines between steps */}
        {FORM_SECTIONS.map((_, index) => (
          index < FORM_SECTIONS.length - 1 && (
            <div 
              key={`connector-${index}`}
              className="absolute top-5 h-0.5 bg-academic-light -z-10"
              style={{
                left: `calc(${(index * 100) / (FORM_SECTIONS.length - 1)}% + 2rem)`,
                width: `calc(${100 / (FORM_SECTIONS.length - 1)}% - 4rem)`
              }}
            />
          )
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
                    <FormLabel htmlFor={`student-name-${field.name}`}>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        id={`student-name-${field.name}`}
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
                  <FieldLabel required htmlFor={`high-school-${field.name}`}>Current High School</FieldLabel>
                  <FormControl>
                    <Input id={`high-school-${field.name}`} placeholder="Westlake High School" {...field} />
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
                  <FieldLabel required htmlFor={`current-grade-${field.name}`}>Current Grade</FieldLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id={`current-grade-${field.name}`}>
                        <SelectValue placeholder="Select your current grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
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
                    <FieldLabel required htmlFor={`intended-majors-${field.name}`}>Intended Major(s)</FieldLabel>
                    <FormDescription className="text-gray-500 text-sm">
                      You can list multiple majors. If not yet decided, you may put "Undecided."
                    </FormDescription>
                    <FormControl>
                      <Input 
                        id={`intended-majors-${field.name}`}
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
                  <FormLabel htmlFor={`college-list-${field.name}`}>College List</FormLabel>
                  <FormDescription className="text-gray-500 text-sm">
                    Colleges you intend to apply to. If you do not have an idea yet, you may leave this list blank.
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      id={`college-list-${field.name}`}
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
                <FormLabel className="text-base" htmlFor="test-scores-section">Test Scores</FormLabel>
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
              
              <div id="test-scores-section" className="space-y-2">
                {form.watch("testScores")?.map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`testScores.${index}.testName`}
                        render={({ field }) => (
                          <FormItem className="mb-0">
                            <FormLabel htmlFor={`test-name-${index}`} className="sr-only">Test Name</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger id={`test-name-${index}`}>
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
                            <FormLabel htmlFor={`test-score-${index}`} className="sr-only">Test Score</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  id={`test-score-${index}`}
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
            </div>

            <FormField
              control={form.control}
              name="courseHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base" htmlFor={`course-history-${field.name}`}>Course History</FormLabel>
                  <FormDescription className="text-gray-500 text-sm mb-2">
                    List courses you've taken with grades if available.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      id={`course-history-${field.name}`}
                      placeholder="AP Calculus BC (A+), AP Macroeconomics (A), AP Statistics (A-), Honors Precalculus (A), English 11 (B+), Spanish IV (B+)"
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
                <FormLabel className="text-base" htmlFor="activities-section">Activities</FormLabel>
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
              
              <div id="activities-section" className="space-y-2">
                {form.watch("activities")?.map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="w-1/4">
                      <FormField
                        control={form.control}
                        name={`activities.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="mb-0">
                            <FormLabel htmlFor={`activity-name-${index}`} className="sr-only">Activity Name</FormLabel>
                            <FormControl>
                              <Textarea 
                                id={`activity-name-${index}`}
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
                            <FormLabel htmlFor={`activity-notes-${index}`} className="sr-only">Activity Details</FormLabel>
                            <FormControl>
                              <Textarea 
                                id={`activity-notes-${index}`}
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
          </div>
        );

      case "additionalInfo":
        return (
          <FormField
            control={form.control}
            name="additionalInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={`additional-info-${field.name}`}>Additional Information</FormLabel>
                <FormDescription className="text-gray-500 text-sm mb-2">
                  Is there anything else you'd like to share that wasn't covered in the earlier sections?
                </FormDescription>
                <FormControl>
                  <Textarea
                    id={`additional-info-${field.name}`}
                    placeholder="Share any additional information that might be relevant to your college applications and planning."
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          {!isFirstSection ? (
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousSection}
              className="border-academic-navy text-academic-navy hover:bg-academic-cream"
            >
              Previous
            </Button>
          ) : (
            <div></div> /* Empty div to maintain spacing */
          )}
          
          {!isLastSection ? (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                console.log(`Next button clicked, moving from section ${currentSection} to ${currentSection + 1}`);
                goToNextSection();
              }}
              className="bg-academic-navy hover:bg-academic-slate text-white"
            >
              Next
            </Button>
          ) : (
            <div></div> /* Empty div to maintain spacing */
          )}
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
                  Creating your personalized college application plan... This may take a minute or two, do not leave the page.
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
  const loadTemplateData = (category?: string) => {
    // Set flag that we're using demo data to prevent saving to localStorage
    setIsUsingDemoData(true);
    
    let templateData: FormValues;
    
    // Define templates for different majors
    const accountingTemplate: FormValues = {
      studentName: "Taylor Schmidt",
      highSchool: "Lincoln High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Accounting",
      collegeList: "NYU Stern, University of Illinois, University of Texas Austin, University of Michigan, Boston College",
      testScores: [
        { testName: "SAT", score: "1410" },
        { testName: "AP", score: "Calculus AB: 4" },
        { testName: "AP", score: "Macroeconomics: 5" }
      ],
      courseHistory: "AP Calculus AB (A), AP Macroeconomics (A), AP Statistics (A-), Honors Precalculus (A), English 11 (B+), Spanish IV (B+)",
      activities: [
        { 
          name: "Accounting Club", 
          notes: "President, 2 years, 3 hrs/week, Led team in regional accounting competition"
        },
        { 
          name: "DECA Business Club", 
          notes: "Treasurer, 3 years, 4 hrs/week, Placed 2nd in state finance competition"
        },
        { 
          name: "Tax Preparation Volunteer", 
          notes: "Volunteer, 1 year, seasonal 6 hrs/week, Assisted low-income families with tax filing"
        }
      ],
      additionalInfo: "I completed a summer internship at a local accounting firm where I helped with bookkeeping and financial statement preparation. I've also been developing a budget tracking app as a personal project."
    };
    
    const architectureTemplate: FormValues = {
      studentName: "Maya Richardson",
      highSchool: "Westview Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Architecture",
      collegeList: "University of Illinois, University of Oregon, University of Arizona, Ball State, University of Minnesota",
      testScores: [
        { testName: "SAT", score: "1160" },
        { testName: "AP", score: "Studio Art: 3" }
      ],
      courseHistory: "Studio Art (A-), Physics (B-), Algebra II (B), Architecture Elective (A), Digital Design (B+), English 10 (B+)",
      activities: [
        { 
          name: "Art Club", 
          notes: "Member, 2 years, 2 hrs/week, Participated in drawing and design activities"
        },
        { 
          name: "Yearbook Committee", 
          notes: "Layout Designer, 1 year, 3 hrs/week, Helped design page layouts for school yearbook"
        },
        { 
          name: "Community Service", 
          notes: "Volunteer, 2 years, monthly, Helped with community garden design and maintenance"
        }
      ],
      additionalInfo: "I've been interested in architecture since taking a design class in 9th grade. I enjoy sketching buildings and experimenting with 3D modeling software in my free time."
    };
    
    const artTemplate: FormValues = {
      studentName: "Zoe Kim",
      highSchool: "Westwood Arts Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Fine Arts, Studio Art",
      collegeList: "University of Illinois, University of Washington, Arizona State, University of Oregon, Temple University",
      testScores: [
        { testName: "SAT", score: "1140" },
        { testName: "AP", score: "Studio Art: 4" }
      ],
      courseHistory: "Art Studio (A), Art History (B+), Drawing & Painting (A-), Digital Media (B), English 11 (B-), Algebra II (C+)",
      activities: [
        { 
          name: "Art Club", 
          notes: "Member, 2 years, 3 hrs/week, Participated in after-school art projects and local exhibitions"
        },
        { 
          name: "School Mural", 
          notes: "Contributor, 1 semester, 3 hrs/week, Helped paint mural in school cafeteria"
        },
        { 
          name: "Community Art Classes", 
          notes: "Student, 1 year, 2 hrs/week, Taking weekend ceramics classes at community center"
        }
      ],
      additionalInfo: "I love expressing myself through different art mediums, especially painting and ceramics. I've participated in a few local art shows and am working on building a portfolio for college applications."
    };
    
    const biochemistryTemplate: FormValues = {
      studentName: "Raj Patel",
      highSchool: "North Central High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Biochemistry",
      collegeList: "University of Michigan, University of Wisconsin, Ohio State, Purdue University, University of Minnesota",
      testScores: [
        { testName: "SAT", score: "1280" },
        { testName: "AP", score: "Biology: 4" },
        { testName: "AP", score: "Chemistry: 3" }
      ],
      courseHistory: "AP Biology (B+), AP Chemistry (B), Honors Algebra II (B+), AP Physics 1 (B-), English 11 (B+), Spanish III (B)",
      activities: [
        { 
          name: "Science Club", 
          notes: "Member, 2 years, 3 hrs/week, Participated in science demonstrations and competitions"
        },
        { 
          name: "Hospital Volunteer", 
          notes: "Volunteer, 1 year, 4 hrs/week, Assisted at local hospital in administrative tasks"
        },
        { 
          name: "Biology Study Group", 
          notes: "Participant, 1 year, 2 hrs/week, Weekly studying with peers for AP Biology"
        }
      ],
      additionalInfo: "I'm interested in biochemistry and enjoy studying how chemical processes relate to living organisms. I volunteered at our local hospital last summer and am hoping to find a research opportunity next year."
    };
    
    const biologyTemplate: FormValues = {
      studentName: "Aisha Patel",
      highSchool: "Oakridge High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Biology, Pre-Med",
      collegeList: "Johns Hopkins, Stanford, Duke, UCLA, Washington University in St. Louis",
      testScores: [
        { testName: "SAT", score: "1490" },
        { testName: "AP", score: "Biology: 5" },
        { testName: "AP", score: "Chemistry: 4" }
      ],
      courseHistory: "AP Biology (A+), AP Chemistry (A), Honors Precalculus (A), Honors English 11 (A), Spanish III (A-), AP Psychology (A-)",
      activities: [
        { 
          name: "Science Olympiad", 
          notes: "Team Captain, 3 years, 6 hrs/week, State medalist in Anatomy & Physiology"
        },
        { 
          name: "Hospital Volunteer", 
          notes: "Volunteer, 2 years, 5 hrs/week, 200+ total hours in pediatric ward"
        },
        { 
          name: "Biology Research", 
          notes: "Student Researcher, 1 year, 6 hrs/week, Conducting independent research on plant cellular responses"
        }
      ],
      additionalInfo: "I'm passionate about cellular biology and have been shadowing doctors at the local children's hospital. I also participated in a summer research program focused on microbiology where I studied antibiotic resistance in bacteria."
    };
    
    // Business template is already defined
    
    const chemistryTemplate: FormValues = {
      studentName: "Liam Nelson",
      highSchool: "Parkside Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Chemistry",
      collegeList: "UC Berkeley, Caltech, MIT, University of Michigan, Northwestern",
      testScores: [
        { testName: "SAT", score: "1520" },
        { testName: "AP", score: "Chemistry: 5" },
        { testName: "AP", score: "Physics 1: 5" },
        { testName: "AP", score: "Calculus BC: 5" }
      ],
      courseHistory: "AP Chemistry (A+), AP Physics 1 (A), AP Calculus BC (A), Organic Chemistry (A, dual enrollment), AP English Literature (A-), French IV (A)",
      activities: [
        { 
          name: "Chemistry Research", 
          notes: "Research Assistant, 2 years, 8 hrs/week, Conducting catalyst efficiency experiments at university lab"
        },
        { 
          name: "Science Bowl", 
          notes: "Team Captain, 3 years, 4 hrs/week, Led team to nationals, specialized in chemistry questions"
        },
        { 
          name: "Environmental Club", 
          notes: "Vice President, 2 years, 3 hrs/week, Led water quality testing initiative for local waterways"
        }
      ],
      additionalInfo: "I developed a method for detecting heavy metal contaminants in water samples that won first place at our state science fair. I also completed a summer research program in analytical chemistry at the University of Wisconsin."
    };
    
    const communicationsTemplate: FormValues = {
      studentName: "Olivia Martinez",
      highSchool: "Riverdale High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Communications, Journalism",
      collegeList: "University of Wisconsin, University of Minnesota, Arizona State, Ohio University, Michigan State",
      testScores: [
        { testName: "SAT", score: "1180" },
        { testName: "AP", score: "English Language: 3" }
      ],
      courseHistory: "AP English Language (B+), Psychology (A-), World History (B), Journalism (A-), Public Speaking (B+), Spanish III (B-)",
      activities: [
        { 
          name: "School Newspaper", 
          notes: "Staff Writer, 2 years, 3 hrs/week, Writing articles for the monthly school paper"
        },
        { 
          name: "Yearbook Committee", 
          notes: "Member, 1 year, 2 hrs/week, Taking photos and writing captions for yearbook"
        },
        { 
          name: "Debate Club", 
          notes: "Member, 1 year, 2 hrs/week, Participating in local debate competitions"
        }
      ],
      additionalInfo: "I discovered my interest in journalism while working on our school newspaper and enjoy interviewing people and writing stories. I'm considering studying communications or journalism in college."
    };
    
    // Define templates for different categories (keep old ones for backwards compatibility)
    const businessTemplate: FormValues = {
      studentName: "Jordan Chen",
      highSchool: "Westlake High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Business Administration",
      collegeList: "Indiana University, Michigan State, University of Wisconsin, Ohio State, Penn State",
      testScores: [
        { testName: "SAT", score: "1230" },
        { testName: "AP", score: "Macroeconomics: 3" },
        { testName: "AP", score: "Statistics: 3" }
      ],
      courseHistory: "Algebra II (B+), AP Macroeconomics (B), Statistics (B+), English 10 (B), Spanish II (B-), World History (B+)",
      activities: [
        { 
          name: "Business Club", 
          notes: "Member, 2 years, 3 hrs/week, Participated in local business competitions"
        },
        { 
          name: "School Store", 
          notes: "Volunteer, 1 year, 2 hrs/week, Helped manage inventory and sales during lunch periods"
        },
        { 
          name: "Junior Achievement", 
          notes: "Participant, 1 year, 2 hrs/week, Worked on team project to create a small business"
        }
      ],
      additionalInfo: "I became interested in business after taking an economics class and joining our school's Business Club. I enjoy learning about how companies operate and would like to explore different aspects of business in college."
    };
    
    const computerScienceTemplate: FormValues = {
      studentName: "Alex Wang",
      highSchool: "Central Tech High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Computer Science",
      collegeList: "University of Washington, Purdue, University of Minnesota, Ohio State, Arizona State",
      testScores: [
        { testName: "SAT", score: "1320" },
        { testName: "AP", score: "Computer Science A: 4" },
        { testName: "AP", score: "Calculus AB: 3" }
      ],
      courseHistory: "AP Computer Science A (B+), AP Calculus AB (B), Physics (B+), English 11 (B), Spanish III (C+), US History (B-)",
      activities: [
        { 
          name: "Coding Club", 
          notes: "Member, 2 years, 3 hrs/week, Worked on group coding projects and learned programming languages"
        },
        { 
          name: "School Website", 
          notes: "Contributor, 1 year, 2 hrs/week, Helped maintain and update school club website"
        },
        { 
          name: "Video Game Development", 
          notes: "Hobbyist, 3 years, 4 hrs/week, Self-taught game development using Unity"
        }
      ],
      additionalInfo: "I've been interested in computers since I was young and have taught myself several programming languages. I enjoy solving problems with code and am particularly interested in game development and web applications."
    };
    
    const economicsTemplate: FormValues = {
      studentName: "Elijah Brooks",
      highSchool: "Riverside Prep Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Economics",
      collegeList: "University of Wisconsin, Michigan State, Purdue, Indiana University, University of Minnesota",
      testScores: [
        { testName: "SAT", score: "1210" },
        { testName: "AP", score: "Microeconomics: 3" },
        { testName: "AP", score: "Statistics: 3" }
      ],
      courseHistory: "AP Microeconomics (B), Statistics (B+), Algebra II (B), AP English Language (B-), World History (B+), Spanish II (C+)",
      activities: [
        { 
          name: "Economics Club", 
          notes: "Member, 1 year, 2 hrs/week, Discussing economic concepts and current events"
        },
        { 
          name: "Student Government", 
          notes: "Class Representative, 1 year, 2 hrs/week, Helping organize school events and fundraisers"
        },
        { 
          name: "Basketball Team", 
          notes: "Team Member, 2 years, 8 hrs/week, Playing on JV basketball team"
        }
      ],
      additionalInfo: "I became interested in economics after taking a class last year and enjoy understanding how financial systems work. I'm also interested in how economic principles apply to everyday decisions."
    };
    
    const mechanicalEngineeringTemplate: FormValues = {
      studentName: "Malik Johnson",
      highSchool: "Central Technical High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Mechanical Engineering",
      collegeList: "MIT, Georgia Tech, Purdue, University of Michigan, Caltech",
      testScores: [
        { testName: "SAT", score: "1510" },
        { testName: "AP", score: "Physics 1: 5" },
        { testName: "AP", score: "Calculus BC: 5" }
      ],
      courseHistory: "AP Physics 1 (A+), AP Calculus BC (A), AP Chemistry (A-), Intro to Engineering Design (A+), English 12 (B+), US History (A-)",
      activities: [
        { 
          name: "Robotics Team", 
          notes: "Lead Engineer, 3 years, 10 hrs/week, Designed mechanical systems for robot that won regional championship"
        },
        { 
          name: "3D Printing Club", 
          notes: "Founder & President, 2 years, 4 hrs/week, Teaching CAD design to 15+ members"
        },
        { 
          name: "Engineering Internship", 
          notes: "Intern, 1 summer, 160 hours total, Assisted with product design at local manufacturing company"
        }
      ],
      additionalInfo: "I designed and built a working drone with custom 3D printed parts that can be controlled through smartphone gestures. I also completed an online course in Computational Fluid Dynamics through Coursera."
    };
    
    const environmentalEngineeringTemplate: FormValues = {
      studentName: "Nina Rodriguez",
      highSchool: "Bayside Science Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Environmental Engineering",
      collegeList: "Stanford, UC Berkeley, Cornell, University of Michigan, Georgia Tech",
      testScores: [
        { testName: "SAT", score: "1480" },
        { testName: "AP", score: "Environmental Science: 5" },
        { testName: "AP", score: "Chemistry: 5" },
        { testName: "AP", score: "Calculus AB: 4" }
      ],
      courseHistory: "AP Environmental Science (A+), AP Chemistry (A), AP Calculus AB (A-), AP Biology (A), English 11 Honors (A), Spanish IV (A-)",
      activities: [
        { 
          name: "Environmental Club", 
          notes: "President, 3 years, 5 hrs/week, Led campus sustainability initiatives that reduced waste by 30%"
        },
        { 
          name: "Water Quality Research", 
          notes: "Student Researcher, 2 years, 6 hrs/week, Monitoring local watershed and developing filtration systems"
        },
        { 
          name: "Engineers Without Borders", 
          notes: "Student Member, 1 year, 4 hrs/week, Working on rainwater collection system design"
        }
      ],
      additionalInfo: "I developed a low-cost solar-powered water filtration system that won first place at our state science fair. I also attended a summer program in sustainable engineering at Stanford University where I worked on a team project focused on urban water management."
    };
    
    const financeTemplate: FormValues = {
      studentName: "William Zhang",
      highSchool: "Eastside Preparatory Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Finance",
      collegeList: "Wharton (UPenn), NYU Stern, University of Michigan Ross, Indiana Kelley, UT Austin McCombs",
      testScores: [
        { testName: "SAT", score: "1530" },
        { testName: "AP", score: "Calculus BC: 5" },
        { testName: "AP", score: "Statistics: 5" },
        { testName: "AP", score: "Microeconomics: 5" }
      ],
      courseHistory: "AP Calculus BC (A), AP Statistics (A+), AP Microeconomics (A+), AP Macroeconomics (A), Financial Math (A+), AP English Language (A-)",
      activities: [
        { 
          name: "Investment Club", 
          notes: "Founder & President, 3 years, 5 hrs/week, Managing real $5,000 portfolio with 15% annual returns"
        },
        { 
          name: "DECA Finance Team", 
          notes: "Team Captain, 2 years, 4 hrs/week, State champion in Financial Consulting event"
        },
        { 
          name: "Financial Literacy Program", 
          notes: "Founder, 2 years, 3 hrs/week, Teaching personal finance to 100+ high school students"
        }
      ],
      additionalInfo: "I completed a summer internship at Morgan Stanley where I shadowed financial analysts. I've also passed Level 1 of the CFA Institute Investment Foundations Program and created a personal finance YouTube channel with over 5,000 subscribers."
    };
    
    const internationalRelationsTemplate: FormValues = {
      studentName: "Sofia Rodriguez",
      highSchool: "Lincoln Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "International Relations",
      collegeList: "Georgetown, Johns Hopkins SAIS, Tufts, George Washington, American University",
      testScores: [
        { testName: "SAT", score: "1470" },
        { testName: "AP", score: "World History: 5" },
        { testName: "AP", score: "Comparative Government: 5" },
        { testName: "AP", score: "Spanish Language: 5" }
      ],
      courseHistory: "AP World History (A+), AP Comparative Government (A), AP Spanish Language (A+), AP English Language (A), Honors Economics (A-), AP US History (A-)",
      activities: [
        { 
          name: "Model UN", 
          notes: "Secretary General, 3 years, 8 hrs/week, Led team to national conference, Best Delegate award at multiple conferences"
        },
        { 
          name: "International Affairs Club", 
          notes: "Founder & President, 2 years, 3 hrs/week, Organizing discussions on global issues with 30+ members"
        },
        { 
          name: "Embassy Internship", 
          notes: "Summer Intern, 160 hours total, Assisted with cultural affairs programming at Spanish Consulate"
        }
      ],
      additionalInfo: "I'm fluent in Spanish and Portuguese and spent a summer studying international politics in Brazil. I also launched a podcast interviewing immigrants about their stories and experiences, which has listeners in over 15 countries."
    };
    
    const linguisticsTemplate: FormValues = {
      studentName: "Emma Chang",
      highSchool: "Westfield Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Linguistics",
      collegeList: "Stanford, MIT, Swarthmore, Pomona, Georgetown",
      testScores: [
        { testName: "SAT", score: "1520" },
        { testName: "AP", score: "English Language: 5" },
        { testName: "AP", score: "French Language: 5" },
        { testName: "AP", score: "Spanish Language: 5" }
      ],
      courseHistory: "AP English Language (A+), AP French Language (A+), AP Spanish Language (A+), Honors Latin III (A), AP Computer Science Principles (A), AP Psychology (A)",
      activities: [
        { 
          name: "Linguistics Olympiad", 
          notes: "Team Captain, 3 years, 5 hrs/week, National finalist, specialized in computational linguistics"
        },
        { 
          name: "Language Exchange", 
          notes: "Founder, 2 years, 4 hrs/week, Organizing conversational practice for 40+ students across 6 languages"
        },
        { 
          name: "Translation Services", 
          notes: "Volunteer, 2 years, 3 hrs/week, Providing translation for community events and documents"
        }
      ],
      additionalInfo: "I speak five languages fluently (English, Mandarin, Spanish, French, and conversational Arabic). I created a computational algorithm to analyze phonological patterns across languages that won honorable mention at our state science fair. I also participated in a summer linguistics research program at Stanford."
    };
        
    const marketingTemplate: FormValues = {
      studentName: "Madison Taylor",
      highSchool: "Lakeside High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Marketing",
      collegeList: "NYU Stern, Indiana Kelley, Michigan Ross, Penn State, University of Texas Austin",
      testScores: [
        { testName: "SAT", score: "1380" },
        { testName: "AP", score: "Psychology: 4" },
        { testName: "AP", score: "Statistics: 4" }
      ],
      courseHistory: "AP Psychology (A), AP Statistics (A-), Business Elective (A+), Digital Media (A+), AP English Language (A), Spanish III (B+)",
      activities: [
        { 
          name: "Social Media Marketing", 
          notes: "Consultant, 2 years, 8 hrs/week, Managing campaigns for three local businesses, increased engagement by 40%"
        },
        { 
          name: "DECA Marketing Team", 
          notes: "Team Leader, 3 years, 5 hrs/week, State finalist in Marketing Communications"
        },
        { 
          name: "School Spirit Committee", 
          notes: "Marketing Director, 2 years, 4 hrs/week, Created promotional campaigns for school events"
        }
      ],
      additionalInfo: "I completed Google's Digital Marketing certification and ran successful Instagram campaigns for our school's fundraising events, raising over $5,000. I also interned with a local marketing agency where I helped develop content strategies for small businesses."
    };
    
    const mathTemplate: FormValues = {
      studentName: "Daniel Park",
      highSchool: "Princeton High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Mathematics",
      collegeList: "University of Illinois, Purdue, University of Washington, University of Minnesota, Ohio State",
      testScores: [
        { testName: "SAT", score: "1310" },
        { testName: "AP", score: "Calculus AB: 4" },
        { testName: "AP", score: "Statistics: 3" }
      ],
      courseHistory: "AP Calculus AB (B+), AP Statistics (B), AP Physics 1 (B-), Honors Pre-Calculus (A-), AP Computer Science A (B), English 11 (B)",
      activities: [
        { 
          name: "Math Club", 
          notes: "Member, 3 years, 2 hrs/week, Participated in math competitions and problem-solving sessions"
        },
        { 
          name: "Tutoring", 
          notes: "Math Tutor, 1 year, 3 hrs/week, Helping younger students with algebra and geometry"
        },
        { 
          name: "Chess Club", 
          notes: "Member, 2 years, 2 hrs/week, Competed in local tournaments"
        }
      ],
      additionalInfo: "I've always enjoyed math classes and find satisfaction in solving complex problems. I'm interested in exploring applied mathematics and statistics in college and possibly pursuing a career in data analysis."
    };
    
    const philosophyTemplate: FormValues = {
      studentName: "Ethan Williams",
      highSchool: "Riverside High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Philosophy",
      collegeList: "University of Minnesota, Indiana University, Michigan State, Arizona State, Ohio State",
      testScores: [
        { testName: "SAT", score: "1190" },
        { testName: "AP", score: "English Literature: 4" },
        { testName: "AP", score: "Psychology: 3" }
      ],
      courseHistory: "AP English Literature (B+), AP Psychology (B), World History (A-), Ethics Elective (A-), Algebra II (C+), Latin II (B)",
      activities: [
        { 
          name: "Book Club", 
          notes: "Member, 2 years, 2 hrs/week, Reading and discussing literature and philosophy"
        },
        { 
          name: "School Newspaper", 
          notes: "Opinion Columnist, 1 year, 2 hrs/week, Writing monthly opinion pieces"
        },
        { 
          name: "Community Service", 
          notes: "Volunteer, 1 year, 3 hrs/week, Assisting at local food bank"
        }
      ],
      additionalInfo: "I've always enjoyed thinking about big questions and discussing ideas. My favorite class was an ethics elective where we debated moral dilemmas, and I'm interested in studying philosophy to better understand different perspectives on life."
    };
    
    const physicsTemplate: FormValues = {
      studentName: "Nathan Chen",
      highSchool: "Oakwood Science Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Physics",
      collegeList: "University of Michigan, University of Illinois, Ohio State, University of Minnesota, Purdue",
      testScores: [
        { testName: "SAT", score: "1350" },
        { testName: "AP", score: "Physics 1: 4" },
        { testName: "AP", score: "Calculus AB: 3" }
      ],
      courseHistory: "AP Physics 1 (B+), AP Calculus AB (B), Chemistry (A-), Honors Pre-Calculus (B+), AP Computer Science A (B-), English 11 (B)",
      activities: [
        { 
          name: "Science Club", 
          notes: "Member, 2 years, 3 hrs/week, Participated in physics experiments and discussions"
        },
        { 
          name: "Robotics Club", 
          notes: "Team Member, 1 year, 4 hrs/week, Helped build and program competition robot"
        },
        { 
          name: "Astronomy Club", 
          notes: "Member, 2 years, 2 hrs/week, Participated in stargazing events and discussions"
        }
      ],
      additionalInfo: "I became interested in physics after an engaging class in high school and joining the Science Club. I enjoy understanding how things work and am curious about the fundamental laws of the universe."
    };
    
    const politicalScienceTemplate: FormValues = {
      studentName: "James Washington",
      highSchool: "Capitol Hill Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Political Science",
      collegeList: "Georgetown, Harvard, American University, George Washington, Columbia",
      testScores: [
        { testName: "SAT", score: "1490" },
        { testName: "AP", score: "US Government: 5" },
        { testName: "AP", score: "US History: 5" },
        { testName: "AP", score: "Comparative Government: 5" }
      ],
      courseHistory: "AP US Government (A+), AP Comparative Government (A+), AP US History (A), AP English Language (A), Honors Economics (A-), AP Statistics (B+)",
      activities: [
        { 
          name: "Student Government", 
          notes: "President, 3 years, 10 hrs/week, Led major policy reforms for school discipline system"
        },
        { 
          name: "Model UN", 
          notes: "Head Delegate, 3 years, 6 hrs/week, Best Delegate awards at multiple conferences"
        },
        { 
          name: "Congressional Campaign", 
          notes: "Intern, 1 year, 15 hrs/week seasonal, Managed youth outreach and voter registration drives"
        }
      ],
      additionalInfo: "I founded a non-partisan voter education initiative that registered 500+ first-time voters. I also attended the Junior State of America summer program at Georgetown University where I specialized in constitutional law and participated in moot court competitions."
    };
    
    const psychologyTemplate: FormValues = {
      studentName: "Isabella Rodriguez",
      highSchool: "Westridge Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Psychology",
      collegeList: "Stanford, Yale, University of Michigan, UCLA, Washington University in St. Louis",
      testScores: [
        { testName: "SAT", score: "1480" },
        { testName: "AP", score: "Psychology: 5" },
        { testName: "AP", score: "Biology: 4" },
        { testName: "AP", score: "Statistics: 4" }
      ],
      courseHistory: "AP Psychology (A+), AP Biology (A), AP Statistics (A-), AP English Literature (A), Honors Sociology (A+), Spanish IV (A)",
      activities: [
        { 
          name: "Psychology Research", 
          notes: "Research Assistant, 2 years, 6 hrs/week, Conducting adolescent development study with university professor"
        },
        { 
          name: "Mental Health Awareness", 
          notes: "Founder & President, 3 years, 5 hrs/week, Organizing workshops and support groups for 200+ students"
        },
        { 
          name: "Peer Counseling", 
          notes: "Lead Counselor, 2 years, 4 hrs/week, Providing support services to fellow students after specialized training"
        }
      ],
      additionalInfo: "I designed and conducted an original research study on social media's effects on teen anxiety that won our state psychology competition. I also completed a summer internship at a clinical psychology practice where I observed therapy sessions and helped with administrative tasks."
    };
    
    const sociologyTemplate: FormValues = {
      studentName: "Marcus Johnson",
      highSchool: "Metropolitan Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Sociology",
      collegeList: "UC Berkeley, University of Chicago, University of Wisconsin-Madison, Northwestern, NYU",
      testScores: [
        { testName: "SAT", score: "1440" },
        { testName: "AP", score: "Psychology: 5" },
        { testName: "AP", score: "Human Geography: 5" },
        { testName: "AP", score: "Statistics: 4" }
      ],
      courseHistory: "AP Psychology (A+), AP Human Geography (A+), AP Statistics (A), Honors Sociology (A+, dual enrollment), AP English Language (A-), US History (A)",
      activities: [
        { 
          name: "Community Research", 
          notes: "Lead Researcher, 2 years, 8 hrs/week, Conducting demographic surveys and needs assessment for local neighborhood"
        },
        { 
          name: "Social Justice Club", 
          notes: "Co-Founder & President, 3 years, 5 hrs/week, Organizing awareness campaigns and community service projects"
        },
        { 
          name: "Youth Advocacy", 
          notes: "Program Coordinator, 2 years, 6 hrs/week, Developing mentorship programs for underserved youth"
        }
      ],
      additionalInfo: "I conducted an ethnographic study of gentrification in my community that was published in a youth social science journal. I also participated in a summer sociology program at Northwestern University where I learned qualitative research methods and completed a field study on urban community organizing."
    };
    
    const veterinaryMedicineTemplate: FormValues = {
      studentName: "Harper Wilson",
      highSchool: "Oakridge High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Pre-Veterinary, Animal Science",
      collegeList: "Cornell, UC Davis, University of Pennsylvania, Ohio State, Colorado State",
      testScores: [
        { testName: "SAT", score: "1470" },
        { testName: "AP", score: "Biology: 5" },
        { testName: "AP", score: "Chemistry: 4" },
        { testName: "AP", score: "Statistics: 4" }
      ],
      courseHistory: "AP Biology (A+), AP Chemistry (A), AP Statistics (A-), Animal Science (A+, dual enrollment), AP Environmental Science (A), Spanish III (A-)",
      activities: [
        { 
          name: "Veterinary Clinic", 
          notes: "Volunteer Assistant, 3 years, 12 hrs/week, 500+ hours shadowing veterinarians and assisting with animal care"
        },
        { 
          name: "Wildlife Rehabilitation", 
          notes: "Intern, 2 years, 8 hrs/week, Caring for injured wildlife and assisting with medical treatments"
        },
        { 
          name: "4-H Animal Science", 
          notes: "Club President, 4 years, 10 hrs/week, Raising and showing livestock, winner of state competitions"
        }
      ],
      additionalInfo: "I completed a summer pre-veterinary program at Cornell University where I participated in animal surgery observations and laboratory work. I also conducted research on canine nutrition that won a state science fair award in the animal science category."
    };
    
    // Select template based on category
    switch (category) {
      case 'accounting':
        templateData = accountingTemplate;
        break;
      case 'architecture':
        templateData = architectureTemplate;
        break;
      case 'art':
        templateData = artTemplate;
        break;
      case 'biochemistry':
        templateData = biochemistryTemplate;
        break;
      case 'biology':
        templateData = biologyTemplate;
        break;
      case 'business':
        templateData = businessTemplate;
        break;
      case 'chemistry':
        templateData = chemistryTemplate;
        break;
      case 'communications':
        templateData = communicationsTemplate;
        break;
      case 'computer-science':
        templateData = computerScienceTemplate;
        break;
      case 'economics':
        templateData = economicsTemplate;
        break;
      case 'mechanical-engineering':
        templateData = mechanicalEngineeringTemplate;
        break;
      case 'environmental-engineering':
        templateData = environmentalEngineeringTemplate;
        break;
      case 'finance':
        templateData = financeTemplate;
        break;
      case 'international-relations':
        templateData = internationalRelationsTemplate;
        break;
      case 'linguistics':
        templateData = linguisticsTemplate;
        break;
      case 'marketing':
        templateData = marketingTemplate;
        break;
      case 'math':
        templateData = mathTemplate;
        break;
      case 'philosophy':
        templateData = philosophyTemplate;
        break;
      case 'physics':
        templateData = physicsTemplate;
        break;
      case 'political-science':
        templateData = politicalScienceTemplate;
        break;
      case 'psychology':
        templateData = psychologyTemplate;
        break;
      case 'sociology':
        templateData = sociologyTemplate;
        break;
      case 'veterinary-medicine':
        templateData = veterinaryMedicineTemplate;
        break;
      default:
        // Show template selection dialog if no category is provided
        setShowTemplateDialog(true);
        return;
    }
    
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

  // Template selection dialog state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Template selection dialog
  const TemplateSelectionDialog = () => (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${showTemplateDialog ? 'block' : 'hidden'}`}
      onClick={() => setShowTemplateDialog(false)}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the dialog from closing it
      >
        <h3 className="text-xl font-bold mb-4 text-academic-navy">Choose a Major Profile</h3>
        <p className="text-sm text-gray-600 mb-4">Select a major to load a sample student profile:</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { id: 'accounting', label: 'Accounting' },
            { id: 'architecture', label: 'Architecture' },
            { id: 'art', label: 'Art' },
            { id: 'biochemistry', label: 'Biochemistry' },
            { id: 'biology', label: 'Biology' },
            { id: 'business', label: 'Business' },
            { id: 'chemistry', label: 'Chemistry' },
            { id: 'communications', label: 'Communications' },
            { id: 'computer-science', label: 'Computer Science' },
            { id: 'economics', label: 'Economics' },
            { id: 'mechanical-engineering', label: 'Mechanical Engineering' },
            { id: 'environmental-engineering', label: 'Environmental Engineering' },
            { id: 'finance', label: 'Finance' },
            { id: 'international-relations', label: 'International Relations' },
            { id: 'linguistics', label: 'Linguistics' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'math', label: 'Mathematics' },
            { id: 'philosophy', label: 'Philosophy' },
            { id: 'physics', label: 'Physics' },
            { id: 'political-science', label: 'Political Science' },
            { id: 'psychology', label: 'Psychology' },
            { id: 'sociology', label: 'Sociology' },
            { id: 'veterinary-medicine', label: 'Veterinary Medicine' }
          ].map(template => (
            <button
              key={template.id}
              onClick={() => {
                setShowTemplateDialog(false);
                loadTemplateData(template.id);
              }}
              className="text-center px-2 py-2 border rounded-md hover:bg-academic-cream hover:border-academic-gold transition-colors text-sm"
            >
              {template.label}
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTemplateDialog(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  // Function to handle starting over
  const handleStartOver = () => {
    // Clear the result to hide the report
    setResult(null);
    // Reset the form
    form.reset();
    // Reset all form state
    setCompletedSections([]);
    setCurrentSection(0);
    // Reset demo data flag
    setIsUsingDemoData(false);
    // Clear localStorage
    localStorage.removeItem('collegePlannerFormData');
    // Scroll back to the form
    scrollToForm();
  };

  // If a report has been generated, show the report display component instead of the form
  if (result) {
    return (
      <ReportDisplay 
        report={result} 
        onStartOver={handleStartOver} 
      />
    );
  }

  return (
    <div className="max-w-full overflow-hidden">
      {/* Template Selection Dialog */}
      <TemplateSelectionDialog />
      
      {/* Hero Section */}
      <div className="mb-12 pt-8 text-center">
        <div className="mb-6">
          <img src="/cat-icon.png" alt="CAT Logo" className="w-64 h-64 mx-auto" />
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-academic-navy via-academic-burgundy to-academic-navy bg-clip-text text-transparent drop-shadow-sm leading-tight md:leading-relaxed pb-3">
          From where you are<br />
          to <em>where you want to be</em>.
        </h1>
        <p className="font-heading font-light text-xl text-academic-navy mb-8 max-w-3xl mx-auto border-academic-gold/30 py-3 px-4 inline-block">
          Get your college application plan in one simple, actionable timeline.
        </p>

        <SchoolLogos />
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button 
            onClick={scrollToForm}
            className="bg-academic-burgundy hover:bg-academic-navy text-white px-8 py-6 text-lg rounded-lg shadow-lg transition-all hover:shadow-xl border-2 border-academic-burgundy hover:border-academic-navy"
          >
            Start Planning
          </Button>
          
          <div className="my-2 text-academic-slate font-semibold">OR</div>
          
          <Button 
            onClick={() => loadTemplateData()}
            className="bg-white hover:bg-academic-cream text-academic-navy px-8 py-6 text-lg rounded-lg shadow-lg transition-all hover:shadow-xl border-2 border-academic-gold hover:border-academic-navy"
          >
            Try Demo Profile
          </Button>
        </div>

        <p className="text-sm text-academic-slate mb-6 mt-4 max-w-2xl mx-auto">
          Answer a few quick questions about your academic background and goals to receive a personalized college application timeline and strategic recommendations.
          Don't worry, we don't store any of your info. Ever.
        </p>

      </div>

      {result && !isLoading ? (
        <ReportDisplay 
          report={result}
          onStartOver={() => {
            setResult(null);
            setCurrentSection(0);
            setCompletedSections([]);
          }}
        />
      ) : (
        <div id="application-form" className="bg-white shadow-md border border-academic-light rounded-lg p-6 mb-6 overflow-hidden">
          {isLoading ? (
            <div className="py-12 px-4 text-center">
              <div className="p-6 bg-academic-navy/10 rounded-lg text-center animate-pulse">
                <p className="text-lg font-semibold mb-4 text-academic-navy">
                  <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />
                  Creating your personalized college application plan...
                </p>
                <p className="text-sm text-academic-slate">This may take a minute or two, do not leave the page.</p>
              </div>
            </div>
          ) : isProcessingPayment ? (
            <div className="py-12 px-4 text-center">
              <div className="p-6 bg-academic-navy/10 rounded-lg text-center animate-pulse">
                <p className="text-lg font-semibold mb-4 text-academic-navy">
                  <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />
                  Processing your payment...
                </p>
                <p className="text-sm text-academic-slate">Please complete the payment to generate your plan</p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-8 max-w-full">
                <ProgressIndicator />
                <div key={`section-${FORM_SECTIONS[currentSection].id}`} className="max-w-full">
                  {renderSection(FORM_SECTIONS[currentSection].id)}
                </div>
                {renderNavigationButtons()}
              </form>
            </Form>
          )}
        </div>
      )}
    </div>
  );
}