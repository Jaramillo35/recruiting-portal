import { redirect } from 'next/navigation'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { InterviewPage } from '@/components/recruiter/InterviewPage'

async function getStudentData(studentId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/recruiter/student/${studentId}?signedResume=1`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch student data:', error)
    return null
  }
}

export default async function InterviewPageRoute({
  params
}: {
  params: { id: string }
}) {
  // Server-side recruiter/admin guard
  const supabase = await createServerClientOnly()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: appUser } = await supabase
    .from('app_user')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!appUser || !['recruiter', 'admin'].includes(appUser.role)) {
    redirect('/')
  }

  // Fetch student data
  const studentData = await getStudentData(params.id)

  if (!studentData) {
    redirect('/recruiter')
  }

  return <InterviewPage student={studentData} />
}