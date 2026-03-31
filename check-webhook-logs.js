// Check if webhook was called
const checkWebhookLogs = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== CHECK WEBHOOK STATUS ===');
    
    // Check recent orders
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?user_id=eq.3&order=created_at.desc&limit=5&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const orders = await ordersResponse.json();
    console.log('\n📋 Your recent orders:');
    orders.forEach(order => {
      console.log(`Order #${order.order_id}: ${order.status} - ${order.transfer_content}`);
    });
    
    // Check payments
    const paymentsResponse = await fetch(`${supabaseUrl}/rest/v1/payments?order_id=in.(${orders.map(o => o.order_id).join(',')})&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const payments = await paymentsResponse.json();
    console.log('\n💳 Payment statuses:');
    payments.forEach(payment => {
      console.log(`Order #${payment.order_id}: ${payment.status} - ${payment.paid_at || 'not paid'}`);
    });
    
    // Check wallet
    const walletResponse = await fetch(`${supabaseUrl}/rest/v1/user_wallet?user_id=eq.3&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });

    const wallet = await walletResponse.json();
    console.log('\n💰 Your wallet:');
    if (wallet.length > 0) {
      console.log(`Balance: ${wallet[0].form_balance} credits`);
    }
    
  } catch (error) {
    console.error('Error checking webhook logs:', error);
  }
};

checkWebhookLogs();
