import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { usePayment } from '../context/PaymentContext';
import { reportApi } from "../services/apiClient";
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

interface StudentProfileFormProps {
  onReportVisibilityChange?: (isVisible: boolean) => void;
}

export function StudentProfileForm({ onReportVisibilityChange }: StudentProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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
          const report = await reportApi.generateReport(pendingReportData);
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
        
        // Return the generated report HTML
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
                    List courses you've taken with grades if available (include AP scores if applicable)
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
    
    // Define templates for different categories
    const businessTemplate: FormValues = {
      studentName: "Jordan Chen",
      highSchool: "Westlake High School",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Business Administration, Finance, Economics",
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
    
    const scienceMathTemplate: FormValues = {
      studentName: "Aisha Patel",
      highSchool: "Oakridge High School",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Biology, Biochemistry, Pre-Med",
      collegeList: "Johns Hopkins, Duke, UCLA, UNC Chapel Hill, Washington University in St. Louis",
      testScores: [
        { testName: "SAT", score: "1490" },
        { testName: "AP", score: "Biology: 5" },
        { testName: "AP", score: "Chemistry: 4" }
      ],
      courseHistory: "AP Biology (A+), AP Chemistry (A), Honors Precalculus (A), Honors English 10 (A), Spanish II (A-), World History (A-)",
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
          name: "Research Assistant", 
          notes: "Lab Assistant, 1 year, 6 hrs/week, Assisting with cancer research at local university"
        }
      ],
      additionalInfo: "I'm passionate about pediatric medicine and have been shadowing doctors at the local children's hospital. I also participated in a summer research program focused on cell biology."
    };
    
    const engineeringTemplate: FormValues = {
      studentName: "Malik Johnson",
      highSchool: "Central Technical High School",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Mechanical Engineering, Aerospace Engineering",
      collegeList: "MIT, Georgia Tech, Purdue, University of Michigan, Caltech",
      testScores: [
        { testName: "SAT", score: "1510" },
        { testName: "AP", score: "Physics 1: 5" },
        { testName: "AP", score: "Calculus AB: 5" }
      ],
      courseHistory: "AP Physics 1 (A+), AP Calculus AB (A), Honors Chemistry (A), Intro to Engineering Design (A+), English 10 (B+), US History (A-)",
      activities: [
        { 
          name: "Robotics Team", 
          notes: "Lead Engineer, 3 years, 10 hrs/week, Designed robot that won regional championship"
        },
        { 
          name: "3D Printing Club", 
          notes: "Founder & President, 2 years, 4 hrs/week, Teaching CAD design to 15+ members"
        },
        { 
          name: "Math Team", 
          notes: "Member, 2 years, 3 hrs/week, Placed 5th in state math competition"
        }
      ],
      additionalInfo: "I designed and built a working drone with custom 3D printed parts. I also completed an online course in AutoCAD and have been using the software to design sustainable housing concepts."
    };
    
    const socialScienceTemplate: FormValues = {
      studentName: "Sofia Rodriguez",
      highSchool: "Lincoln Academy",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Political Science, International Relations, Public Policy",
      collegeList: "Georgetown, American University, UC Berkeley, Columbia, University of Chicago",
      testScores: [
        { testName: "SAT", score: "1470" },
        { testName: "AP", score: "US Government: 5" },
        { testName: "AP", score: "World History: 4" }
      ],
      courseHistory: "AP US Government (A), AP World History (A-), Honors English 10 (A), Algebra II (B+), Spanish III (A-), Biology (B+)",
      activities: [
        { 
          name: "Model UN", 
          notes: "Secretary General, 3 years, 5 hrs/week, Led team to national conference, Best Delegate award"
        },
        { 
          name: "Debate Team", 
          notes: "Captain, 2 years, 6 hrs/week, State finalist in Lincoln-Douglas debate"
        },
        { 
          name: "Community Advocacy", 
          notes: "Volunteer Coordinator, 2 years, 4 hrs/week, Organized voter registration drives"
        }
      ],
      additionalInfo: "I interned at my local congressional office and helped research policy issues. I also started a podcast interviewing local political leaders about community issues that has over 500 listeners."
    };
    
    const humanitiesTemplate: FormValues = {
      studentName: "Ethan Williams",
      highSchool: "Riverside High School",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "English Literature, Philosophy, History",
      collegeList: "Brown, Amherst, Williams, Swarthmore, Wesleyan",
      testScores: [
        { testName: "SAT", score: "1480" },
        { testName: "AP", score: "English Language: 5" },
        { testName: "AP", score: "European History: 4" }
      ],
      courseHistory: "AP English Language (A+), AP European History (A), Honors Algebra II (B+), Chemistry (B), French III (A), Psychology (A)",
      activities: [
        { 
          name: "Literary Magazine", 
          notes: "Editor-in-Chief, 3 years, 5 hrs/week, Published award-winning school magazine"
        },
        { 
          name: "Writing Center", 
          notes: "Peer Tutor, 2 years, 4 hrs/week, Helped students improve writing skills"
        },
        { 
          name: "Philosophy Club", 
          notes: "Founder & President, 2 years, 2 hrs/week, Organize weekly philosophical discussions"
        }
      ],
      additionalInfo: "I've published short stories in two literary journals and won a regional essay contest. I also attended a summer program in creative writing at Columbia University."
    };
    
    const artMusicTemplate: FormValues = {
      studentName: "Zoe Kim",
      highSchool: "Westwood Arts Academy",
      currentGrade: "10th" as "<9th" | "9th" | "10th" | "11th" | "12th",
      intendedMajors: "Fine Arts, Graphic Design, Music Composition",
      collegeList: "Rhode Island School of Design, Juilliard, Berklee College of Music, Parsons School of Design, NYU Tisch",
      testScores: [
        { testName: "SAT", score: "1450" },
        { testName: "AP", score: "Art History: 5" },
        { testName: "AP", score: "Music Theory: 5" }
      ],
      courseHistory: "AP Art History (A+), AP Music Theory (A), Studio Art (A+), Honors English 10 (A-), Algebra II (B+), Chemistry (B)",
      activities: [
        { 
          name: "Symphony Orchestra", 
          notes: "First Violin, 4 years, 8 hrs/week, Selected for All-State Orchestra"
        },
        { 
          name: "Digital Arts Club", 
          notes: "President, 2 years, 5 hrs/week, Organized annual digital art exhibition"
        },
        { 
          name: "Community Theater", 
          notes: "Set Designer & Actor, 3 years, 10 hrs/week during productions, Lead roles in 3 plays"
        }
      ],
      additionalInfo: "I've composed original music that was performed at our school's spring concert. My digital artwork was selected for display at our city's youth art exhibition, and I've completed an internship with a local graphic design firm."
    };

    // Select template based on category
    switch (category) {
      case 'business':
        templateData = businessTemplate;
        break;
      case 'science-math':
        templateData = scienceMathTemplate;
        break;
      case 'engineering':
        templateData = engineeringTemplate;
        break;
      case 'social-science':
        templateData = socialScienceTemplate;
        break;
      case 'humanities':
        templateData = humanitiesTemplate;
        break;
      case 'art-music':
        templateData = artMusicTemplate;
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
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-academic-navy">Choose a Student Profile</h3>
        <p className="text-sm text-gray-600 mb-4">Select an academic interest to load a sample student profile:</p>
        
        <div className="space-y-2">
          {[
            { id: 'business', label: 'Business Student' },
            { id: 'science-math', label: 'Science/Math Student' },
            { id: 'engineering', label: 'Engineering Student' },
            { id: 'social-science', label: 'Social Science Student' },
            { id: 'humanities', label: 'Humanities Student' },
            { id: 'art-music', label: 'Art/Music Student' }
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
            Use Demo Profile
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