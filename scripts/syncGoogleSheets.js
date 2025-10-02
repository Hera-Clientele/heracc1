const { google } = require('googleapis');
const fetch = require('node-fetch');

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual spreadsheet ID
const API_BASE_URL = 'http://localhost:3000/api'; // Update for production

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/your/service-account-key.json', // Replace with your service account key path
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Account mapping from your Google Sheets
const ACCOUNT_MAPPING = {
  'katiele.fit IG': { client_id: 1, platform: 'instagram' },
  'katiele.fit FB': { client_id: 1, platform: 'facebook' },
  'gymkatie IG': { client_id: 1, platform: 'instagram' },
  'gymkatie FB': { client_id: 1, platform: 'facebook' },
  'liftwithkatiee IG': { client_id: 1, platform: 'instagram' },
  'liftwithkatiee FB': { client_id: 1, platform: 'facebook' },
  'lovelykatiele IG': { client_id: 1, platform: 'instagram' },
  'lovelykatiele FB': { client_id: 1, platform: 'facebook' },
  'katiele.girl IG': { client_id: 1, platform: 'instagram' },
  'katiele.girl FB': { client_id: 1, platform: 'facebook' },
  'cutiekatiele IG': { client_id: 1, platform: 'instagram' },
  'cutiekatiele FB': { client_id: 1, platform: 'facebook' },
  'bonitakatex3 IG': { client_id: 1, platform: 'instagram' },
  'bonitakatex3 FB': { client_id: 1, platform: 'facebook' },
  'katielevida IG': { client_id: 1, platform: 'instagram' },
  'katielevida FB': { client_id: 1, platform: 'facebook' },
  'FunwithKatie IG': { client_id: 1, platform: 'instagram' },
};

async function getSheetData(sheetName) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:D`, // Date, Views, Reach, Instagram Profile Visit
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log(`No data found in sheet: ${sheetName}`);
      return [];
    }

    // Skip header row and process data
    const dataRows = rows.slice(1);
    const processedData = [];

    for (const row of dataRows) {
      if (row.length >= 4) {
        const [dateStr, viewsStr, reachStr, profileVisitsStr] = row;
        
        // Parse date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date format: ${dateStr} in sheet ${sheetName}`);
          continue;
        }

        // Parse numeric values
        const views = parseInt(viewsStr) || 0;
        const reach = parseInt(reachStr) || 0;
        const profileVisits = parseInt(profileVisitsStr) || 0;

        processedData.push({
          Date: date.toISOString(),
          Views: views,
          Reach: reach,
          'Instagram Profile Visit': profileVisits,
          AccountName: sheetName
        });
      }
    }

    return processedData;
  } catch (error) {
    console.error(`Error fetching data from sheet ${sheetName}:`, error);
    return [];
  }
}

async function syncSheetToDatabase(sheetName) {
  try {
    console.log(`Syncing sheet: ${sheetName}`);
    
    const mapping = ACCOUNT_MAPPING[sheetName];
    if (!mapping) {
      console.warn(`No mapping found for sheet: ${sheetName}`);
      return;
    }

    const sheetData = await getSheetData(sheetName);
    if (sheetData.length === 0) {
      console.log(`No data to sync for sheet: ${sheetName}`);
      return;
    }

    // Call the API to sync the data
    const response = await fetch(`${API_BASE_URL}/google-sheets/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sheetData }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully synced ${sheetData.length} rows from ${sheetName}:`, result.message);
    } else {
      const error = await response.text();
      console.error(`❌ Failed to sync ${sheetName}:`, error);
    }
  } catch (error) {
    console.error(`❌ Error syncing sheet ${sheetName}:`, error);
  }
}

async function syncAllSheets() {
  try {
    console.log('🚀 Starting Google Sheets sync...');
    
    // Get list of all sheets
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);
    console.log('Found sheets:', sheetNames);

    // Sync each sheet that has a mapping
    for (const sheetName of sheetNames) {
      if (ACCOUNT_MAPPING[sheetName]) {
        await syncSheetToDatabase(sheetName);
        // Add a small delay between sheets to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`Skipping sheet ${sheetName} (no mapping found)`);
      }
    }

    console.log('✅ Google Sheets sync completed!');
  } catch (error) {
    console.error('❌ Error during Google Sheets sync:', error);
  }
}

// Manual sync function
async function manualSync() {
  try {
    await syncAllSheets();
  } catch (error) {
    console.error('Manual sync failed:', error);
    process.exit(1);
  }
}

// Schedule sync (run every 6 hours)
function scheduleSync() {
  console.log('🕐 Scheduling Google Sheets sync every 6 hours...');
  
  // Run initial sync
  syncAllSheets();
  
  // Schedule recurring sync
  setInterval(syncAllSheets, 6 * 60 * 60 * 1000); // 6 hours
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--schedule')) {
    scheduleSync();
  } else {
    manualSync();
  }
}

module.exports = {
  syncAllSheets,
  syncSheetToDatabase,
  getSheetData,
  scheduleSync
};









