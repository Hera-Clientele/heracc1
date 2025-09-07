// Test script to verify client access functionality
// This script tests the API endpoints to ensure client isolation

const BASE_URL = 'http://localhost:3000';

async function testClientAccess() {
  console.log('🧪 Testing Client Access System...\n');

  // Test 1: Verify that client-specific API calls work
  console.log('1. Testing client-specific API endpoints...');
  
  try {
    // Test TikTok data for client 1
    const tiktokResponse = await fetch(`${BASE_URL}/api/daily-agg?clientId=1`);
    const tiktokData = await tiktokResponse.json();
    console.log('✅ TikTok API for client 1:', tiktokData.data ? `${tiktokData.data.length} records` : 'No data');

    // Test Instagram data for client 1
    const instagramResponse = await fetch(`${BASE_URL}/api/instagram/daily-agg?clientId=1`);
    const instagramData = await instagramResponse.json();
    console.log('✅ Instagram API for client 1:', instagramData.data ? `${instagramData.data.length} records` : 'No data');

    // Test accounts for client 1
    const accountsResponse = await fetch(`${BASE_URL}/api/accounts?platform=tiktok&clientId=1`);
    const accountsData = await accountsResponse.json();
    console.log('✅ Accounts API for client 1:', accountsData.accounts ? `${accountsData.accounts.length} accounts` : 'No accounts');

  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }

  // Test 2: Verify client isolation
  console.log('\n2. Testing client isolation...');
  
  try {
    // Test with different client IDs
    const client1Response = await fetch(`${BASE_URL}/api/accounts?platform=tiktok&clientId=1`);
    const client1Data = await client1Response.json();
    
    const client2Response = await fetch(`${BASE_URL}/api/accounts?platform=tiktok&clientId=2`);
    const client2Data = await client2Response.json();
    
    console.log('✅ Client 1 accounts:', client1Data.accounts ? client1Data.accounts.length : 0);
    console.log('✅ Client 2 accounts:', client2Data.accounts ? client2Data.accounts.length : 0);
    
    // Verify they have different data (if both have data)
    if (client1Data.accounts && client2Data.accounts && 
        client1Data.accounts.length > 0 && client2Data.accounts.length > 0) {
      const client1Ids = client1Data.accounts.map(acc => acc.account_id);
      const client2Ids = client2Data.accounts.map(acc => acc.account_id);
      const hasOverlap = client1Ids.some(id => client2Ids.includes(id));
      
      if (!hasOverlap) {
        console.log('✅ Client isolation verified - no account overlap');
      } else {
        console.log('⚠️  Warning: Some accounts appear in multiple clients');
      }
    }

  } catch (error) {
    console.log('❌ Client isolation test failed:', error.message);
  }

  // Test 3: Verify authentication endpoint
  console.log('\n3. Testing authentication endpoint...');
  
  try {
    const authResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: '1', password: 'test' }), // This will fail but tests the endpoint
    });
    
    const authData = await authResponse.json();
    console.log('✅ Auth endpoint accessible:', authResponse.status === 401 ? 'Returns expected 401 for invalid credentials' : 'Unexpected response');
    
  } catch (error) {
    console.log('❌ Auth endpoint test failed:', error.message);
  }

  console.log('\n🎉 Client access system test completed!');
  console.log('\n📋 Manual Testing Checklist:');
  console.log('1. Visit /login and try logging in as client 1 (Katie)');
  console.log('2. Verify you get redirected to /client/1');
  console.log('3. Confirm no client selector is visible');
  console.log('4. Verify only Katie\'s data is shown');
  console.log('5. Try accessing /client/2 directly - should require authentication');
  console.log('6. Visit / and try admin login - should show client selector');
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testClientAccess().catch(console.error);
}

module.exports = { testClientAccess };

