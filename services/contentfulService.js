import { createClient } from 'contentful';

// creates content client instance
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID, // .env file
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN, // .env file
});

// fetches contentful entries
export const getEntries = async (contentType) => {
    try {
      const response = await client.getEntries({
        content_type: contentType, // 'bulletin' or any content type
      });
      return response.items;
    } catch (error) {
      console.error('Error fetching entries from Contentful:', error);
      throw error;
    }
  };
  
