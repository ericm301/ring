import 'dotenv/config'
import { RingApi } from 'ring-client-api'
import { acquireRefreshToken } from '../ring-client-api/refresh-token'
import { readFile, writeFile } from 'node:fs/promises'
const accessKey = 'RING_REFRESH_TOKEN'

export async function getAuth() {
  const { env } = process
  var newToken: string = ''

  if (!env.RING_REFRESH_TOKEN) {
    newToken = await acquireRefreshToken()
    try {
      await writeFile('.env', `${accessKey}=${newToken}`)
    } catch (e) {
      console.error("Writing to .env file failed!")
      throw(e)
    }
  }

  const ringApi: RingApi = new RingApi({
      refreshToken: newToken || env.RING_REFRESH_TOKEN!,
      debug: true,
    }),
    sub = ringApi.onRefreshTokenUpdated.subscribe(
      async ({ oldRefreshToken, newRefreshToken }) => {
        if (!oldRefreshToken) {
          return
        }
        const currentConfig = await readFile('.env'),
          updatedConfig = currentConfig
            .toString()
            .replace(oldRefreshToken, newRefreshToken)

        await writeFile('.env', updatedConfig)
      },
    )

  return { ringApi, sub }
}

export function takeTime(timeval: number = -1, separator: string = ''): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type DT_FormatOptions = Intl.DateTimeFormatPart

  // gets the time string and constructs a string like 'YYYYMMDD_HHmmss'
  // There has got to be an easier way to do this!
  const t = new Date(timeval),
    d2 = '2-digit',
    DT_Opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: d2,
      day: d2,
      hour: d2,
      minute: d2,
      second: d2,
      hourCycle: 'h23',
    },
    timeFormatter = Intl.DateTimeFormat('en-US', DT_Opts),
    timeFields: Intl.DateTimeFormatPart[] = timeFormatter.formatToParts(t),
    { year, month, day, hour, minute, second } = timeFields.reduce(
      (obj, { type, value }) => {
        if (type !== 'literal') {
          Object.defineProperty(obj, type, { value: value })
        }
        return obj
      },
      {},
    ) as any, // shut up, ts!
    s = separator
  return `${year}${s}${month}${s}${day}_${hour}${s}${minute}${s}${second}`
}
