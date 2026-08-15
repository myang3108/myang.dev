/* ---------------------------------------------------------------
   Spotify "Now Playing" — inline expand on hover.

   To connect this to your real Spotify:
   1. Set up a small backend (Vercel function, Cloudflare Worker, etc.)
      that uses your Spotify refresh token to call:
        - GET /v1/me/player/currently-playing
   2. Have it return JSON: { isPlaying, title, artist }
   3. Replace ENDPOINT below with your backend URL.

   Until then, it shows a demo track.
   --------------------------------------------------------------- */

const ENDPOINT = null; // e.g. "https://your-worker.workers.dev/now-playing"
const POLL_INTERVAL = 3600000; // poll once every hour

const widget = document.getElementById("nowPlaying");
const npText = document.getElementById("npText");

async function fetchNowPlaying() {
  if (!ENDPOINT) {
    npText.textContent = "The Peace by Underscores";
    npText.href = "https://open.spotify.com/track/6wm3t4VpTxSFfOUgTMlHZM";
    widget.classList.remove("is-idle");
    return;
  }

  try {
    const res = await fetch(ENDPOINT);
    const data = await res.json();

    if (data.isPlaying) {
      npText.textContent = `${data.title} by ${data.artist}`;
      npText.href = data.url || "#";
      widget.classList.remove("is-idle");
    } else {
      npText.textContent = "no song playing";
      npText.removeAttribute("href");
      widget.classList.add("is-idle");
    }
  } catch (e) {
    npText.textContent = "no song playing";
    widget.classList.add("is-idle");
  }
}

fetchNowPlaying();
if (ENDPOINT) setInterval(fetchNowPlaying, POLL_INTERVAL);
