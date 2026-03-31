// Test webhook with real order content
const testRealWebhook = async () => {
  try {
    console.log('Testing webhook with REAL order content...');
    
    const response = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sepay-Webhook/1.0'
      },
      body: JSON.stringify({
        transferType: 'in',
        transferAmount: '35000',
        content: 'AUTOFILL-U1-MNDDS2BE',
        gateway: 'BIDV',
        accountNumber: '96247PAY05',
        transactionId: 'TXN' + Date.now(),
        transferDate: new Date().toISOString()
      })
    });

    const result = await response.text();
    console.log('Webhook response:', response.status, result);
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

testRealWebhook();
