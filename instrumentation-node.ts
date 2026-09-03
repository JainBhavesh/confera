// Node-only half of instrumentation.ts's register() — see the comment there
// for why this is a separate file. Runs once when the Node server process
// boots, and sets up a periodic sweep for meetings nobody ever joined or
// that everyone left without the client managing to call /leave (closed
// tab, dropped connection). There's no external cron in this deployment, so
// an in-process interval is the simplest thing that actually runs
// continuously for a long-lived `next start`/`next dev` process.
import { endAbandonedMeetings, endOrphanedLiveMeetings } from '@/services/meeting.service';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

async function sweep() {
  try {
    const abandoned = await endAbandonedMeetings();
    const orphaned = await endOrphanedLiveMeetings();
    if (abandoned || orphaned) {
      console.log(`[meeting-sweep] ended ${abandoned} abandoned, ${orphaned} orphaned meeting(s).`);
    }
  } catch (err) {
    console.error('[meeting-sweep] failed:', err);
  }
}

setInterval(sweep, SWEEP_INTERVAL_MS);
sweep();
