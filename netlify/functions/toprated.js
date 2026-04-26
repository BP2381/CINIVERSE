const fetch = require('node-fetch');

exports.handler = async (event) => {
  const page = event.queryStringParameters?.page || 1;
  const key  = process.env.TMDB_KEY;

  try {
    const res  = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${key}&page=${page}`
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