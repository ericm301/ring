import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { getAuth, takeTime } from './auth-token'

async function example() {
  const { ringApi, sub } = getAuth(),
    // locations = await ringApi.getLocations(),
    // home = locations[0],
    cams = await ringApi.getCameras(),
    fluffyCam = cams.find((cam) => cam.name === '@Fluffy')!

  fluffyCam.requestUpdate()

  const snap = await fluffyCam.getSnapshot(),
    snapAge = fluffyCam.currentTimestampAge

  console.log(`\nSnap age: ${snapAge / 1000} seconds ago.\n`)
  await writeFile(`../../snap/${takeTime(Date.now() - snapAge)}_snap.jpg`, snap)

  sub.unsubscribe()
  process.exit(0)
}

example().catch((e: any) => {
  console.error('Example threw an error:', e)
})
