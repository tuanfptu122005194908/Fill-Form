// Test exactly like web app does
const testWebAppRequest = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== TESTING EXACTLY LIKE WEB APP ===');
    
    // Test with different user_ids to see which one works
    const userIds = [1, 2, 999, 'test'];
    
    for (const userId of userIds) {
      console.log(`\nTesting with user_id: ${userId}`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_order',
          user_id: userId,
          amount_vnd: 35000
        })
      });

      const result = await response.text();
      console.log(`Response: ${response.status}, Body: ${result}`);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS with user_id:', userId);
        break;
      }
    }
    
  } catch (error) {
    console.error('Error testing web app request:', error);
  }
};

testWebAppRequest();
