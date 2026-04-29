function extractOpenAiText(data) {
  if (data?.output_text) return data.output_text

  const output = Array.isArray(data?.output) ? data.output : []
  return output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || '')
    .join('')
}

export async function getOpenAiRecommendations({ movies, tasteProfile, getMovieGenres }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || movies.length === 0) return []

  const movieCatalog = movies.map((movie) => ({
    id: movie._id,
    title: movie.title,
    genres: getMovieGenres(movie),
    status: movie.status,
    rating: movie.rating,
    description: movie.description,
  }))

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RECOMMENDATION_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'Recommend movies only from the provided catalog. Return strict JSON with recommendations as an array of objects containing movieId and reason.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            preferredGenres: Array.from(tasteProfile.preferredGenres || []),
            watchedMovieIds: Array.from(tasteProfile.watchedMovieIds || []),
            movieCatalog,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI recommendation request failed with ${response.status}`)
  }

  const data = await response.json()
  const parsed = JSON.parse(extractOpenAiText(data) || '{}')
  return Array.isArray(parsed.recommendations) ? parsed.recommendations : []
}
