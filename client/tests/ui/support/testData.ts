const PREFIX = "e2e-pw";

export function uniqueName(label: string): string {
  return `${PREFIX}-${label}-${crypto.randomUUID()}`;
}
