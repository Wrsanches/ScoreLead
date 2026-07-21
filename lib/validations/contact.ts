import { z } from "zod"

export const inquiryTypes = ["sales", "support", "partnership"] as const

export type ContactValidationMessages = {
  nameRequired: string
  nameTooLong: string
  emailInvalid: string
  companyTooLong: string
  inquiryRequired: string
  subjectTooShort: string
  subjectTooLong: string
  messageTooShort: string
  messageTooLong: string
}

const defaultMessages: ContactValidationMessages = {
  nameRequired: "Enter your name.",
  nameTooLong: "Name must be 100 characters or fewer.",
  emailInvalid: "Enter a valid email address.",
  companyTooLong: "Company must be 120 characters or fewer.",
  inquiryRequired: "Choose an inquiry type.",
  subjectTooShort: "Subject must be at least 3 characters.",
  subjectTooLong: "Subject must be 160 characters or fewer.",
  messageTooShort: "Message must be at least 20 characters.",
  messageTooLong: "Message must be 5,000 characters or fewer.",
}

export function createContactSchema(
  messages: ContactValidationMessages = defaultMessages,
) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(100, messages.nameTooLong),
    email: z.email(messages.emailInvalid).max(254, messages.emailInvalid),
    company: z.string().trim().max(120, messages.companyTooLong),
    inquiryType: z.enum(inquiryTypes, { error: messages.inquiryRequired }),
    subject: z
      .string()
      .trim()
      .min(3, messages.subjectTooShort)
      .max(160, messages.subjectTooLong)
      .refine((value) => !/[\r\n]/.test(value), messages.subjectTooLong),
    message: z
      .string()
      .trim()
      .min(20, messages.messageTooShort)
      .max(5_000, messages.messageTooLong),
    website: z.string().max(200).optional().default(""),
  })
}

export const contactSchema = createContactSchema()

export type ContactFormValues = z.input<typeof contactSchema>
export type ContactSubmission = z.output<typeof contactSchema>
