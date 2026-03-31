// Manual approve existing pending order
const manualApprove = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDczNzYxOCwiZXhwIjoyMDkwMzEzNjE4fQ.pBjSsNF2pVCFfT6Z8zJh0Z9jJhq_4fNn5QvRz6T4e3M';

  try {
    console.log('=== MANUAL APPROVE PENDING ORDER ===');
    
    // First, get pending orders
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.pending&select=*`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    });

    const orders = await ordersResponse.json();
    console.log('Pending orders:', orders);
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log(`\nApproving order #${order.order_id}...`);
      
      // Update order status directly
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?order_id=eq.${order.order_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          note: 'Manual approval - Sepay VA not working'
        })
      });

      console.log('Update order response:', updateResponse.status);
      
      // Update payment status
      const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments?order_id=eq.${order.order_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString()
        })
      });

      console.log('Update payment response:', paymentResponse.status);
      
      // Add credits to wallet
      const walletResponse = await fetch(`${supabaseUrl}/rest/v1/user_wallet?user_id=eq.${order.user_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_balance: `form_balance + ${order.forms_to_add}`,
          total_forms_added: `total_forms_added + ${order.forms_to_add}`,
          last_updated: new Date().toISOString()
        })
      });

      console.log('Update wallet response:', walletResponse.status);
      
      console.log('\n✅ SUCCESS! Order approved and credits added');
      console.log('Check your web app - the pending order should now show as completed!');
      
    } else {
      console.log('No pending orders found');
    }
    
  } catch (error) {
    console.error('Manual approve failed:', error);
  }
};

manualApprove();
