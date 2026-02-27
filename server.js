const http = require('http');
const url = require('url');
const OrbitalDB = require('./index');

const db = new OrbitalDB('orbital_master');
const PORT = 3000;

// Pre-initialize collections
db.collection('users', { id: { type: 'number' }, name: { type: 'string' } });

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  // --- 1. WEB UI DASHBOARD ---
  if (path === '/' && method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    
    // Using standard strings to avoid backtick SyntaxErrors
    let html = '<html><head><title>OrbitalDB UI</title>';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1">';
    html += '<style>body{font-family:sans-serif;background:#121212;color:#eee;padding:20px;}';
    html += '.card{background:#1e1e1e;padding:15px;border-radius:8px;margin-bottom:20px;border:1px solid #333;}';
    html += 'button{background:#00e676;border:none;padding:10px;border-radius:4px;cursor:pointer;font-weight:bold;}';
    html += 'input{background:#2c2c2c;border:1px solid #444;color:white;padding:8px;margin-right:5px;}</style>';
    html += '</head><body>';
    html += '<h1>🚀 OrbitalDB Console</h1>';
    
    html += '<div class="card"><h2>Quick Insert</h2>';
    html += '<input id="coll" placeholder="Collection Name">';
    html += '<input id="json" placeholder=\'{"id":1,"name":"Test"}\'>';
    html += '<button onclick="doInsert()">Insert</button></div>';
    
    html += '<div class="card"><h2>Data Explorer</h2>';
    html += '<input id="qColl" placeholder="Collection Name">';
    html += '<button onclick="doFetch()">View Stats</button>';
    html += '<div id="res" style="margin-top:15px;color:#00e676;"></div></div>';
    
    html += '<script>';
    html += 'async function doInsert(){';
    html += '  const c = document.getElementById("coll").value;';
    html += '  const d = document.getElementById("json").value;';
    html += '  await fetch("/api/insert?coll=" + c, {method:"POST", body:d});';
    html += '  alert("Success");';
    html += '}';
    html += 'async function doFetch(){';
    html += '  const c = document.getElementById("qColl").value;';
    html += '  const r = await fetch("/api/stats?coll=" + c);';
    html += '  const j = await r.json();';
    html += '  document.getElementById("res").innerText = JSON.stringify(j, null, 2);';
    html += '}';
    html += '</script></body></html>';
    
    return res.end(html);
  }
  
  // --- 2. REST API ---
  res.setHeader('Content-Type', 'application/json');
  
  if (path === '/api/insert' && method === 'POST') {
    const collName = parsedUrl.query.coll;
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const collection = db.collection(collName);
        await collection.insert(JSON.parse(body));
        res.end(JSON.stringify({ status: "inserted" }));
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  if (path === '/api/stats' && method === 'GET') {
    const collName = parsedUrl.query.coll;
    try {
      const collection = db.collection(collName);
      const stats = {
        name: collName,
        count: collection.indexer.primary.size,
        ids: Array.from(collection.indexer.primary.keys())
      };
      res.end(JSON.stringify(stats));
    } catch (e) {
      res.end(JSON.stringify({ error: "Collection not found" }));
    }
    return;
  }
  
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log("-----------------------------------------");
  console.log("OrbitalDB Server is running on port " + PORT);
  console.log("Open in browser: http://localhost:" + PORT);
  console.log("-----------------------------------------");
});

const { fork } = require('child_process');

// Spin up the compactor as a background worker thread
fork('./cron-compactor.js');
console.log("🛠️ Background worker 'cron-compactor' attached.");