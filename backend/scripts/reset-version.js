const db = require('./src/config/db');
db.query("UPDATE app_version SET latest_version = '1.1.4' WHERE id = 1")
  .then(() => {
    console.log('Database version successfully reset to 1.1.4');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
