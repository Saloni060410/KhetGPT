export function notFound(req, res) {
  res.status(404).json({
    error: 'Not found',
  })
}

// `next` is unused, but Express detects an error-handling middleware by function *arity*
// (exactly 4 declared params: err, req, res, next). Drop to 3 and Express silently treats
// this as ordinary middleware, never routes errors to it, and every error -- not just an ML
// failure -- falls through to Express's own default HTML stack-trace handler instead.
// Verified live: a real ML-service-down request returned 502 with an HTML body before this
// fix, JSON after.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500

  if (status >= 500) {
    console.error(err)
  }

  res.status(status).json({
    error: err.message ?? 'Internal server error',
  })
}