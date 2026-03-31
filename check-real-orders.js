// Check all orders to see what exists
const checkAllOrders = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== CHECKING ALL ORDERS ===');
    
    // Check all orders
    const allOrdersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const allOrders = await allOrdersResponse.json();
    console.log('All orders:', allOrders);
    
    // Check pending orders specifically
    const pendingResponse = await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.pending&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const pendingOrders = await pendingResponse.json();
    console.log('Pending orders:', pendingOrders);
    
    // If there are any orders, test webhook with their content
    if (allOrders.length > 0) {
      const latestOrder = allOrders[0];
      console.log(`\nTesting webhook with latest order content: ${latestOrder.transfer_content}`);
      
      const webhookResponse = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferType: 'in',
          transferAmount: latestOrder.amount_vnd.toString(),
          content: latestOrder.transfer_content,
          gateway: 'BIDV',
          accountNumber: '96247PAY05',
          transactionId: 'TEST' + Date.now()
        })
      });

      const result = await webhookResponse.text();
      console.log('Webhook test with real order:', webhookResponse.status, result);
    }
    
  } catch (error) {
    console.error('Error checking orders:', error);
  }
};

checkAllOrders();
