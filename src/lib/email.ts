import { Resend } from 'resend'
import { StudentReportData } from './csv'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReportEmail(
  eventName: string,
  csvData: string,
  studentData: StudentReportData[]
) {
  const totalStudents = studentData.length
  const totalInterviews = studentData.reduce((sum, s) => sum + s.interviews_count, 0)
  const studentsWithResumes = studentData.filter(s => s.resume_path).length
  const resumePercentage = totalStudents > 0 ? Math.round((studentsWithResumes / totalStudents) * 100) : 0
  
  const allRatings = studentData
    .filter(s => s.avg_overall !== null)
    .map(s => s.avg_overall!)
  const avgOverallRating = allRatings.length > 0 
    ? (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(2)
    : 'N/A'

  const topCandidates = studentData
    .filter(s => s.avg_overall !== null)
    .sort((a, b) => {
      if (b.avg_overall! !== a.avg_overall!) {
        return b.avg_overall! - a.avg_overall!
      }
      return b.interviews_count - a.interviews_count
    })
    .slice(0, 10)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recruiting Report - ${eventName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .kpis { display: flex; gap: 20px; margin-bottom: 30px; }
        .kpi { background: #e9ecef; padding: 15px; border-radius: 6px; text-align: center; min-width: 120px; }
        .kpi-value { font-size: 24px; font-weight: bold; color: #495057; }
        .kpi-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .rating { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Recruiting Report - ${eventName}</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="kpis">
        <div class="kpi">
          <div class="kpi-value">${totalStudents}</div>
          <div class="kpi-label">Total Students</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${totalInterviews}</div>
          <div class="kpi-label">Total Interviews</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${resumePercentage}%</div>
          <div class="kpi-label">With Resumes</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${avgOverallRating}</div>
          <div class="kpi-label">Avg Rating</div>
        </div>
      </div>

      <h2>Top 10 Candidates</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>University</th>
            <th>Degree</th>
            <th>GPA</th>
            <th>Interviews</th>
            <th>Avg Rating</th>
            <th>Latest Feedback</th>
          </tr>
        </thead>
        <tbody>
          ${topCandidates.map(candidate => `
            <tr>
              <td>${candidate.full_name}</td>
              <td>${candidate.university}</td>
              <td>${candidate.degree || 'N/A'}</td>
              <td>${candidate.gpa || 'N/A'}</td>
              <td>${candidate.interviews_count}</td>
              <td class="rating">${candidate.avg_overall?.toFixed(2) || 'N/A'}</td>
              <td>${candidate.latest_feedback_short || 'No feedback'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
        Complete data is available in the attached CSV file.
      </p>
    </body>
    </html>
  `

  const { data, error } = await resend.emails.send({
    from: 'careers@company.com',
    to: [process.env.REPORT_RECEIVER_EMAIL!],
    subject: `Recruiting Report – ${eventName} – ${new Date().toISOString().slice(0, 10)}`,
    html: htmlContent,
          attachments: [
        {
          filename: `report-${eventName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`,
          content: Buffer.from(csvData).toString('base64')
        }
      ]
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
