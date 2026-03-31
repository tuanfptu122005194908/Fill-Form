// Create test order
const createTestOrder = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDczNzYxOCwiZXhwIjoyMDkwMzEzNjE4fQ.pBjSsNF2pVCFfT6Z8zJh0Z9jJhq_4fNn5QvRz6T4e3M';

  try {
    // Create test order
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 1,
        amount_vnd: 35000,
        forms_to_add: 100,
        transfer_content: 'AUTOFILL-U1-MNDBX0HU',
        status: 'pending'
      })
    });

    const order = await orderResponse.json();
    console.log('Created order:', order);

    // Create payment record
    const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: order.order_id,
        bank_name: 'MB Bank',
        bank_account_no: '0354860785',
        bank_account_name: 'CAO MINH TUAN',
        amount_vnd: 35000,
        transfer_content: 'AUTOFILL-U1-MNDBX0HU',
        method: 'manual',
        status: 'pending'
      })
    });

    const payment = await paymentResponse.json();
    console.log('Created payment:', payment);
    
  } catch (error) {
    console.error('Error creating test order:', error);
  }
};

createTestOrder();
