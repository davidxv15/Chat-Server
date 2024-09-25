const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../middleware/User');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received data:', { username, password }); 

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await User.create({ username, password });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);  // Debugging

    // Check if the error is due to a duplicate username, maybe strike for 'catch all' msg
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    res.status(400).json({ message: 'User registration failed', error });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Login failed', error });
  }
});

module.exports = router;
