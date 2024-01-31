import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { getAuth, takeTime } from './auth-token'
import { RingCamera } from 'ring-client-api'
import got from 'got'

async function getFootage() {
  const { ringApi, sub } = await getAuth(),
    cams = (await ringApi.getCameras()) as RingCamera[],
    fluffyCam = cams.find((cam) => cam.name === '@Fluffy')!,
    midnight = new Date(new Date().toLocaleDateString()).getTime(),
    fullDayMs = 24 * 60 * 60 * 1000

  fluffyCam.requestUpdate()

  const footage = await fluffyCam.getPeriodicalFootage(
      {startAtMs: midnight - fullDayMs, endAtMs: midnight - 1}
    ),
    videoCaptures = footage.data.map<Promise<any>>((segment) => {
      const { start_ms, url } = segment,
        filename = `../../snapvideo/${takeTime(start_ms)}.mp4`
      return got(url)
        .buffer()
        .then((video) => writeFile(filename, video))
    })
  await Promise.all(videoCaptures)

  sub.unsubscribe()
  process.exit(0)
}

getFootage().catch((e: any) => {
  console.error('Example threw an error:', e)
})
