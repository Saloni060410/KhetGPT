import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

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
//
// Security/reliability pass: Zod/Prisma-specific mapping added below. In practice most
// validation failures never reach here -- validate.middleware.js already calls schema.safeParse
// and returns its own 422 with a details payload directly, a deliberate, already-tested design
// (see tests/resources.test.js/risk.test.js's 422 assertions; 422 Unprocessable Entity is the
// more semantically correct code for "well-formed but invalid" bodies, not changed here to
// avoid breaking that existing, documented contract). The ZodError branch below is
// defense-in-depth for any future code path that calls schema.parse() (throwing) directly
// instead of going through validate() -- currently none does, verified by grep, so this branch
// isn't exercised by anything today, but it's cheap and correct to have. The Prisma branches ARE
// live today: auth.controller.js's register() checks for a duplicate email first, but a second,
// concurrent registration with the same email can still race past that check and hit a real
// P2002 on prisma.user.create() -- previously an uncaught 500 with Prisma's own internal error
// text, now a proper, consistent 409.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with that value already exists' })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' })
    }
  }

  const status = err.status ?? 500

  if (status >= 500) {
    console.error(err)
  }

  res.status(status).json({
    error: err.message ?? 'Internal server error',
  })
}