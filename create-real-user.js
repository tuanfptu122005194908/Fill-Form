// Create real user for login
const createRealUser = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('Creating real user via auth function...');
    
    // Use auth function to register (this bypasses RLS)
    const response = await fetch(`${supabaseUrl}/functions/v1/auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        email: 'test@example.com',
        password: '123456',
        name: 'Test User',
        phone: '0123456789'
      })
    });

    const result = await response.text();
    console.log('Register response:', response.status, result);
    
    if (response.status === 200) {
      console.log('\n✅ User created successfully!');
      console.log('You can now login with:');
      console.log('Email: test@example.com');
      console.log('Password: 123456');
      console.log('\nAfter login, try creating an order in the web app.');
    }
    
  } catch (error) {
    console.error('Error creating real user:', error);
  }
};

createRealUser();
