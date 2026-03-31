// Script to clear cache - copy and paste into browser console
console.log('=== CLEAR CACHE SCRIPT ===');
console.log('Run this script in browser console (F12):');

const clearScript = `
// Clear localStorage
localStorage.removeItem('autofill_user');
console.log('✅ Cleared autofill_user from localStorage');

// Clear session storage  
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

// Reload page
console.log('🔄 Reloading page...');
location.reload();
`;

console.log(clearScript);
console.log('\n📋 Copy the script above, paste into browser console (F12), and press Enter');
