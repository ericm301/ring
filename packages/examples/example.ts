import 'dotenv/config'
import { RingApi } from 'ring-client-api'

import { readFile, writeFile } from 'fs'
import { promisify } from 'util'

async function getAuth() {
  const { env } = process,
    ringApi = new RingApi({
      refreshToken: env.RING_REFRESH_TOKEN!,
      debug: true,
    });
  
  const sub = ringApi.onRefreshTokenUpdated.subscribe(
    async  ({oldRefreshToken, newRefreshToken}) => {
      if (!oldRefreshToken) { return; }

      const currentConfig = await promisify(readFile)('.env'),
        updatedConfig = currentConfig
          .toString()
          .replace(oldRefreshToken, newRefreshToken);

      await promisify(writeFile)('.env', updatedConfig);
    } 
  )  

  return  {ringApi, sub}
}

function takeTime(timeval: number): string {
  // gets the time string and constructs a string like 'YYYYMMDD_HHmmss'
  const t = new Date(timeval),
    d2 = '2-digit',
    DT_Opts: Intl.DateTimeFormatOptions = { 
      year: "numeric", month: d2, day: d2,
      hour: d2, minute: d2, second: d2      
  }
  const timeFormatter = Intl.DateTimeFormat('en-US', DT_Opts);
  const timeFields: Intl.DateTimeFormatPart[] = timeFormatter.formatToParts(t);
  const { year, month, day, hour, minute, second } = timeFields.reduce(
    (obj, {type, value}) => {
      if (type != 'literal') {
        Object.defineProperty(obj, type, { value: value });
      }
      return obj;
    },{}
  ) as any;  // shut up, ts!
  return `${year+month+day}_${hour+minute+second}`;  //  concatenation, NOT addition!
}

async function example() {
  if (!process.env.RING_REFRESH_TOKEN) {
    throw "Go get an access token and put it in the .env file."
  }

  const { ringApi, sub } = await getAuth();

  const locations = await ringApi.getLocations(),
        home = locations[0],
        cams = ringApi.getCameras(),
        fluffyCam = (await cams).find((cam) => cam.name == '@Fluffy' )!;
  
  fluffyCam.requestUpdate();
  
  const snap = await fluffyCam.getSnapshot(),
    snapAge = fluffyCam.currentTimestampAge;

  console.log(`\nSnap age: ${snapAge} seconds ago.\n`);
  await promisify(writeFile)(`../../snap/${takeTime(Date.now() - 1000 * snapAge)}_snap.jpg`, snap)
  
  await sub.unsubscribe();
  process.exit(0);
}

example().catch((e: any) => {
  console.error('Example threw an error:', e)
})
