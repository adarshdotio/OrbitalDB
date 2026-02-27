# 🚀 OrbitalDB

OrbitalDB is a lightweight, high-performance **NoSQL Document Database** engine built entirely in Node.js. Designed for resource-constrained environments like mobile devices (via Termux) or edge computing, it implements professional database concepts such as binary storage, indexing, and crash recovery.



## ✨ Key Features

* **Binary Storage:** Custom binary encoding to minimize disk footprint and eliminate expensive overhead on large files.
* **Primary & Secondary Indexing:** Blazing fast lookups using in-memory maps and optimized pointer logic.
* **Schema Validation:** Strict enforcement of data types and required fields to ensure data integrity.
* **WAL (Write-Ahead Logging):** Protects against data corruption by journaling transactions before they hit the main storage.
* **Collections:** Multi-tenant support allowing logical separation of data (e.g., users, products, orders).
* **Document Population:** Native support for "joins," allowing you to resolve references across different collections automatically.
* **Tombstone Management:** High-speed append-only deletions with background compaction support.

---

## 📂 Project Structure

```text
orbitaldb/
├── lib/
│   ├── storage.js      # Raw Binary I/O & Encoding
│   ├── indexer.js      # Primary/Secondary Index Management
│   ├── validator.js    # Data Type Enforcement
│   └── transaction.js  # Write-Ahead Log & Recovery
├── collection.js       # Collection-level Orchestration
├── index.js            # Main Manager API
└── data/               # Persistent database files (.db, .idx, .journal)
```

---

## 🛠️ Usage Guide

### 1. Initialize the Database
```javascript
const OrbitalDB = require('./index');
const db = new OrbitalDB('my_app_production');
```

### 2. Define a Collection & Schema
Define the rules for your data. Fields can be required, typed, or act as references to other collections.
```javascript
const userSchema = {
    id: { type: 'number', required: true },
    username: { type: 'string', required: true },
    email: { type: 'string' },
    age: { type: 'number' }
};

const users = db.collection('users', userSchema);
```

### 3. Create Secondary Indexes
Speed up searches for non-ID fields.
```javascript
users.createIndex('username');
users.createIndex('email');
```

### 4. Operations (Insert & Find)
```javascript
// Inserting a document
await users.insert({
    id: 101,
    username: 'dev_hero',
    email: 'admin@orbital.db',
    age: 30
});

// Fast lookup by ID
const user = await users.findOne(101);

// Fast lookup by Secondary Index
const userByEmail = await users.findOne({ email: 'admin@orbital.db' });
```

### 5. Document Population (Cross-Collection Joins)


```javascript
const orderSchema = {
    id: { type: 'number', required: true },
    total: { type: 'number' },
    userId: { type: 'number', ref: 'users' } // Reference to 'users' collection
};

const orders = db.collection('orders', orderSchema);

// Fetch order and automatically "populate" the user document
const orderWithUser = await orders.findOne(500, { populate: 'userId' });
console.log(orderWithUser.userId.username); // 'dev_hero'
```

---

## 🔧 Technical Deep-Dive

### Binary Layout
Each record is stored with a 5-byte header:
* **Bytes 0-3:** Document Length (Uint32BE)
* **Byte 4:** Status Flag ($0x00$ for Active, $0x01$ for Tombstone/Deleted)
* **Remaining Bytes:** Stringified JSON payload.



### Reliability (ACID Principles)
* **Atomicity:** Guaranteed by the `.journal` file. If a write is interrupted, the system rolls back or completes the write on next boot.
* **Consistency:** The Validator layer prevents malformed data from reaching the storage engine.
* **Durability:** Data is flushed to disk using Node.js `fs.writeSync` to ensure the OS buffers are cleared.



---

## 📈 Performance Benchmarks

| Operation | Complexity | Efficiency |
| :--- | :--- | :--- |
| **ID Lookup** | $O(1)$ | Instant (In-memory map) |
| **Indexed Search** | $O(1) - O(\log n)$ | Very Fast |
| **Unindexed Search** | $O(n)$ | Slow (Full Collection Scan) |
| **Insertion** | $O(1)$ | High (Append-only) |

---

## 📜 License
MIT © 2026 OrbitalDB Team
