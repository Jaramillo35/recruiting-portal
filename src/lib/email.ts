import { Resend } from 'resend'
import { StudentReportData } from './csv'

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendReportEmail(
  eventName: string,
  csvData: string,
  htmlSummary: string
) {
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
      ${htmlSummary}
      
      <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
        Complete data is available in the attached CSV file.
      </p>
    </body>
    </html>
  `

  const resend = getResendClient()
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
