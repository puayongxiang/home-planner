const EDITOR_EMAILS = new Set([
  "puayongxiang@gmail.com",
  "evonne89@gmail.com",
]);

export function isEditorEmail(email: string | null | undefined): boolean {
  return !!email && EDITOR_EMAILS.has(email.toLowerCase());
}
