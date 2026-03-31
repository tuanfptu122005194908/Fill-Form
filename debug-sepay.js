// Debug Sepay webhook - check logs
const debugWebhook = async () => {
  console.log('=== DEBUG SEPAY WEBHOOK ===');
  
  // Test 1: Check if webhook endpoint is accessible
  try {
    const pingResponse = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
      method: 'OPTIONS',
    });
    console.log('Webhook ping status:', pingResponse.status);
  } catch (error) {
    console.error('Webhook not accessible:', error);
  }

  // Test 2: Test with different content formats
  const testCases = [
    'AUTOFILL-U1-MNDBX0HU',
    'AUTOFILL U1 MNDBX0HU', 
    'AUTOFILLU1MNDBX0HU',
    'AUTOFILL - U1 - MNDBX0HU'
  ];

  for (const content of testCases) {
    console.log(`\nTesting content: ${content}`);
    
    const response = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sepay-Webhook/1.0'
      },
      body: JSON.stringify({
        transferType: 'in',
        transferAmount: '35000',
        content: content,
        gateway: 'BIDV',
        accountNumber: '96247PAY05',
        transactionId: 'TEST' + Date.now(),
        transferDate: new Date().toISOString()
      })
    });

    const result = await response.text();
    console.log(`Status: ${response.status}, Result: ${result}`);
  }
};

debugWebhook();
