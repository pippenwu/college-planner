import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
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
  highSchool: z.string().optional(),
  currentGrade: z.enum(["<9th", "9th", "10th", "11th", "12th"]).optional(),

  // Intended Major and College List
  intendedMajors: z.string().optional(),
  collegeList: z.string().optional(),

  // Academics & Testing
  satScore: z.string().optional(),
  actScore: z.string().optional(),
  toeflScore: z.string().optional(),
  ieltsScore: z.string().optional(),
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
  },
  {
    id: "additional",
    title: "More Info",
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
      satScore: "",
      actScore: "",
      toeflScore: "",
      ieltsScore: "",
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
                  <FormLabel>Current High School</FormLabel>
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
                    <FormLabel>Intended Major(s)</FormLabel>
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
                  <FormLabel>College List</FormLabel>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="satScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SAT Score</FormLabel>
                    <FormControl>
                      <Input placeholder="1480" {...field} />
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
                    <FormLabel>ACT Score</FormLabel>
                    <FormControl>
                      <Input placeholder="32" {...field} />
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
                    <FormLabel>TOEFL Score</FormLabel>
                    <FormControl>
                      <Input placeholder="105" {...field} />
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
                    <FormLabel>IELTS Score</FormLabel>
                    <FormControl>
                      <Input placeholder="7.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      placeholder="I've been coding since age 12 and developed an app that has 5,000 users. I'm also a first-generation college student."
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
        <div className="mb-8 p-6 bg-blue-50 rounded-lg text-center">
          <p className="text-lg font-semibold mb-4">Generating your college application plan...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "100%" }}></div>
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
          <p className="text-center text-gray-600 mb-6">
            Fill in the form as detailed as possible, but you are free to leave anything blank if you wish. 
            A more detailed form will result in a more tailored report.
          </p>
          
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