const pool = require('./src/config/db'); async function fix() { await pool.query('UPDATE app_version SET latest_version = ? WHERE id = 1', ['1.0.2']); console.log('Fixed'); process.exit(0); } fix();
