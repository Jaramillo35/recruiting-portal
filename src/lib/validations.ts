import { z } from 'zod'

export const studentFormSchema = z.object({
  university: z.string().min(1, 'University is required'),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  degree: z.string().optional(),
  gpa: z.number().min(0).max(10).optional(),
  resume_path: z.string().optional(),
})

export const interviewFormSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  rating_overall: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  rating_tech: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  rating_comm: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  feedback: z.string().min(1, 'Feedback is required'),
})

export const inviteRecruiterSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
})

export type StudentFormData = z.infer<typeof studentFormSchema>
export type InterviewFormData = z.infer<typeof interviewFormSchema>
export type InviteRecruiterData = z.infer<typeof inviteRecruiterSchema>
export type CreateEventData = z.infer<typeof createEventSchema>
