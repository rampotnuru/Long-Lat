const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'database-2.chaxnebpbrbw.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Admin#123',
  database: 'coordinates',
});

// Attempt to connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the database');
  }
});

exports.handler = async (event) => {
  const { httpMethod, path, body } = event;

  if (httpMethod === 'POST' && path === '/api/user_details') {
    const { username, latitude, longitude } = JSON.parse(body);
    const sql = 'INSERT INTO user_details (username, latitude, longitude) VALUES (?, ?, ?)';
    const values = [username, latitude, longitude];

    try {
      await query(sql, values);
      return respond(201, { message: 'User added successfully' });
    } catch (error) {
      console.error('Error adding user:', error);
      return respond(500, { error: 'Error adding user.' });
    }
  } else if (httpMethod === 'GET' && path === '/api/nearest-users') {
    const { latitude, longitude, maxDistance } = event.queryStringParameters;
    const sql = `
      SELECT username, latitude, longitude,
        (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) AS distance
      FROM user_details
      HAVING distance <= ?
      ORDER BY distance
    `;
    const values = [latitude, longitude, latitude, maxDistance];

    try {
      const results = await query(sql, values);
      return respond(200, results);
    } catch (error) {
      console.error('Error finding nearest users:', error);
      return respond(500, { error: 'Error finding nearest users.' });
    }
  } else if (httpMethod === 'POST' && path === '/api/update-user-coordinates') {
    const { username, latitude, longitude } = JSON.parse(body);
    const sql = 'UPDATE user_details SET latitude = ?, longitude = ? WHERE username = ?';
    const values = [latitude, longitude, username];

    try {
      const result = await query(sql, values);
      if (result.affectedRows === 0) {
        return respond(404, { error: 'User not found.' });
      }
      return respond(200, { message: 'User coordinates updated successfully' });
    } catch (error) {
      console.error('Error updating user coordinates:', error);
      return respond(500, { error: 'Error updating user coordinates.' });
    }
  } else {
    return respond(404, { error: 'Not Found' });
  }
};

function query(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function respond(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      // CORS headers to allow requests from any origin
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
  };
}
