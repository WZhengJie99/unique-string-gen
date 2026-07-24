export function generateUuid() {
    return crypto.randomUUID();
}

function bytesToUuidString(bytes) {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// RFC 9562 UUIDv7: 48-bit unix ms timestamp, then version/variant bits, then random.
export function generateUuidV7() {
    const ts = BigInt(Date.now());
    const bytes = new Uint8Array(16);

    for (let i = 0; i < 6; i++) {
        bytes[i] = Number((ts >> BigInt(40 - i * 8)) & 0xffn);
    }

    const rand = crypto.getRandomValues(new Uint8Array(10));
    bytes[6] = 0x70 | (rand[0] & 0x0f);
    bytes[7] = rand[1];
    bytes[8] = 0x80 | (rand[2] & 0x3f);
    bytes.set(rand.subarray(3), 9);

    return bytesToUuidString(bytes);
}

export function formatUuidVariants(uuid) {
    return {
        standard: uuid,
        plain: uuid.replace(/-/g, ""),
        upper: uuid.toUpperCase(),
        urn: `urn:uuid:${uuid}`,
        braces: `{${uuid}}`,
    };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// v1 packs a 60-bit count of 100ns intervals since 1582-10-15 across
// time_low/time_mid/time_hi; the offset converts that epoch to Unix time.
function parseV1Timestamp(hex) {
    const timeLow = hex.slice(0, 8);
    const timeMid = hex.slice(8, 12);
    const timeHi = (parseInt(hex.slice(12, 16), 16) & 0x0fff).toString(16).padStart(3, "0");
    const timestamp100ns = BigInt(`0x${timeHi}${timeMid}${timeLow}`);
    const GREGORIAN_OFFSET_100NS = 0x01b21dd213814000n;
    const unixMs = (timestamp100ns - GREGORIAN_OFFSET_100NS) / 10000n;
    return new Date(Number(unixMs)).toISOString();
}

function parseV7Timestamp(hex) {
    const unixMs = parseInt(hex.slice(0, 12), 16);
    return new Date(unixMs).toISOString();
}

export function parseUuid(input) {
    const trimmed = input.trim().toLowerCase();
    if (!UUID_PATTERN.test(trimmed)) {
        throw new Error("Not a valid UUID format (expected 8-4-4-4-12 hex digits).");
    }
    const hex = trimmed.replace(/-/g, "");

    if (hex === "0".repeat(32)) {
        return { version: "Nil UUID", variant: "N/A", timestamp: null };
    }

    const versionDigit = hex[12];
    const variantBits = parseInt(hex[16], 16);
    let variant;
    if ((variantBits & 0b1000) === 0) variant = "NCS (reserved)";
    else if ((variantBits & 0b1100) === 0b1000) variant = "RFC 9562";
    else if ((variantBits & 0b1110) === 0b1100) variant = "Microsoft (reserved)";
    else variant = "Reserved (future)";

    let timestamp = null;
    if (versionDigit === "1") {
        timestamp = parseV1Timestamp(hex);
    } else if (versionDigit === "7") {
        timestamp = parseV7Timestamp(hex);
    }

    return {
        version: `Version ${versionDigit}`,
        variant,
        timestamp,
    };
}
