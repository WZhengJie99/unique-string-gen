// Same hue/saturation as --accent (#28a745); only lightness varies per nibble,
// matching the identicon's color language without duplicating its grid shape.
const FILL_HUE = 134;
const FILL_SATURATION = 60;
const MIN_LIGHTNESS = 20;
const MAX_LIGHTNESS = 68;

export function renderUuidBarcode(container, uuid) {
    const hexDigits = uuid.replace(/-/g, "").split("");
    container.innerHTML = "";

    hexDigits.forEach((digit) => {
        const value = parseInt(digit, 16);
        const lightness = MIN_LIGHTNESS + (value / 15) * (MAX_LIGHTNESS - MIN_LIGHTNESS);

        const segment = document.createElement("div");
        segment.className = "uuid-barcode-segment";
        segment.style.backgroundColor = `hsl(${FILL_HUE}, ${FILL_SATURATION}%, ${lightness}%)`;
        segment.title = `${digit.toUpperCase()} (${value})`;
        container.appendChild(segment);
    });
}
