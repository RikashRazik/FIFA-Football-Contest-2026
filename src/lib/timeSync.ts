let clockOffset = 0;

async function syncServerTimeOffset(): Promise<number> {
  try {
    const startTime = Date.now();
    const response = await fetch(window.location.origin + '/?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
    const endTime = Date.now();
    const dateHeader = response.headers.get('Date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const roundTripTime = endTime - startTime;
      const adjustedServerTime = serverTime + (roundTripTime / 2);
      const offset = adjustedServerTime - endTime;
      console.log(`[TimeSync] Server time synced. Clock offset: ${offset}ms`);
      return offset;
    }
  } catch (error) {
    console.warn("[TimeSync] Failed to fetch server time from origin HEAD. Trying fallback public API:", error);
  }

  // Fallback public APIs if origin HEAD is blocked or lacks Date header
  const fallbacks = [
    'https://worldtimeapi.org/api/timezone/Etc/UTC',
    'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
  ];

  for (const url of fallbacks) {
    try {
      const startTime = Date.now();
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      let serverTimeStr = '';
      if (data && data.utc_datetime) {
        serverTimeStr = data.utc_datetime;
      } else if (data && data.dateTime) {
        serverTimeStr = data.dateTime;
      }
      
      if (serverTimeStr) {
        const serverTime = new Date(serverTimeStr).getTime();
        const offset = serverTime - startTime;
        console.log(`[TimeSync] Fallback server time synced from ${url}. Clock offset: ${offset}ms`);
        return offset;
      }
    } catch (e) {
      console.warn(`[TimeSync] Fallback failed for ${url}:`, e);
    }
  }

  console.error("[TimeSync] All time sync methods failed. Falling back to local device clock (0ms offset).");
  return 0;
}

export async function initTimeSync() {
  clockOffset = await syncServerTimeOffset();
}

export function getTamperProofDate(): Date {
  return new Date(Date.now() + clockOffset);
}
