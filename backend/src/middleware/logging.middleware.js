// Security/reliability pass: a request id (so a support conversation or a log line can be
// traced back to one specific request) plus structured JSON access logging, replacing morgan's
// plain-text access log. Deliberately narrow, same principle as ml/src/api/logging_utils.py:
// request_id, method, path, status, latency_ms, user_id (a safe identifier, not a secret) --
// never the Authorization header, never the request body (which can carry a password on
// /auth/register|login, or soil-test/fertilizer-log data that isn't this log's business),
// never query params (a future endpoint could put something sensitive there).
import { randomUUID } from 'node:crypto'

export function requestId(req, res, next) {
  req.id = randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
}

export function structuredLogging(req, res, next) {
  const startedAt = process.hrtime.bigint()
  // Snapshotted now, not read lazily inside 'finish' below: Express mounts nested routers by
  // temporarily stripping the matched prefix from req.url, then restoring it once that layer's
  // dispatch unwinds -- normally already restored by the time 'finish' fires, but not
  // guaranteedly so under concurrent load (verified directly: two near-simultaneous requests to
  // the identical route logged two different paths, "/register" and "/api/auth/register", one
  // of them caught mid-restoration). method/path are stable from the moment this middleware
  // first runs, before any router has touched req.url yet.
  const { method, path } = req

  res.on('finish', () => {
    const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1e6
    console.log(
      JSON.stringify({
        event: 'request',
        request_id: req.id,
        method,
        path,
        status: res.statusCode,
        latency_ms: Math.round(latencyMs * 10) / 10,
        user_id: req.user?.id ?? null,
      })
    )
  })

  next()
}
