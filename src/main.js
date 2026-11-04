import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

const TANERA = [-41.3, 174.762];
const DEFAULT_ZOOM = 16;
const WARPER_TILES = "https://mapwarper.net/maps/tile/114001/{z}/{x}/{y}.png";

const map = L.map("map", {
  center: TANERA,
  zoom: DEFAULT_ZOOM,
  zoomControl: true,
  attributionControl: false,
});

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
});

const esri = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution:
      "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
);

const historical = L.tileLayer(WARPER_TILES, {
  maxZoom: 20,
  opacity: 0.6,
  attribution:
    '1938 photo Retrolens/LINZ <a href="https://creativecommons.org/licenses/by/3.0/">CC BY-3.0</a>; <a href="https://mapwarper.net/maps/114001">Map Warper</a>',
  errorTileUrl:
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
});

osm.addTo(map);
historical.addTo(map);

L.control
  .layers(
    {
      "OpenStreetMap": osm,
      "Esri World Imagery": esri,
    },
    {
      "1938 Map Warper": historical,
    },
    { position: "topright", collapsed: true },
  )
  .addTo(map);

const opacityInput = document.getElementById("opacity");
const opacityValue = document.getElementById("opacity-value");
const locateBtn = document.getElementById("locate-btn");

opacityInput.addEventListener("input", () => {
  const pct = Number(opacityInput.value);
  historical.setOpacity(pct / 100);
  opacityValue.textContent = `${pct}%`;
  opacityInput.setAttribute("aria-valuenow", String(pct));
});

let watchId = null;
let following = false;
let userMarker = null;
let accuracyCircle = null;
let toastTimer = null;

function showToast(message, ms = 3200) {
  let el = document.querySelector(".status-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "status-toast";
    el.setAttribute("role", "status");
    document.getElementById("app").appendChild(el);
  }
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), ms);
}

function setFollowing(active) {
  following = active;
  locateBtn.setAttribute("aria-pressed", active ? "true" : "false");
  locateBtn.textContent = active ? "Following" : "Locate";
}

function updateUserPosition(latlng, accuracy) {
  if (!userMarker) {
    userMarker = L.marker(latlng, {
      icon: L.divIcon({
        className: "user-marker",
        iconSize: [14, 14],
      }),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);
  } else {
    userMarker.setLatLng(latlng);
  }

  if (!accuracyCircle) {
    accuracyCircle = L.circle(latlng, {
      radius: accuracy || 20,
      color: "#2f7de1",
      weight: 1,
      fillColor: "#2f7de1",
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map);
  } else {
    accuracyCircle.setLatLng(latlng);
    accuracyCircle.setRadius(accuracy || 20);
  }

  if (following) {
    map.panTo(latlng, { animate: true });
  }
}

function clearWatch() {
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

function onPosition(pos) {
  const { latitude, longitude, accuracy } = pos.coords;
  updateUserPosition(L.latLng(latitude, longitude), accuracy);
}

function onPositionError(err) {
  clearWatch();
  setFollowing(false);
  locateBtn.disabled = false;

  if (err.code === err.PERMISSION_DENIED) {
    showToast("Location permission denied. Tap Locate to try again.");
  } else if (err.code === err.POSITION_UNAVAILABLE) {
    showToast("Location unavailable right now.");
  } else if (err.code === err.TIMEOUT) {
    showToast("Location timed out. Tap Locate to retry.");
  } else {
    showToast("Could not get your location.");
  }
}

function startWatch() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported in this browser.");
    return;
  }

  // Secure contexts only (HTTPS or localhost) — required on mobile.
  if (!window.isSecureContext) {
    showToast(
      "GPS needs HTTPS (or localhost). Deploy to GitHub Pages / Netlify for phone use.",
      5000,
    );
    return;
  }

  locateBtn.disabled = true;
  showToast("Requesting location…", 2000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locateBtn.disabled = false;
      setFollowing(true);
      onPosition(pos);
      map.setView([pos.coords.latitude, pos.coords.longitude], Math.max(map.getZoom(), 17), {
        animate: true,
      });

      clearWatch();
      watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 15000,
      });
    },
    (err) => {
      locateBtn.disabled = false;
      onPositionError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    },
  );
}

locateBtn.addEventListener("click", () => {
  if (following && watchId != null) {
    // Recenter on current position if we have one; otherwise restart.
    if (userMarker) {
      map.setView(userMarker.getLatLng(), Math.max(map.getZoom(), 17), {
        animate: true,
      });
      showToast("Recentered on you");
      return;
    }
  }

  if (following) {
    setFollowing(false);
    clearWatch();
    showToast("Stopped following");
    return;
  }

  startWatch();
});

map.on("dragstart", () => {
  if (following) {
    setFollowing(false);
    showToast("Follow paused — tap Locate to recenter");
  }
});

// Probe Map Warper tile availability once (non-blocking).
const probeZ = 15;
const probeX = Math.floor(((174.762 + 180) / 360) * 2 ** probeZ);
const probeY = Math.floor(
  ((1 -
    Math.log(
      Math.tan(((-41.3 * Math.PI) / 180 + Math.PI / 2) / 2),
    ) /
      Math.PI) /
    2) *
    2 ** probeZ,
);
const probeUrl = WARPER_TILES.replace("{z}", String(probeZ))
  .replace("{x}", String(probeX))
  .replace("{y}", String(probeY));

// Probe via Image (same path Leaflet uses). Map Warper does not send CORS
// headers, so fetch(..., { mode: "cors" }) fails even when tiles render.
const probeImg = new Image();
probeImg.onload = () => {
  console.info("Map Warper tile OK", probeUrl);
};
probeImg.onerror = () => {
  console.warn("Map Warper tile failed to load", probeUrl);
  showToast("Map Warper overlay tile failed to load", 4500);
};
probeImg.referrerPolicy = "no-referrer-when-downgrade";
probeImg.src = probeUrl;
