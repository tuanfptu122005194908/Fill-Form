// Debug orders function
const debugOrdersFunction = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== DEBUG ORDERS FUNCTION ===');
    
    // Test 1: Get public settings
    console.log('\n1. Testing get_public_settings...');
    const settingsResponse = await fetch(`${supabaseUrl}/functions/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_public_settings'
      })
    });

    const settingsResult = await settingsResponse.text();
    console.log('Settings response:', settingsResponse.status, settingsResult);

    // Test 2: Check order status
    console.log('\n2. Testing check_order_status...');
    const statusResponse = await fetch(`${supabaseUrl}/functions/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check_order_status',
        order_id: 11,
        user_id: 1
      })
    });

    const statusResult = await statusResponse.text();
    console.log('Status response:', statusResponse.status, statusResult);

    // Test 3: Create order (like web app does)
    console.log('\n3. Testing create_order...');
    const createResponse = await fetch(`${supabaseUrl}/functions/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_order',
        user_id: 1,
        amount_vnd: 35000
      })
    });

    const createResult = await createResponse.text();
    console.log('Create response:', createResponse.status, createResult);
    
  } catch (error) {
    console.error('Error debugging orders function:', error);
  }
};

debugOrdersFunction();
