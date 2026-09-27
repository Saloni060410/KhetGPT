export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return res.status(422).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      })
    }

    req[source] = result.data
    next()
  }
}