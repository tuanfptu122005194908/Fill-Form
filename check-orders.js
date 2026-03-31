// Check existing orders
const checkOrders = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.pending&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const orders = await response.json();
    console.log('Pending orders:', orders);
    
    if (orders.length > 0) {
      console.log('Test webhook with first order content:', orders[0].transfer_content);
      
      // Test webhook with real order content
      const webhookResponse = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferType: 'in',
          transferAmount: orders[0].amount_vnd.toString(),
          content: orders[0].transfer_content,
          gateway: 'BIDV',
          accountNumber: '8816861222'
        })
      });

      const result = await webhookResponse.text();
      console.log('Webhook test result:', webhookResponse.status, result);
    }
    
  } catch (error) {
    console.error('Error checking orders:', error);
  }
};

checkOrders();
