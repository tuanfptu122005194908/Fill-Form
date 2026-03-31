// Create order then test webhook immediately
const createOrderForWebhook = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== CREATE ORDER + TEST WEBHOOK ===');
    
    // Step 1: Create order
    console.log('\n1️⃣ Creating order...');
    const orderResponse = await fetch(`${supabaseUrl}/functions/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_order',
        user_id: 3,
        amount_vnd: 35000
      })
    });

    if (orderResponse.status !== 200) {
      console.log('❌ Order creation failed:', orderResponse.status, await orderResponse.text());
      return;
    }

    const orderData = await orderResponse.text();
    const order = JSON.parse(orderData).order;
    
    console.log(`✅ Order created: #${order.order_id}`);
    console.log(`📝 Content: ${order.transfer_content}`);
    
    // Step 2: Test webhook immediately
    console.log('\n2️⃣ Testing webhook...');
    const webhookResponse = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transferType: 'in',
        transferAmount: '35000',
        content: order.transfer_content,
        gateway: 'BIDV',
        accountNumber: '96247PAY05',
        transactionId: 'TEST' + Date.now(),
        transferDate: new Date().toISOString()
      })
    });

    const webhookResult = await webhookResponse.text();
    console.log(`Webhook response: ${webhookResponse.status} - ${webhookResult}`);
    
    if (webhookResponse.status === 200 && webhookResult.includes('credits_added')) {
      console.log('\n🎉 SUCCESS! Credits added to your account');
      console.log('💡 Now refresh your web app - you should see the credit!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

createOrderForWebhook();
