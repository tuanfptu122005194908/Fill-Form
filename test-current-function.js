// Test current function version
const testCurrentFunction = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== TESTING CURRENT FUNCTION VERSION ===');
    
    // Test with user_id = 3 (the real user we created)
    const response = await fetch(`${supabaseUrl}/functions/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_order',
        user_id: 3, // Real user ID
        amount_vnd: 35000
      })
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    // If 400, let's check what the error is
    if (response.status === 400) {
      try {
        const errorData = JSON.parse(result);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error:', result);
      }
    }
    
  } catch (error) {
    console.error('Error testing function:', error);
  }
};

testCurrentFunction();
