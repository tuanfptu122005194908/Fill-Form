// Debug web app authentication
const debugWebAppAuth = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== DEBUG WEB APP AUTH ===');
    
    // Test login to get user info
    const loginResponse = await fetch(`${supabaseUrl}/functions/v1/auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        email: 'test@example.com',
        password: '123456'
      })
    });

    const loginResult = await loginResponse.text();
    console.log('Login response:', loginResponse.status, loginResult);
    
    if (loginResponse.status === 200) {
      const userData = JSON.parse(loginResult);
      console.log('User data:', userData);
      
      // Now test create order with this user_id
      const orderResponse = await fetch(`${supabaseUrl}/functions/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_order',
          user_id: userData.user.user_id,
          amount_vnd: 35000
        })
      });

      const orderResult = await orderResponse.text();
      console.log('Order response:', orderResponse.status, orderResult);
    }
    
  } catch (error) {
    console.error('Error debugging auth:', error);
  }
};

debugWebAppAuth();
