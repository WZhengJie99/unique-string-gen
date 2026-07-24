import { md5 } from "./md5.js";
import { sha3_256, sha3_512 } from "./sha3.js";

export const ALGORITHMS = {
    "MD5": {
        description:
            "128-bit digest, very fast, but broken: collisions can be produced deliberately. Fine for checksums, unsafe for passwords or signatures.",
    },
    "SHA-1": {
        description:
            "160-bit digest. Deprecated for security use since 2017 after practical collision attacks; still seen in legacy systems.",
    },
    "SHA-256": {
        description:
            "256-bit digest from the SHA-2 family. Widely used today for certificates, checksums, and blockchain — a solid default.",
    },
    "SHA-384": {
        description:
            "384-bit digest from the SHA-2 family. A truncated variant of SHA-512 with a different initial state, slightly faster on 64-bit hardware.",
    },
    "SHA-512": {
        description:
            "512-bit digest from the SHA-2 family. Larger output and often faster than SHA-256 on 64-bit hardware.",
    },
    "SHA3-256": {
        description:
            "256-bit digest built on the Keccak sponge construction, standardized as SHA-3 in 2015. Structurally different from SHA-2, useful as a hedge against future SHA-2 attacks.",
    },
    "SHA3-512": {
        description:
            "512-bit digest built on the Keccak sponge construction. Same design as SHA3-256 with a larger output size.",
    },
};

const SUBTLE_CRYPTO_NAMES = {
    "SHA-1": "SHA-1",
    "SHA-256": "SHA-256",
    "SHA-384": "SHA-384",
    "SHA-512": "SHA-512",
};

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function computeHash(algorithm, message) {
    if (algorithm === "MD5") {
        return md5(message);
    }
    if (algorithm === "SHA3-256") {
        return sha3_256(message);
    }
    if (algorithm === "SHA3-512") {
        return sha3_512(message);
    }

    const subtleName = SUBTLE_CRYPTO_NAMES[algorithm];
    if (!subtleName) {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    const data = new TextEncoder().encode(message);
    const digest = await crypto.subtle.digest(subtleName, data);
    return bufferToHex(digest);
}
