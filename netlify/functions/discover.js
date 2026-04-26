const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { genre = '', sort = 'popularity.desc', year = '', page = 1 } = event.queryStringParameters || {};
  const key = process.env.TMDB_KEY;

  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&sort_by=${sort}&page=${page}&vote_count.gte=50`;
  if (genre && genre !== 'all') url += `&with_genres=${genre}`;
  if (year) url += `&primary_release_year=${year}`;

  try {
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