/**
 * ============================================
 * CLOCK FUNCTIONALITY
 * ============================================
 * 
 * Manages the digital clock display
 */

let clockInterval = null;
let bootstrapDate = null;

/**
 * Start clock from server time (Philippines timezone)
 * @param {object} result - Server time response
 */
function startClockFromServer(result) {
  const el = document.getElementById('digitalClock');
  
  if (!result || !result.success || !result.data) {
    startClockLocal();
    return;
  }

  const d = result.data;
  const iso = `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}T${String(d.hour).padStart(2,'0')}:${String(d.minute).padStart(2,'0')}:${String(d.seconds).padStart(2,'0')}+08:00`;
  bootstrapDate = new Date(iso);

  if (clockInterval) clearInterval(clockInterval);

  function tick() {
    bootstrapDate = new Date(bootstrapDate.getTime() + 1000);
    const h = String(bootstrapDate.getHours()).padStart(2, '0');
    const m = String(bootstrapDate.getMinutes()).padStart(2, '0');
    const s = String(bootstrapDate.getSeconds()).padStart(2, '0');
    el.textContent = h + ':' + m + ':' + s;
  }

  tick();
  clockInterval = setInterval(tick, CLOCK_UPDATE_INTERVAL);
}

/**
 * Start clock using local system time (fallback)
 */
function startClockLocal() {
  const el = document.getElementById('digitalClock');
  
  if (clockInterval) clearInterval(clockInterval);
  
  function tickLocal() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    el.textContent = h + ':' + m + ':' + s;
  }
  
  tickLocal();
  clockInterval = setInterval(tickLocal, CLOCK_UPDATE_INTERVAL);
}
