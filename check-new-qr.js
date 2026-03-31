// Check new QR URL format
const checkNewQR = async () => {
  const supabaseUrl = 'https://lkhkwqflunjamatsmthg.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraGt3cWZsdW5qYW1hdHNtdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Mzc2MTgsImV4cCI6MjA5MDMxMzYxOH0.0Y1AkZtA2q-74Ks3YoPHpW4IxvcOslc7dxVFTG2aGI8';

  try {
    console.log('=== CHECK NEW QR URL FORMAT ===');
    
    // Create order to get new QR URL
    const response = await fetch(`${supabaseUrl}/functions/v1/orders`, {
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

    const result = await response.text();
    console.log('Order response:', response.status);
    
    if (response.status === 200) {
      const data = JSON.parse(result);
      const payment = data.payment;
      
      console.log('\n📋 New QR Details:');
      console.log('QR URL:', payment.qr_code_url);
      console.log('Amount:', payment.amount_vnd);
      console.log('Content:', payment.transfer_content);
      
      // Show the QR URL format
      console.log('\n🔗 QR Format:');
      console.log(`https://qr.sepay.vn/img?acc=96247PAY05&bank=BIDV&amount=${payment.amount_vnd}&des=${payment.transfer_content}`);
      
      console.log('\n✅ This QR should work better with Sepay!');
      console.log('💡 Try creating order in web app to see the new QR code');
    }
    
  } catch (error) {
    console.error('Error checking QR:', error);
  }
};

checkNewQR();
