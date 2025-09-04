import { Parser } from 'json2csv'

export interface StudentReportData {
  event_name: string
  student_id: string
  full_name: string
  university: string
  degree: string | null
  gpa: number | null
  email: string
  phone: string | null
  resume_path: string | null
  interviews_count: number
  avg_overall: number | null
  avg_tech: number | null
  avg_comm: number | null
  latest_feedback_short: string | null
}

export function generateCSV(data: StudentReportData[]): string {
  const fields = [
    'event_name',
    'student_id', 
    'full_name',
    'university',
    'degree',
    'gpa',
    'email',
    'phone',
    'resume_path',
    'interviews_count',
    'avg_overall',
    'avg_tech',
    'avg_comm',
    'latest_feedback_short'
  ]

  const parser = new Parser({ fields })
  return parser.parse(data)
}
