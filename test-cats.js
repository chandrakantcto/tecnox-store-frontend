const query = `
  query {
    collections {
      items {
        id
        name
      }
    }
  }
`;

fetch('https://gastro-backend.cap.aibestwriter.com/shop-api', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'vendure-token': 'M8qW3nX6rT1yC9kL5vB2pD7sF4hJ0uN8gR6xQ1mZ3t'
  },
  body: JSON.stringify({ query })
}).then(r => r.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
