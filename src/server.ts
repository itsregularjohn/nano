import { serve } from "@hono/node-server"

import app from "./app"

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

console.log(`🔥 Server is running at http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
