// Check current user info
const checkUserInfo = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== CHECK USER INFO ===');
    
    // Check all users
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=*&limit=10`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const users = await usersResponse.json();
    console.log('Users in database:', users);
    
    // Check orders with user info
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=*,users(*)`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const orders = await ordersResponse.json();
    console.log('Orders with user info:', orders);
    
  } catch (error) {
    console.error('Error checking user info:', error);
  }
};

checkUserInfo();
