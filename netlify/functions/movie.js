const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { id } = event.queryStringParameters || {};
  const key    = process.env.TMDB_KEY;

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };
  }

  try {
    const res  = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${key}&append_to_response=credits,videos,similar,recommendations`
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