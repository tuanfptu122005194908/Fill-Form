// Test direct Sepay QR URL
console.log('=== TESTING DIRECT SEPAY QR ===');

const testQR = {
  amount: 35000,
  content: 'AUTOFILL-U3-TEST123',
  sepayURL: `https://qr.sepay.vn/img?acc=96247PAY05&bank=BIDV&amount=35000&des=AUTOFILL-U3-TEST123`
};

console.log('📋 Test QR Details:');
console.log('Amount:', testQR.amount);
console.log('Content:', testQR.content);
console.log('Sepay URL:', testQR.sepayURL);

console.log('\n🔗 HTML Code to embed:');
console.log(`<img src='${testQR.sepayURL}' alt='Sepay QR' style='width:200px;height:200px;'>`);

console.log('\n💡 This QR should trigger Sepay webhook when scanned!');
console.log('📱 Try scanning this QR with your banking app');
