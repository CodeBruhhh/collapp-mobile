/** Student profile fields from the Students table (SDD 4.2). */
export interface StudentProfile {
  fullName: string;
  email: string;
  academicBackground: string;
  targetMajors: string[];
  preferredLocations: string[];
}
