const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'long_lat',
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the database');
  }
});

app.use(bodyParser.json());

// Define a route to add a user
app.post('/api/user_details', (req, res) => {
  const { username, latitude, longitude } = req.body;

  const sql = 'INSERT INTO user_details (username, latitude, longitude) VALUES (?, ?, ?)';
  const values = [username, latitude, longitude];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error adding user:', err);
      res.status(500).json({ error: 'Error adding user.' });
    } else {
      res.status(201).json({ message: 'User added successfully' });
    }
  });
});

// Define a route to find the nearest users
app.get('/api/nearest-users', (req, res) => {
  const { latitude, longitude, maxDistance } = req.query;

  const sql = `
    SELECT username, latitude, longitude,
      (3959 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) AS distance
    FROM user_details
    HAVING distance <= ?
    ORDER BY distance
  `;
  //We have used Haversine Formula to calculate the distances given in latitude and longitude. 
  // If we want the distance in kilometes(km) replace 3959 with 6371 in the query.
  const values = [latitude, longitude, latitude, maxDistance];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error finding nearest users:', err);
      res.status(500).json({ error: 'Error finding nearest users.' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
