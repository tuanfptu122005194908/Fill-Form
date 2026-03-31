// Create test user
const createTestUser = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('Creating test user...');
    
    // Create user
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'USER',
        status: 'active'
      })
    });

    const user = await userResponse.json();
    console.log('Created user:', user);

    // Create user profile
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profile`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.user_id,
        full_name: 'Test User',
        phone: '0123456789'
      })
    });

    const profile = await profileResponse.json();
    console.log('Created profile:', profile);

    // Create user wallet
    const walletResponse = await fetch(`${supabaseUrl}/rest/v1/user_wallet`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.user_id,
        form_balance: 0,
        total_forms_added: 0,
        total_forms_used: 0
      })
    });

    const wallet = await walletResponse.json();
    console.log('Created wallet:', wallet);
    
    console.log(`\n✅ Test user created with ID: ${user.user_id}`);
    console.log('Now you can use this user_id to create orders.');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

createTestUser();
