const TILE_SIZE = 64;
const GAP = 4;
const ANIMATED_FRACTION = 0.25;

// Same hue family as --accent (#28a745), from near-black to a bright accent
// tint, so tiles always land on an on-theme green regardless of which two
// faces a given tile flips between.
const SHADES = [
    "hsl(134, 45%, 10%)",
    "hsl(134, 45%, 15%)",
    "hsl(134, 50%, 20%)",
    "hsl(134, 50%, 26%)",
    "hsl(134, 55%, 33%)",
    "hsl(134, 60%, 40%)",
];

function pickTwoShades() {
    const a = SHADES[Math.floor(Math.random() * SHADES.length)];
    let b = a;
    while (b === a) {
        b = SHADES[Math.floor(Math.random() * SHADES.length)];
    }
    return [a, b];
}

function buildAnimatedTile() {
    const tile = document.createElement("div");
    const inner = document.createElement("div");
    inner.className = "rubik-tile-inner" + (Math.random() < 0.5 ? " rubik-tile-inner--vertical" : "");
    // Negative delay starts each tile mid-animation instead of in lockstep.
    inner.style.animationDuration = `${(6 + Math.random() * 5).toFixed(2)}s`;
    inner.style.animationDelay = `-${(Math.random() * 10).toFixed(2)}s`;

    const [colorA, colorB] = pickTwoShades();
    const front = document.createElement("div");
    front.className = "rubik-face rubik-face--front";
    front.style.backgroundColor = colorA;
    const back = document.createElement("div");
    back.className = "rubik-face rubik-face--back";
    back.style.backgroundColor = colorB;

    inner.append(front, back);
    tile.append(inner);
    return tile;
}

// Most tiles render as a single static square instead of an animated flip —
// every tile in preserve-3d + backface-visibility:hidden gets its own GPU
// compositor layer, and flipping all of them forever is what was pegging the
// GPU/fan. A small animated fraction keeps the effect while the rest sit idle.
function buildStaticTile() {
    const tile = document.createElement("div");
    const face = document.createElement("div");
    face.className = "rubik-tile-static";
    face.style.backgroundColor = SHADES[Math.floor(Math.random() * SHADES.length)];
    tile.append(face);
    return tile;
}

function buildTile() {
    return Math.random() < ANIMATED_FRACTION ? buildAnimatedTile() : buildStaticTile();
}

function buildBackground() {
    const container = document.getElementById("bg-rubik");
    if (!container) return;

    // Fixed-size (not 1fr) tracks keep tiles square regardless of the
    // viewport's aspect ratio; the +1 and overflow:hidden on the container
    // absorb the rounding so the grid still fully covers the viewport.
    const step = TILE_SIZE + GAP;
    const cols = Math.ceil(window.innerWidth / step) + 1;
    const rows = Math.ceil(window.innerHeight / step) + 1;
    container.style.gridTemplateColumns = `repeat(${cols}, ${TILE_SIZE}px)`;
    container.style.gridTemplateRows = `repeat(${rows}, ${TILE_SIZE}px)`;
    container.innerHTML = "";

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < cols * rows; i++) {
        fragment.appendChild(buildTile());
    }
    container.appendChild(fragment);
}

let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(buildBackground, 200);
});

// The flip animations run indefinitely, so pause them while the tab isn't
// visible instead of animating a backgrounded/minimized tab forever.
document.addEventListener("visibilitychange", () => {
    document.getElementById("bg-rubik")?.classList.toggle("paused", document.hidden);
});

buildBackground();
