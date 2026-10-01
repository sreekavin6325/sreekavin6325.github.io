// Contact form rules, shared by the form (src/components/sections/Contact.tsx) and the
// API route that saves messages (src/app/api/contact/route.ts).

export const TOPICS = ["A project", "Job opportunity", "Collaboration", "Just saying hi"] as const;
export type Topic = (typeof TOPICS)[number];

export const NAME_LIMIT = 200;
export const MESSAGE_LIMIT = 10000;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

/** At most SEND_LIMIT messages per email address within SEND_WINDOW_MS. */
export const SEND_LIMIT = 2;
export const SEND_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ContactField = "name" | "email" | "phone" | "message";
export type ContactValues = Record<ContactField, string>;

export function validateContact(values: ContactValues): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};
  const name = values.name.trim();
  if (!name) errors.name = "Tell me who you are.";
  else if (name.length > NAME_LIMIT) errors.name = "That name is a little long.";
  if (!EMAIL_PATTERN.test(values.email.trim()) || values.email.length > NAME_LIMIT) {
    errors.email = "That email doesn't look quite right.";
  }
  if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) errors.phone = "Check that number.";
  const message = values.message.trim();
  if (message.length < 10) errors.message = "A little more detail, please (10+ characters).";
  else if (message.length > MESSAGE_LIMIT) errors.message = `Please keep it under ${MESSAGE_LIMIT} characters.`;
  return errors;
}
