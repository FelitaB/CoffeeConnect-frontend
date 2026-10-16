export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 20;

export const PASSWORD_REQUIREMENTS =
  `${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters, with at least one capital letter, one number and one symbol.`;

// Keep in sync with SetPasswordSchema in the backend's people.service.ts.
export function getPasswordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    problems.push(`be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters long`);
  }
  if (!/[A-Z]/.test(password)) problems.push("contain a capital letter");
  if (!/[0-9]/.test(password)) problems.push("contain a number");
  if (!/[^A-Za-z0-9\s]/.test(password)) problems.push("contain a symbol");
  return problems;
}

export function describePasswordProblems(problems: string[]): string {
  const list = problems.length > 1
    ? `${problems.slice(0, -1).join(", ")} and ${problems[problems.length - 1]}`
    : problems[0];
  return `Your password must ${list}.`;
}
