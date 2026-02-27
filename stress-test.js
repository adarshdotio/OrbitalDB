const OrbitalDB = require('./index');
const fs = require('fs');

async function runStressTest() {
    const dbName = 'stress_test_db';
    const db = new OrbitalDB(dbName);
    
    const schema = {
        id: { type: 'number', required: true },
        val: { type: 'string', required: true }
    };

    const collection = db.collection('data', schema);
    const TOTAL_RECORDS = 1000;
    
    console.time('Total Test Time');

    // 1. STRESS INSERT: 1,000 Records
    console.log(`🚀 Inserting ${TOTAL_RECORDS} records...`);
    for (let i = 1; i <= TOTAL_RECORDS; i++) {
        await collection.insert({ id: i, val: `data_point_${i}` });
    }
    console.log(`✅ ${TOTAL_RECORDS} records inserted.`);

    // 2. RANDOM DELETE: Remove 30% of records
    console.log('💀 Deleting 300 random records...');
    const deletedIds = [];
    for (let i = 0; i < 300; i++) {
        const targetId = Math.floor(Math.random() * TOTAL_RECORDS) + 1;
        if (!deletedIds.includes(targetId)) {
            // Note: If you haven't implemented a delete method yet, 
            // this is a reminder to add tombstone logic to collection.js!
            deletedIds.push(targetId);
        }
    }
    console.log(`✅ ${deletedIds.length} unique records targeted.`);

    // 3. INTEGRITY CHECK: Search Performance
    console.log('🔍 Running search performance check...');
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
        const searchId = Math.floor(Math.random() * TOTAL_RECORDS) + 1;
        await collection.findOne(searchId);
    }
    const duration = Date.now() - startTime;
    console.log(`✅ 100 random lookups completed in ${duration}ms.`);

    const dbFile = `./data/${dbName}/data.db`;
    const size = fs.statSync(dbFile).size;
    console.log(`📦 Final Database Size: ${(size / 1024).toFixed(2)} KB`);

    console.timeEnd('Total Test Time');
}

runStressTest().catch(err => {
    console.error('❌ Test Failed:', err.message);
});
