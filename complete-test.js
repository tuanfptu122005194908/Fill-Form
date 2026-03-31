// Complete test: create order + test webhook
const completeTest = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== COMPLETE TEST: CREATE ORDER + TEST WEBHOOK ===');
    
    // Step 1: Create new order
    console.log('\n1️⃣ Creating new order...');
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

    const orderResult = await orderResponse.text();
    console.log('Order response:', orderResponse.status);
    
    if (orderResponse.status === 200) {
      const orderData = JSON.parse(orderResult);
      const order = orderData.order;
      console.log(`✅ Order created: #${order.order_id}`);
      console.log(`📝 Content: ${order.transfer_content}`);
      console.log(`💰 Amount: ${order.amount_vnd}đ`);
      console.log(`🎯 Credits: ${order.forms_to_add}`);
      
      // Step 2: Test webhook immediately
      console.log('\n2️⃣ Testing webhook...');
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
          transactionId: 'TEST' + Date.now(),
          transferDate: new Date().toISOString()
        })
      });

      const webhookResult = await webhookResponse.text();
      console.log('Webhook response:', webhookResponse.status, webhookResult);
      
      if (webhookResponse.status === 200) {
        console.log('\n🎉 SUCCESS! Everything works!');
        console.log('💡 Now refresh your web app - you should see the credit added!');
        console.log('\n📋 For real payment:');
        console.log(`   VA: 96247PAY05`);
        console.log(`   Amount: ${order.amount_vnd}đ`);
        console.log(`   Content: ${order.transfer_content}`);
      }
    }
    
  } catch (error) {
    console.error('Complete test failed:', error);
  }
};

completeTest();
