export interface Student {
  id: string
  event_id: string
  university: string
  full_name: string
  email: string
  phone?: string
  degree?: string
  gpa?: number
  resume_url?: string
  created_at: string
}

export interface Interview {
  id: string
  event_id: string
  student_id: string
  recruiter_id: string
  rating_overall?: number
  rating_tech?: number
  rating_comm?: number
  feedback?: string
  created_at: string
}

export interface RecruitingEvent {
  id: string
  name: string
  is_active: boolean
  created_at: string
  ended_at?: string
}

export interface StudentWithInterviewSummary extends Student {
  interviews_count: number
  avg_overall?: number
  avg_tech?: number
  avg_comm?: number
  latest_feedback?: string
  has_interview: boolean
}

export interface UploadResponse {
  signedUrl: string
  path: string
}

export interface StudentsResponse {
  items: StudentWithInterviewSummary[]
  total: number
}

export interface InterviewFormData {
  student_id: string
  rating_overall: number
  rating_tech: number
  rating_comm: number
  feedback: string
}

export interface StudentFormData {
  university: string
  full_name: string
  email: string
  phone?: string
  degree?: string
  gpa?: number
  resume_path?: string
}
