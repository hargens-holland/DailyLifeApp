const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// MySQL connection pool
const pool = mysql.createPool({
  host: 'db', // from docker-compose.yml
  user: 'root',
  password: 'password',
  database: 'mydatabase',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Serve static files from the "public" folder
app.use(express.static('public'));

// Database connection test route (Optional - You can keep or remove)
app.get('/dbtest', (req, res) => {
  pool.query('SELECT NOW() AS now', (error, results) => {
    if (error) {
      res.send(`Database connection failed: ${error.message}`);
    } else {
      res.send(`Database connection successful! Current time: ${results[0].now}`);
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});

