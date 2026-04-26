const fetch = require('node-fetch');

// Anime uses Jikan (no key needed) but we proxy it anyway for consistency
exports.handler = async (event) => {
  const { page = 1, query = '' } = event.queryStringParameters || {};

  try {
    let url;
    if (query) {
      url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=${page}&limit=12`;
    } else {
      url = `https://api.jikan.moe/v4/top/anime?page=${page}&limit=20`;
    }
    const res  = await fetch(url);
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};