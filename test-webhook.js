// Test webhook manually
const testWebhook = async () => {
  const webhookUrl = 'https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook';
  
  // Test data - simulate Sepay webhook
  const testData = {
    transferType: 'in',
    transferAmount: '35000',
    content: 'AUTOFILL-U1-MNDBX0HU',
    gateway: 'BIDV',
    accountNumber: '8816861222',
    transactionId: 'TXN123456',
    transferDate: '2026-03-30T10:53:00Z'
  };

  try {
    console.log('Testing webhook with data:', testData);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

testWebhook();
