import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiRecommendations({ movies, userFavorites, getMovieGenres }) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || movies.length === 0) {
    if (!apiKey) console.error('✗ Gemini API Key not configured in environment');
    if (movies.length === 0) console.warn('⚠ No movies available for recommendation');
    return [];
  }

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // Build movie catalog with just names and genres
  const movieCatalog = movies.map((movie) => ({
    id: String(movie._id || ''),
    title: movie.title || 'Untitled',
    genres: getMovieGenres(movie),
  }));

  // Build user favorites summary
  const favoriteGenres = new Set();
  const favoriteTitles = [];

  if (Array.isArray(userFavorites)) {
    userFavorites.forEach((favorite) => {
      const genres = Array.isArray(favorite.genres) 
        ? favorite.genres 
        : [favorite.genre, favorite.secondaryGenre].filter(Boolean);
      
      genres.forEach((genre) => {
        if (genre) favoriteGenres.add(genre);
      });

      if (favorite.title) {
        favoriteTitles.push(favorite.title);
      }
    });
  }

  // Build the prompt for Gemini
  const prompt = `You are a movie recommendation engine. Based on the user's favorite movies and genres, recommend exactly 4 movies from the provided catalog.

User's Favorite Genres: ${Array.from(favoriteGenres).join(', ') || 'Not specified'}
User's Favorite Movies: ${favoriteTitles.length > 0 ? favoriteTitles.join(', ') : 'None yet'}

Available Movie Catalog:
${movieCatalog.map((m) => `- "${m.title}" (ID: ${m.id}, Genres: ${m.genres.join(', ') || 'Unspecified'})`).join('\n')}

Please recommend exactly 4 movies from the catalog above that match the user's preferences. For each recommendation, provide:
1. The exact movie ID from the catalog
2. The exact movie title
3. A brief reason why it's recommended

Return your response as a valid JSON array with objects containing: movieId, title, and reason.
Example format: [{"movieId": "123", "title": "Movie Title", "reason": "Reason here"}, ...]

Only return valid JSON, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('✓ Gemini API Response received successfully');

    // Parse the JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('✗ Gemini response parsing failed: No valid JSON found in response', {
        responseLength: responseText.length,
        firstChars: responseText.substring(0, 200)
      });
      return [];
    }

    const recommendations = JSON.parse(jsonMatch[0]);
    console.log(`✓ Successfully parsed ${recommendations.length} recommendations from Gemini`);

    // Validate and map recommendations to actual movies
    const movieMap = new Map(movieCatalog.map((m) => [m.id, m]));
    
    const validRecommendations = recommendations
      .filter((rec) => {
        // Verify the recommendation exists in our catalog
        const isValid = movieMap.has(String(rec.movieId || ''));
        if (!isValid) {
          console.warn(`⚠ Gemini recommendation has invalid movieId: ${rec.movieId}`);
        }
        return isValid;
      })
      .slice(0, 4)
      .map((rec) => ({
        movieId: String(rec.movieId || ''),
        title: String(rec.title || ''),
        reason: String(rec.reason || 'Recommended based on your preferences'),
      }));

    console.log(`✓ Returning ${validRecommendations.length} validated recommendations`);
    return validRecommendations;
  } catch (error) {
    console.error('✗ Gemini recommendation error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    return [];
  }
}
