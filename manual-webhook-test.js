// Manual webhook test with real transfer content
console.log('=== MANUAL WEBHOOK TEST ===');
console.log('\n📋 Hãy nhập nội dung chuyển khoản bạn vừa dùng:');
console.log('Ví dụ: AUTOFILL-U3-MNDEM426');

// Test with common content patterns
const testContents = [
  'AUTOFILL-U3-MNDEM426',  // Content from your error
  'AUTOFILL-U3-TEST123',
  'AUTOFILL-U3-DEMO456'
];

const testWebhook = async (content) => {
  try {
    console.log(`\n🔍 Testing webhook with content: ${content}`);
    
    const response = await fetch('https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    console.log(`Response: ${response.status} - ${result}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook working! Check your web app now.');
    }
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

// Test all patterns
testContents.forEach(testWebhook);

console.log('\n💡 Nếu không có content nào hoạt động:');
console.log('1. Kiểm tra lại nội dung chuyển khoản chính xác');
console.log('2. Vào my.sepay.vn → Webhooks → xem có logs không');
console.log('3. Kiểm tra webhook URL: https://lkhkwqflunjamatsmthg.supabase.co/functions/v1/sepay-webhook');
