function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary);
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export const ENCODE_MODES = {
    "base64-encode": {
        label: "Base64 Encode",
        run: (text) => bytesToBase64(new TextEncoder().encode(text)),
    },
    "base64-decode": {
        label: "Base64 Decode",
        run: (text) => {
            try {
                return new TextDecoder().decode(base64ToBytes(text));
            } catch {
                throw new Error("Not valid Base64 — check for typos or missing padding.");
            }
        },
    },
    "url-encode": {
        label: "URL Encode",
        run: (text) => encodeURIComponent(text),
    },
    "url-decode": {
        label: "URL Decode",
        run: (text) => {
            try {
                return decodeURIComponent(text);
            } catch {
                throw new Error("Not valid URL-encoded text — check for stray % characters.");
            }
        },
    },
};

export function runEncodeMode(mode, text) {
    const modeInfo = ENCODE_MODES[mode];
    if (!modeInfo) {
        throw new Error(`Unsupported mode: ${mode}`);
    }
    return modeInfo.run(text);
}

export function byteLength(text) {
    return new TextEncoder().encode(text).length;
}
