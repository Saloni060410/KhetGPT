import app from './app.js'
import { env } from './config/env.js'

app.listen(env.PORT, () => {
  process.stdout.write(`KhetGPT backend listening on :${env.PORT}\n`)
})
