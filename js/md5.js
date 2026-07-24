// Pure JS MD5 (RFC 1321) since browsers' SubtleCrypto doesn't implement it.

const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = new Int32Array([
    -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426,
    -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162,
    1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
    643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
    568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784,
    1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
    -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222,
    -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
    -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
    -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649,
    -145523070, -1120210379, 718787259, -343485551,
]);

function leftRotate(x, c) {
    return (x << c) | (x >>> (32 - c));
}

function toLittleEndianWords(bytes) {
    const words = new Int32Array(bytes.length / 4);
    for (let i = 0; i < words.length; i++) {
        words[i] =
            bytes[i * 4] |
            (bytes[i * 4 + 1] << 8) |
            (bytes[i * 4 + 2] << 16) |
            (bytes[i * 4 + 3] << 24);
    }
    return words;
}

function padMessage(bytes) {
    const originalLengthBits = bytes.length * 8;
    const withOne = [...bytes, 0x80];
    while (withOne.length % 64 !== 56) {
        withOne.push(0);
    }
    for (let i = 0; i < 8; i++) {
        withOne.push(Number((BigInt(originalLengthBits) >> BigInt(8 * i)) & 0xffn));
    }
    return withOne;
}

function toHex(num) {
    const bytes = [
        num & 0xff,
        (num >>> 8) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 24) & 0xff,
    ];
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function md5(input) {
    const bytes = new TextEncoder().encode(input);
    const padded = padMessage(Array.from(bytes));

    let a0 = 0x67452301;
    let b0 = 0xefcdab89 | 0;
    let c0 = 0x98badcfe | 0;
    let d0 = 0x10325476;

    for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
        const chunk = padded.slice(chunkStart, chunkStart + 64);
        const M = toLittleEndianWords(chunk);

        let A = a0, B = b0, C = c0, D = d0;

        for (let i = 0; i < 64; i++) {
            let F, g;
            if (i < 16) {
                F = (B & C) | (~B & D);
                g = i;
            } else if (i < 32) {
                F = (D & B) | (~D & C);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                F = B ^ C ^ D;
                g = (3 * i + 5) % 16;
            } else {
                F = C ^ (B | ~D);
                g = (7 * i) % 16;
            }
            F = (F + A + K[i] + M[g]) | 0;
            A = D;
            D = C;
            C = B;
            B = (B + leftRotate(F, S[i])) | 0;
        }

        a0 = (a0 + A) | 0;
        b0 = (b0 + B) | 0;
        c0 = (c0 + C) | 0;
        d0 = (d0 + D) | 0;
    }

    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}
