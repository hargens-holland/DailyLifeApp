const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Set up a connection pool
const pool = mysql.createPool({
  host: 'db', // this is the name of your MySQL service in docker-compose
  user: 'root',
  password: 'password',
  database: 'mydatabase',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
app.get('/', (req, res) => {
  pool.query('SELECT NOW() AS now', (error, results) => {
    if (error) {
      res.send(`Database connection failed: ${error.message}`);
    } else {
      res.send(`Database connection successful! Current time: ${results[0].now}`);
    }
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

