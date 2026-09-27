import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'

const execFileAsync = promisify(execFile)

/**
 * Runs `script` (a string of an async arrow function body, given the imported module as its
 * argument) in a genuinely fresh Node process with `env` set from the start, and returns
 * whatever it JSON.stringify's to stdout.
 *
 * Needed because `src/config/env.js` parses `process.env` exactly once, the moment anything
 * first imports it, into a frozen `env` object -- and several services (`weatherService.js`,
 * `geocodeService.js`, `referenceService.js`) build an axios client from that frozen value at
 * their own module-load time too. Mutating `process.env` mid-test-process and re-importing the
 * service with a cache-busting `?query=` string does NOT work: the cache-busted module still
 * resolves the *same*, already-cached `env.js` (and, for the weather/geocode services, the
 * same already-built axios client). A real subprocess is the only way to genuinely test "what
 * happens when this env var is set," matching how these vars are actually set in every real
 * deployment (before the process starts, never mutated at runtime).
 *
 * Must be the *async* `execFile`, not `execFileSync`: a test that also runs its own mock HTTP
 * server in this same process (as every caller here does) needs this process's event loop free
 * to accept that server's incoming connection while the child is running. `execFileSync` blocks
 * the whole thread until the child exits -- the child's request would never be serviced, and
 * the child would hang until its own request timeout, always reporting the service unavailable
 * no matter what env pointed it at. Verified directly: switching this one call from sync to
 * async was the entire fix.
 */
export async function runInFreshProcess({ env = {}, servicePath, script }) {
  const moduleUrl = pathToFileURL(servicePath).href
  const wrapped = `
    import('${moduleUrl}').then(async (mod) => {
      try {
        const result = await (${script})(mod)
        process.stdout.write(JSON.stringify({ ok: true, result }))
      } catch (err) {
        process.stdout.write(JSON.stringify({ ok: false, name: err.constructor.name, message: err.message }))
      }
    })
  `
  const { stdout } = await execFileAsync(process.execPath, ['-e', wrapped], {
    env: { ...process.env, ...env },
  })
  return JSON.parse(stdout)
}
