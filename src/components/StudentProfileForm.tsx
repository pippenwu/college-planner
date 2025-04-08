import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { usePayment } from '../context/PaymentContext';
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
  
  // Get payment state from context
  const { isPaid, isProcessingPayment, resetPaymentState } = usePayment();
  
  // Track the current section/step
  const [currentSection, setCurrentSection] = useState(0);
  
  // Track completed sections
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  
  // Update the parent component when a report is shown or hidden
  useEffect(() => {
    if (onReportVisibilityChange) {
      onReportVisibilityChange(result !== null);
    }
  }, [result, onReportVisibilityChange]);

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
      collegeList: "Cornell, Rhode Island School of Design, Cooper Union, Cal Poly, Pratt Institute",
      testScores: [
        { testName: "SAT", score: "1390" },
        { testName: "AP", score: "Studio Art: 5" },
        { testName: "AP", score: "Physics 1: 4" }
      ],
      courseHistory: "AP Studio Art (A+), AP Physics 1 (B+), Calculus (A-), Architecture Elective (A+), Digital Design (A), English 12 (A-)",
      activities: [
        { 
          name: "Architecture Club", 
          notes: "Founder & President, 2 years, 4 hrs/week, Organized architecture field trips and design workshops"
        },
        { 
          name: "Habitat for Humanity", 
          notes: "Volunteer Designer, 2 years, 5 hrs/week, Assisted with home design and construction projects"
        },
        { 
          name: "City Planning Internship", 
          notes: "Summer Intern, 200 hours total, Shadowed architects and contributed to urban design projects"
        }
      ],
      additionalInfo: "I've built a portfolio of architectural drawings and 3D models featuring sustainable housing designs. I won 2nd place in a state architecture competition for high school students with my design for an urban community center."
    };
    
    const artTemplate: FormValues = {
      studentName: "Zoe Kim",
      highSchool: "Westwood Arts Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Fine Arts, Studio Art",
      collegeList: "Rhode Island School of Design, School of the Art Institute of Chicago, California Institute of the Arts, Pratt Institute, Maryland Institute College of Art",
      testScores: [
        { testName: "SAT", score: "1320" },
        { testName: "AP", score: "Studio Art: 5" },
        { testName: "AP", score: "Art History: 5" }
      ],
      courseHistory: "AP Studio Art (A+), AP Art History (A+), Advanced Painting (A+), Digital Media (A), English 12 (A-), Precalculus (B+)",
      activities: [
        { 
          name: "Art Portfolio Club", 
          notes: "President, 3 years, 6 hrs/week, Organized student exhibitions and portfolio workshops"
        },
        { 
          name: "Local Gallery Internship", 
          notes: "Intern, 1 year, 8 hrs/week, Assisted with exhibition setup and art curation"
        },
        { 
          name: "Community Art Initiative", 
          notes: "Founder, 2 years, 5 hrs/week, Led team creating murals for local businesses and schools"
        }
      ],
      additionalInfo: "My artwork has been exhibited in three local galleries, and I won the Youth Artist Award at our state's annual art competition. I've also completed courses in digital illustration and graphic design through a pre-college summer program."
    };
    
    const biochemistryTemplate: FormValues = {
      studentName: "Raj Patel",
      highSchool: "North Central High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Biochemistry",
      collegeList: "MIT, Caltech, UC Berkeley, University of Michigan, Johns Hopkins",
      testScores: [
        { testName: "SAT", score: "1550" },
        { testName: "AP", score: "Biology: 5" },
        { testName: "AP", score: "Chemistry: 5" },
        { testName: "AP", score: "Calculus BC: 5" }
      ],
      courseHistory: "AP Biology (A+), AP Chemistry (A+), AP Calculus BC (A), AP Physics 1 (A), AP English Language (A-), Spanish IV (A)",
      activities: [
        { 
          name: "Research Internship", 
          notes: "Lab Assistant, 2 summers, 200+ hours total, Assisted with protein analysis research at university lab"
        },
        { 
          name: "Science Olympiad", 
          notes: "Captain, 3 years, 8 hrs/week, 1st place in state biochemistry competition"
        },
        { 
          name: "Chemistry Club", 
          notes: "President, 2 years, 3 hrs/week, Organized demonstrations and competitions"
        }
      ],
      additionalInfo: "I co-authored a research paper on enzyme kinetics that was published in a youth science journal. I also attended a summer biochemistry program at the University of Pennsylvania where I conducted independent research on protein folding."
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
      collegeList: "Northwestern, Syracuse, University of Southern California, Boston University, University of Texas Austin",
      testScores: [
        { testName: "SAT", score: "1380" },
        { testName: "AP", score: "English Language: 5" },
        { testName: "AP", score: "Psychology: 4" }
      ],
      courseHistory: "AP English Language (A+), AP Psychology (A), Honors World History (A), Journalism (A+), Public Speaking (A), Spanish IV (A-)",
      activities: [
        { 
          name: "School Newspaper", 
          notes: "Editor-in-Chief, 3 years, 10 hrs/week, Led team of 15 student journalists, won state awards"
        },
        { 
          name: "Podcast Production", 
          notes: "Creator & Host, 2 years, 5 hrs/week, 1,500+ monthly listeners, interviews local leaders"
        },
        { 
          name: "Debate Team", 
          notes: "Captain, 3 years, 6 hrs/week, State finalist in Public Forum debate"
        }
      ],
      additionalInfo: "I interned at our local NPR affiliate radio station where I helped produce segments for their youth program. I also attended a summer journalism workshop at Northwestern's Medill School of Journalism where I produced a multimedia feature story."
    };
    
    // Define templates for different categories (keep old ones for backwards compatibility)
    const businessTemplate: FormValues = {
      studentName: "Jordan Chen",
      highSchool: "Westlake High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Business Administration",
      collegeList: "Wharton (UPenn), NYU Stern, University of Michigan Ross, UC Berkeley Haas, Georgetown McDonough",
      testScores: [
        { testName: "SAT", score: "1520" },
        { testName: "AP", score: "Macroeconomics: 5" },
        { testName: "AP", score: "Statistics: 4" }
      ],
      courseHistory: "Honors Algebra II (A), AP Macroeconomics (A), AP Statistics (A-), Honors English 10 (A-), Spanish III (B+), World History (A)",
      activities: [
        { 
          name: "DECA Business Club", 
          notes: "Chapter President, 3 years, 5 hrs/week, Led team to national finals in entrepreneurship competition"
        },
        { 
          name: "Student Investment Club", 
          notes: "Founder & President, 2 years, 3 hrs/week, Manage virtual $100k portfolio with 20+ members"
        },
        { 
          name: "Junior Achievement", 
          notes: "Student Company CFO, 1 year, 4 hrs/week, Managed finances for student-run business"
        }
      ],
      additionalInfo: "I started a small e-commerce business selling custom phone cases that generated $5,000 in revenue. I also completed a summer internship at a local financial advisory firm."
    };
    
    const computerScienceTemplate: FormValues = {
      studentName: "Alex Wang",
      highSchool: "Central Tech High School",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Computer Science",
      collegeList: "MIT, Stanford, Carnegie Mellon, UC Berkeley, Georgia Tech",
      testScores: [
        { testName: "SAT", score: "1560" },
        { testName: "AP", score: "Computer Science A: 5" },
        { testName: "AP", score: "Calculus BC: 5" },
        { testName: "AP", score: "Physics C: 5" }
      ],
      courseHistory: "AP Computer Science A (A+), AP Calculus BC (A+), AP Physics C (A), Data Structures (A+, dual enrollment), AP English Literature (A-), Spanish IV (B+)",
      activities: [
        { 
          name: "Robotics Team", 
          notes: "Programming Lead, 3 years, 12 hrs/week, Designed AI algorithms for competition robot"
        },
        { 
          name: "Hackathon Participant", 
          notes: "Team Leader, 3 years, 10+ hackathons, Won Best Mobile App award at StateHacks"
        },
        { 
          name: "CS Tutor", 
          notes: "Volunteer, 2 years, 4 hrs/week, Teaching coding to middle school students"
        }
      ],
      additionalInfo: "I've developed three mobile apps that are published on the App Store with over 10,000 combined downloads. I also completed a summer internship at a tech startup where I worked on their backend systems using Node.js and MongoDB."
    };
    
    const economicsTemplate: FormValues = {
      studentName: "Elijah Brooks",
      highSchool: "Riverside Prep Academy",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Economics",
      collegeList: "Harvard, Princeton, Chicago, Northwestern, Duke",
      testScores: [
        { testName: "SAT", score: "1540" },
        { testName: "AP", score: "Microeconomics: 5" },
        { testName: "AP", score: "Macroeconomics: 5" },
        { testName: "AP", score: "Calculus AB: 5" }
      ],
      courseHistory: "AP Microeconomics (A+), AP Macroeconomics (A+), AP Calculus AB (A), AP Statistics (A), AP English Language (A), World History (A-)",
      activities: [
        { 
          name: "Economics Challenge", 
          notes: "Team Captain, 2 years, 4 hrs/week, National finalists, specialized in economic policy"
        },
        { 
          name: "Research Assistant", 
          notes: "Volunteer, 1 year, 5 hrs/week, Helping economics professor with data analysis"
        },
        { 
          name: "Investment Club", 
          notes: "Vice President, 2 years, 3 hrs/week, Analyzing economic trends and stock market patterns"
        }
      ],
      additionalInfo: "I wrote a research paper on the economic impact of climate change policies that was published in our state's high school economics journal. I also participated in the Economics for Leaders summer program at Yale University."
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
      collegeList: "MIT, Stanford, Princeton, Harvard, Harvey Mudd",
      testScores: [
        { testName: "SAT", score: "1580" },
        { testName: "AP", score: "Calculus BC: 5" },
        { testName: "AP", score: "Statistics: 5" },
        { testName: "AP", score: "Physics C: 5" }
      ],
      courseHistory: "AP Calculus BC (A+), AP Statistics (A+), AP Physics C (A+), Multivariable Calculus (A+, dual enrollment), AP Computer Science A (A), AP English Literature (A-)",
      activities: [
        { 
          name: "Math Team", 
          notes: "Captain, 4 years, 8 hrs/week, Multiple state champion, AIME qualifier for 3 years"
        },
        { 
          name: "Math Research", 
          notes: "Student Researcher, 2 years, 5 hrs/week, Working on number theory problems with university professor"
        },
        { 
          name: "Math Circle", 
          notes: "Instructor, 2 years, 3 hrs/week, Teaching advanced math concepts to middle school students"
        }
      ],
      additionalInfo: "I published a paper on prime number patterns in a youth mathematics journal. I've qualified for the USAMO (United States of America Mathematical Olympiad) and attended the Program in Mathematics for Young Scientists (PROMYS) at Boston University for two summers."
    };
    
    const philosophyTemplate: FormValues = {
      studentName: "Ethan Williams",
      highSchool: "Riverside High School",
      currentGrade: "10th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Philosophy",
      collegeList: "Yale, Princeton, Williams, Swarthmore, Amherst",
      testScores: [
        { testName: "SAT", score: "1510" },
        { testName: "AP", score: "English Literature: 5" },
        { testName: "AP", score: "European History: 5" },
        { testName: "AP", score: "Psychology: 5" }
      ],
      courseHistory: "AP English Literature (A+), AP European History (A+), AP Psychology (A+), AP US History (A), Ethics Elective (A+), Latin IV (A)",
      activities: [
        { 
          name: "Philosophy Club", 
          notes: "Founder & President, 3 years, 4 hrs/week, Organizing weekly philosophical discussions and debates"
        },
        { 
          name: "Ethics Bowl", 
          notes: "Team Captain, 2 years, 6 hrs/week, Regional champions, competed at national level"
        },
        { 
          name: "Literary Magazine", 
          notes: "Editor-in-Chief, 2 years, 5 hrs/week, Publishing philosophical essays and literary criticism"
        }
      ],
      additionalInfo: "I've written a 40-page thesis on epistemology and skepticism that won a state philosophy essay contest. I also participated in a summer philosophy program at Yale where I studied contemporary moral theory and completed an independent research project."
    };
    
    const physicsTemplate: FormValues = {
      studentName: "Nathan Chen",
      highSchool: "Oakwood Science Academy",
      currentGrade: "11th" as "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Physics, Astrophysics",
      collegeList: "MIT, Caltech, Princeton, Stanford, UC Berkeley",
      testScores: [
        { testName: "SAT", score: "1570" },
        { testName: "AP", score: "Physics C: Mechanics: 5" },
        { testName: "AP", score: "Physics C: E&M: 5" },
        { testName: "AP", score: "Calculus BC: 5" }
      ],
      courseHistory: "AP Physics C: Mechanics (A+), AP Physics C: E&M (A+), AP Calculus BC (A+), Linear Algebra (A, dual enrollment), AP Computer Science A (A), AP Chemistry (A)",
      activities: [
        { 
          name: "Physics Olympiad", 
          notes: "Participant, 3 years, 10 hrs/week, National semifinalist, specialized in mechanics and electromagnetism"
        },
        { 
          name: "Astrophysics Research", 
          notes: "Research Assistant, 2 years, 8 hrs/week, Analyzing stellar spectra data with university professor"
        },
        { 
          name: "Science Bowl", 
          notes: "Team Captain, 3 years, 5 hrs/week, Regional champions, specialized in physics questions"
        }
      ],
      additionalInfo: "I developed a computational model for simulating galaxy formation that won first place at the International Science and Engineering Fair. I also attended the Summer Science Program in Astrophysics where I helped determine the orbit of a near-Earth asteroid using original observations."
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
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${showTemplateDialog ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-academic-navy">Choose a Major Profile</h3>
        <p className="text-sm text-gray-600 mb-4">Select a major to load a sample student profile:</p>
        
        <div className="space-y-2">
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
              className="w-full text-left px-4 py-3 border rounded-md hover:bg-academic-cream hover:border-academic-gold transition-colors"
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
            Cancel
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
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-academic-navy via-academic-burgundy to-academic-navy bg-clip-text text-transparent drop-shadow-sm leading-tight md:leading-relaxed pb-3">
          From where you are<br />
          to <em>where you want to be</em>.
        </h1>
        <p className="font-heading text-xl text-academic-navy mb-8 max-w-3xl mx-auto border-academic-gold/30 py-3 px-4 inline-block">
          Get your college application plan in one simple, actionable timeline.
        </p>
        
        {/* School Logos Section */}
        <SchoolLogos />
        
        <p className="text-sm text-academic-slate mb-6 mt-4 max-w-2xl mx-auto">
          Answer a few questions about your academic profile and goals<br />
          to receive a personalized college application timeline and strategic recommendations. <br />
          All your information is processed securely and never stored on our servers.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
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