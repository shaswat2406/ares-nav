// Live NASA Open API Service Client
const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || "mJcP7J6pr8d88MRfhMMWJPHmDwNmcHMfcznnLbhF";

export async function fetchLivePerseverancePhotos(sol = 1000) {
  try {
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos?sol=${sol}&camera=navcam_left&api_key=${NASA_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("NASA API rate limit or error");
    const data = await response.json();
    return data.photos && data.photos.length > 0 ? data.photos.slice(0, 4) : null;
  } catch (error) {
    console.warn("NASA API Live Fetch failed, using cached telemetry fallback:", error);
    return null;
  }
}

export async function fetchLiveAPOD() {
  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("NASA APOD error");
    return await response.json();
  } catch (error) {
    return null;
  }
}
