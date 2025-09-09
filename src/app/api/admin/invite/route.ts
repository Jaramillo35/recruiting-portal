import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { inviteRecruiterSchema } from '@/lib/validations'
import { Resend } from 'resend'

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin')
    const body = await request.json()
    const validatedData = inviteRecruiterSchema.parse(body)

    const supabase = await createServerClientOnly()

    // Create new user and send invite
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      email_confirm: true,
      user_metadata: { role: 'recruiter' }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Update app_user role to recruiter
    await supabase
      .from('app_user')
      .update({ role: 'recruiter' })
      .eq('auth_user_id', newUser.user.id)

    // Send magic link for recruiter
    const { error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: validatedData.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/recruiter`
      }
    })

    if (magicLinkError) {
      console.error('Magic link generation error:', magicLinkError)
      return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 })
    }

    // Send invitation email with magic link
    const resend = getResendClient()
    const { error: emailError } = await resend.emails.send({
      from: 'careers@company.com',
      to: [validatedData.email],
      subject: 'You\'ve been invited to join our Recruiting Portal',
      html: `
        <h2>Welcome to the Recruiting Portal</h2>
        <p>You've been invited to join our recruiting team as a recruiter.</p>
        <p>Click the link below to sign in with your email address: <strong>${validatedData.email}</strong></p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In to Portal</a></p>
        <p>Best regards,<br>The Recruiting Team</p>
      `
    })

    if (emailError) {
      console.error('Email error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
