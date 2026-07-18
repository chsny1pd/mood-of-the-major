export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getUTCFullYear() - birthYear;
}
