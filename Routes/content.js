const express = require('express');
const { getEntries } = require('../services/contentfulService');

const router = express.Router();

//get bulletin messages
router.get('/bulletins', async (req, res) => {
  console.log("Bulletin route hit");
  try {
    const entries = await getEntries('bulletin'); // 'bulletin' as the content type
    console.log("Bulletins fetched successfully", entries);
    res.json(entries);
  } catch (error) {
    console.error("Failed to fetch bulletins:", error);
    res.status(500).json({ message: 'Failed to fetch bulletins' });
  }
});

module.exports = router;