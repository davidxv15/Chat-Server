import express from 'express';
import { getEntries } from '../services/contentfulService.js';

const router = express.Router();

//get bulletin messages
router.get('/bulletins', async (req, res) => {
  try {
    const entries = await getEntries('bulletin'); // 'bulletin' as the content type
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bulletins' });
  }
});

export default router;
