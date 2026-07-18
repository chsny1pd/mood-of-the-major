export function ageFromBirthYear(birthYear: number, now: Date = new Date()): number {
  return now.getUTCFullYear() - birthYear;
}
