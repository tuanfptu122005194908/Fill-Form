// Check pending orders with anon key
const checkPending = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== CHECK PENDING ORDERS ===');
    
    // Check all orders for user_id 3
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?user_id=eq.3&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const orders = await response.json();
    console.log('Your orders:', orders);
    
    const pendingOrders = orders.filter(o => o.status === 'pending');
    console.log('Pending orders:', pendingOrders);
    
    if (pendingOrders.length > 0) {
      const order = pendingOrders[0];
      console.log(`\n📋 Pending order found:`);
      console.log(`Order ID: ${order.order_id}`);
      console.log(`Amount: ${order.amount_vnd}đ`);
      console.log(`Credits: ${order.forms_to_add}`);
      console.log(`Content: ${order.transfer_content}`);
      console.log('\n💡 Now test webhook with this content:');
      
      // Test webhook
      const webhookResponse = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferType: 'in',
          transferAmount: order.amount_vnd.toString(),
          content: order.transfer_content,
          gateway: 'BIDV',
          accountNumber: '96247PAY05',
          transactionId: 'MANUAL' + Date.now(),
          transferDate: new Date().toISOString()
        })
      });

      const webhookResult = await webhookResponse.text();
      console.log('Webhook test:', webhookResponse.status, webhookResult);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

checkPending();
