const OrbitalDB = require('./index');
const fs = require('fs');

const db = new OrbitalDB('orbital_master');
const CLEANUP_INTERVAL = 1000 * 60 * 60; // Run every 1 hour
const SIZE_THRESHOLD_KB = 500; // Only compact if file exceeds 500KB

async function runAutoCompaction() {
    console.log('🔍 Checking database health for compaction...');
    
    // In a real modular project, you would iterate through all collections
    const users = db.collection('users');
    const dbFile = users.storage.path;

    if (fs.existsSync(dbFile)) {
        const stats = fs.statSync(dbFile);
        const fileSizeKB = stats.size / 1024;

        if (fileSizeKB > SIZE_THRESHOLD_KB) {
            console.log('🧹 Database size (' + fileSizeKB.toFixed(2) + 'KB) exceeds threshold. Starting compaction...');
            
            const start = Date.now();
            await users.compact();
            
            const newSizeKB = fs.statSync(dbFile).size / 1024;
            const saved = fileSizeKB - newSizeKB;
            
            console.log('✅ Compaction finished in ' + (Date.now() - start) + 'ms.');
            console.log('📉 Space saved: ' + saved.toFixed(2) + 'KB');
        } else {
            console.log('✨ Database is healthy. No compaction needed.');
        }
    }
}

// Start the loop
console.log('🤖 Auto-Compactor service started (Interval: 1 hour)');
setInterval(runAutoCompaction, CLEANUP_INTERVAL);

// Run once immediately on startup
runAutoCompaction();
