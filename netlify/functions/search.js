const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { query, page = 1 } = event.queryStringParameters || {};
  const key = process.env.TMDB_KEY;

  if (!query) {
    return { statusCode: 400, body: JSON.stringify({ error: 'query required' }) };
  }

  try {
    const res  = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&page=${page}`
    );
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