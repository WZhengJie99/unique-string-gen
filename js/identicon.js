function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i + 2 <= hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}

// Matches the .identicon aspect-ratio of 3/1 in main.css, so cells stay square.
const ROWS = 6;
const COLS = 18;

// Same hue/saturation as --accent (#28a745); only lightness varies per cell.
const FILL_HUE = 134;
const FILL_SATURATION = 60;
const MIN_LIGHTNESS = 26;
const MAX_LIGHTNESS = 64;

export function renderIdenticon(container, hexDigest) {
    const bytes = hexToBytes(hexDigest);
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

    // MD5 (16 bytes) is shorter than the 108 cells need, so indices wrap.
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const byteIndex = (row * COLS + col) % bytes.length;
            const byte = bytes[byteIndex];
            const filled = byte % 2 === 0;

            const cell = document.createElement("div");
            cell.className = "identicon-cell" + (filled ? " filled" : "");
            cell.style.gridRow = String(row + 1);
            cell.style.gridColumn = String(col + 1);
            if (filled) {
                const lightness = MIN_LIGHTNESS + (byte / 255) * (MAX_LIGHTNESS - MIN_LIGHTNESS);
                cell.style.backgroundColor = `hsl(${FILL_HUE}, ${FILL_SATURATION}%, ${lightness}%)`;
            }
            container.appendChild(cell);
        }
    }
}

export function renderIdenticonPlaceholder(container) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

    for (let i = 0; i < ROWS * COLS; i++) {
        const cell = document.createElement("div");
        cell.className = "identicon-cell";
        container.appendChild(cell);
    }
}
