import {readFile} from 'node:fs/promises'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-08-04'}).withConfig({useCdn: false, useProjectHostname: false})
const config = JSON.parse(await readFile(new URL('../github-webhook.json', import.meta.url), 'utf8'))
// Management endpoints use the global API host, matching Sanity CLI's hooks service.
const url = `/hooks/projects/${client.config().projectId}`

try {
  const hooks = await client.request({url, method: 'GET'})
  const existing = hooks.find((hook) => hook.name === config.name && hook.url === config.url)
  if (existing) {
    console.log('The GitHub Pages webhook already exists; its settings were preserved.')
  } else {
    await client.request({url, method: 'POST', body: config})
    console.log('Disabled GitHub Pages webhook created. Add the GitHub Authorization header in Sanity Manage, then enable it.')
  }
} catch (error) {
  // Request/response objects can contain stored Authorization headers. Never print them.
  console.error(`Webhook setup failed (HTTP ${error.statusCode || 'unknown'}). Check Sanity project access.`)
  const diagnostic = error.response?.body?.message || error.response?.body?.error?.description
  if (typeof diagnostic === 'string') console.error(diagnostic)
  process.exitCode = 1
}
