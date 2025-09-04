# Recruiting Portal

A production-ready recruiting portal built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. This application allows students to submit applications, recruiters to review candidates and conduct interviews, and administrators to manage recruiting events and generate reports.

## Features

### For Students
- Submit application with personal details and resume upload
- Update application information
- View application status

### For Recruiters
- Browse and filter student applications
- View detailed student profiles
- Conduct interviews with rating system
- Access student resumes via signed URLs

### For Administrators
- Create and manage recruiting events
- Invite recruiters via email
- Generate comprehensive reports with CSV export
- End recruiting events with automated report generation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Email**: Resend
- **Deployment**: Vercel
- **Forms**: React Hook Form + Zod validation

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account (for email functionality)
- Vercel account (for deployment)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd recruiting-portal
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL schema from `supabase-schema.sql` to create all tables and policies
4. Enable Row Level Security (RLS) on all tables
5. Create a storage bucket named `resumes` (private)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Configuration
RESEND_API_KEY=your_resend_api_key_here
REPORT_RECEIVER_EMAIL=recruiting-reports@company.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add it to your environment variables

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses the following main tables:

- `app_user`: Maps Supabase auth users to application roles
- `recruiting_event`: Manages recruiting sessions
- `student`: Student profiles and applications
- `interview`: Recruiter feedback and ratings

All tables have Row Level Security (RLS) policies to ensure proper access control.

## User Roles

### Student (Default)
- Can submit and update their application
- Can upload resume
- Cannot view other students or interviews

### Recruiter
- Can view all student applications
- Can conduct interviews and provide ratings
- Can access student resumes
- Cannot access admin functions

### Admin
- Can create and manage recruiting events
- Can invite recruiters
- Can generate reports and end events
- Full access to all data

## API Endpoints

### Authentication
- `POST /api/auth` - Handle magic link callbacks

### Student Management
- `POST /api/student` - Submit/update student application
- `GET /api/student` - Get current user's student profile

### Recruiter Functions
- `GET /api/students` - List students with filtering and pagination
- `POST /api/interview` - Submit interview feedback

### File Management
- `POST /api/upload` - Get signed upload URL for resume
- `GET /api/upload` - Get signed read URL for resume

### Admin Functions
- `GET /api/admin/event` - List all events
- `POST /api/admin/event` - Create new event or close current event
- `POST /api/admin/invite` - Invite recruiter via email
- `POST /api/admin/report` - Generate and email report

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `REPORT_RECEIVER_EMAIL`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Usage Guide

### For Administrators

1. **Create a Recruiting Event**
   - Go to Admin Panel
   - Enter event name and click "Create"
   - This will deactivate any previous events

2. **Invite Recruiters**
   - Enter recruiter email in the invite section
   - Recruiter will receive login instructions via email

3. **End Event and Generate Report**
   - Click "End Recruiting Event" when ready
   - System will generate CSV report and HTML summary
   - Report will be emailed to configured address
   - Event will be marked as inactive

### For Recruiters

1. **Access Dashboard**
   - Sign in with invited email
   - Use filters to find specific students
   - Click on student name to view full profile

2. **Conduct Interview**
   - Click "Conduct Interview" on student profile
   - Rate overall, technical, and communication skills (1-5)
   - Provide detailed feedback
   - Submit interview

### For Students

1. **Submit Application**
   - Sign in with email (magic link)
   - Fill out application form
   - Upload resume (PDF, DOC, DOCX)
   - Submit application

2. **Update Application**
   - Return to application page to make changes
   - Upload new resume if needed

## Security Features

- Row Level Security (RLS) on all database tables
- Role-based access control
- Signed URLs for file access with expiration
- Input validation with Zod schemas
- XSS protection in email templates

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── apply/             # Student application
│   ├── login/             # Authentication
│   └── recruiter/         # Recruiter pages
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # Authentication helpers
│   ├── csv.ts            # CSV generation
│   ├── email.ts          # Email functionality
│   ├── supabaseBrowser.ts
│   ├── supabaseServer.ts
│   └── validations.ts    # Zod schemas
└── types/                # TypeScript type definitions
```

## Troubleshooting

### Common Issues

1. **Magic Link Not Working**
   - Check Supabase auth settings
   - Ensure redirect URLs are configured
   - Check email delivery settings

2. **File Upload Issues**
   - Verify Supabase storage bucket exists
   - Check storage policies
   - Ensure file size is under 5MB

3. **Email Not Sending**
   - Verify Resend API key
   - Check email domain configuration
   - Review Resend dashboard for errors

4. **Permission Errors**
   - Check RLS policies in Supabase
   - Verify user roles in app_user table
   - Ensure proper authentication flow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.