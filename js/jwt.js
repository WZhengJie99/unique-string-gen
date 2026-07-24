function base64UrlDecode(segment) {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export function decodeJwt(token) {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
        throw new Error("A JWT has three dot-separated parts (header.payload.signature).");
    }

    let header;
    try {
        header = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
        throw new Error("Could not decode the header — is this a valid JWT?");
    }

    let payload;
    try {
        payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        throw new Error("Could not decode the payload — is this a valid JWT?");
    }

    let expiryNote = null;
    if (typeof payload.exp === "number") {
        const expiryDate = new Date(payload.exp * 1000);
        expiryNote =
            expiryDate.getTime() < Date.now()
                ? `Expired at ${expiryDate.toLocaleString()}`
                : `Expires at ${expiryDate.toLocaleString()}`;
    }

    return {
        header: JSON.stringify(header, null, 2),
        payload: JSON.stringify(payload, null, 2),
        expiryNote,
    };
}
