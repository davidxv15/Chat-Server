// contentfulService.js
import { createClient } from 'contentful';

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID, // Add this in your .env file
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN, // Add this in your .env file
});

export const fetchBulletinContent = async () => {
  try {
    const response = await client.getEntries({
      content_type: 'bulletin', // Change this based on your content type in Contentful
    });
    return response.items;
  } catch (error) {
    console.error('Error fetching bulletin content:', error);
  }
};
