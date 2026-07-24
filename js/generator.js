const CHARACTER_SETS = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    capital: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    binary: "01",
};

export function generateRandomString(length, selectedTypes) {
    if (!Number.isInteger(length) || length < 1) {
        throw new Error("Enter a whole number length of at least 1.");
    }
    if (length > 100) {
        throw new Error("Length must be 100 or less.");
    }
    if (selectedTypes.length === 0) {
        throw new Error("Select at least one character type.");
    }

    const characters = selectedTypes.map((type) => CHARACTER_SETS[type]).join("");
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Uses distinct character count since "numbers" and "binary" overlap on '0'/'1'.
export function estimateEntropyBits(length, selectedTypes) {
    const characters = selectedTypes.map((type) => CHARACTER_SETS[type]).join("");
    const distinctCount = new Set(characters).size;
    if (distinctCount === 0 || !Number.isInteger(length) || length < 1) {
        return 0;
    }
    return length * Math.log2(distinctCount);
}
