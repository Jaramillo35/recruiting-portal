// Temporary script to set up admin user
// Run with: node setup-admin.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdmin() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    console.log('Available users:')
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
    })

    // For now, let's update the first user to admin
    if (users.users.length > 0) {
      const firstUser = users.users[0]
      console.log(`\nUpdating ${firstUser.email} to admin role...`)
      
      const { error: updateError } = await supabase
        .from('app_user')
        .update({ role: 'admin' })
        .eq('auth_user_id', firstUser.id)

      if (updateError) {
        console.error('Error updating user role:', updateError)
      } else {
        console.log('✅ Successfully updated user to admin role!')
        console.log('You can now access the admin dashboard.')
      }
    } else {
      console.log('No users found. Please sign in first.')
    }
  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupAdmin()
