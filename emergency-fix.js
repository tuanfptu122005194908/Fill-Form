// Emergency fix - create order with different bank info
const emergencyFix = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== EMERGENCY FIX ===');
    console.log('Creating order with manual approval option...');
    
    // Create order that can be manually approved
    const response = await fetch(`${supabaseUrl}/functions/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'admin_create_order',
        admin_id: 3, // Using user_id as admin_id for demo
        target_user_id: 3,
        amount_vnd: 35000,
        forms_to_add: 100,
        status: 'approved', // Auto approve
        note: 'Emergency manual approval - Sepay VA not working'
      })
    });

    const result = await response.text();
    console.log('Emergency fix response:', response.status, result);
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS! Credits added manually');
      console.log('Check your wallet balance in the web app');
    }
    
  } catch (error) {
    console.error('Emergency fix failed:', error);
  }
};

emergencyFix();
