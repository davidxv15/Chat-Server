const { createClient } = require('contentful');

// creates content client instance
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID, // .env file
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN, // .env file
});

// Test connection
client.getSpace()
  .then((space) => console.log('Connected to space:', space.name))
  .catch((err) => console.error('Error connecting to space:', err));


// fetches contentful entries
const getEntries = async (contentType) => {
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
  
  console.log('Space ID:', process.env.CONTENTFUL_SPACE_ID);
console.log('Access Token:', process.env.CONTENTFUL_ACCESS_TOKEN);

module.exports = {
    getEntries
};