/**
 * Helper functions for the application
 */

/**
 * Maps a grade string to a numeric value
 * @param grade - The grade string from the form
 * @returns The numeric grade value (9-12 for high school, 13-16 for college)
 */
export function getGradeNumber(grade: string): number {
  const gradeMap: Record<string, number> = {
    'Freshman (9th)': 9,
    'Sophomore (10th)': 10,
    'Junior (11th)': 11, 
    'Senior (12th)': 12,
    'College Freshman': 13,
    'College Sophomore': 14,
    'College Junior': 15,
    'College Senior': 16
  };

  return gradeMap[grade] || 0;
}

/**
 * Calculates the expected graduation year based on current grade
 * @param grade - The grade string from the form
 * @returns The expected graduation year
 */
export function getExpectedGraduationYear(grade: string): number {
  const currentYear = new Date().getFullYear();
  const gradeNumber = getGradeNumber(grade);
  
  if (gradeNumber >= 9 && gradeNumber <= 12) {
    // High school: 12th grade is graduation year
    return currentYear + (12 - gradeNumber);
  } else if (gradeNumber >= 13 && gradeNumber <= 16) {
    // College: 16th grade (College Senior) is graduation year
    return currentYear + (16 - gradeNumber);
  }
  
  return currentYear + 4; // Default to 4 years if grade is unknown
}

/**
 * Returns a readable string for the student's academic level
 * @param grade - The grade string from the form
 * @returns A human-readable description of the student's academic level
 */
export function getAcademicLevel(grade: string): string {
  const gradeNumber = getGradeNumber(grade);
  
  if (gradeNumber >= 9 && gradeNumber <= 12) {
    return 'High School';
  } else if (gradeNumber >= 13 && gradeNumber <= 16) {
    return 'College';
  }
  
  return 'Student';
} 