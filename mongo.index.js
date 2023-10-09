const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Long-Lat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a User Schema
const userSchema = new mongoose.Schema({
  username: String,
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [Number],
  },
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

// Define a route to add a user
app.post('/api/user_details', async (req, res) => {
  const { username, latitude, longitude } = req.body;
  const location = {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
  };

  const user = new User({
    username,
    location,
  });

  try {
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error adding user.' });
  }
});

// Define a route to find the nearest users
app.get('/api/nearest-users', async (req, res) => {
  const { latitude, longitude, maxDistance } = req.query;
  const coordinates = [parseFloat(longitude), parseFloat(latitude)];

  try {
    const nearestUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates,
          },
          $maxDistance: parseFloat(maxDistance),
        },
      },
    });

    res.status(200).json(nearestUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error finding nearest users.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
