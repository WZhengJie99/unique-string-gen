// Pure JS SHA-3/Keccak (FIPS 202) since browsers' SubtleCrypto doesn't implement it.

const ROUND_CONSTANTS = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
    0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
    0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
    0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
    0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
    0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
    0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTATION_OFFSETS = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14],
];

const MASK64 = (1n << 64n) - 1n;

function rotl64(value, shift) {
    if (shift === 0) return value & MASK64;
    return ((value << BigInt(shift)) | (value >> BigInt(64 - shift))) & MASK64;
}

function keccakF1600(state) {
    for (let round = 0; round < 24; round++) {
        // Theta
        const C = new Array(5);
        for (let x = 0; x < 5; x++) {
            C[x] = state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4];
        }
        const D = new Array(5);
        for (let x = 0; x < 5; x++) {
            D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
        }
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                state[x][y] ^= D[x];
            }
        }

        // Rho + Pi
        const B = Array.from({ length: 5 }, () => new Array(5).fill(0n));
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                B[y][(2 * x + 3 * y) % 5] = rotl64(state[x][y], ROTATION_OFFSETS[x][y]);
            }
        }

        // Chi
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                state[x][y] = B[x][y] ^ (~B[(x + 1) % 5][y] & B[(x + 2) % 5][y] & MASK64);
            }
        }

        // Iota
        state[0][0] ^= ROUND_CONSTANTS[round];
    }
    return state;
}

function bytesToLane(bytes, offset) {
    let lane = 0n;
    for (let i = 0; i < 8; i++) {
        lane |= BigInt(bytes[offset + i]) << BigInt(8 * i);
    }
    return lane;
}

function laneToBytes(lane) {
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        bytes[i] = Number((lane >> BigInt(8 * i)) & 0xffn);
    }
    return bytes;
}

function keccak(rateBits, capacityBits, input, outputBits, suffix) {
    const rateBytes = rateBits / 8;
    const state = Array.from({ length: 5 }, () => new Array(5).fill(0n));

    // Padding: pad10*1 with the domain-separation suffix folded in.
    const blockBytes = [...input, suffix];
    while (blockBytes.length % rateBytes !== 0) {
        blockBytes.push(0);
    }
    blockBytes[blockBytes.length - 1] |= 0x80;

    for (let offset = 0; offset < blockBytes.length; offset += rateBytes) {
        const block = blockBytes.slice(offset, offset + rateBytes);
        for (let i = 0; i < rateBytes / 8; i++) {
            const x = i % 5;
            const y = Math.floor(i / 5);
            state[x][y] ^= bytesToLane(block, i * 8);
        }
        keccakF1600(state);
    }

    const outputBytes = [];
    while (outputBytes.length * 8 < outputBits) {
        for (let i = 0; i < rateBytes / 8 && outputBytes.length * 8 < outputBits; i++) {
            const x = i % 5;
            const y = Math.floor(i / 5);
            outputBytes.push(...laneToBytes(state[x][y]));
        }
        if (outputBytes.length * 8 < outputBits) {
            keccakF1600(state);
        }
    }

    return outputBytes
        .slice(0, outputBits / 8)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function sha3(bits, input) {
    const bytes = Array.from(new TextEncoder().encode(input));
    const rateBits = 1600 - 2 * bits;
    // SHA-3 domain separation suffix per FIPS 202 is the bits '01', appended
    // LSB-first, which folds into byte 0x06 before the pad10*1 padding.
    return keccak(rateBits, 2 * bits, bytes, bits, 0x06);
}

export function sha3_256(input) {
    return sha3(256, input);
}

export function sha3_512(input) {
    return sha3(512, input);
}
