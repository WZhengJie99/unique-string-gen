const CHAR_CLASSES = [
    { regex: /[a-z]/, size: 26 },
    { regex: /[A-Z]/, size: 26 },
    { regex: /[0-9]/, size: 10 },
    { regex: /[^a-zA-Z0-9]/, size: 32 },
];

export function estimatePasswordEntropyBits(password) {
    if (password.length === 0) return 0;
    const charsetSize = CHAR_CLASSES.reduce(
        (size, cls) => (cls.regex.test(password) ? size + cls.size : size),
        0
    );
    return password.length * Math.log2(charsetSize);
}

export function evaluatePasswordRequirements(password) {
    return {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^a-zA-Z0-9]/.test(password),
    };
}

export function countCharacterClasses(password) {
    const counts = { upper: 0, number: 0, symbol: 0 };
    for (const char of password) {
        if (/[A-Z]/.test(char)) counts.upper++;
        else if (/[0-9]/.test(char)) counts.number++;
        else if (/[^a-zA-Z0-9]/.test(char)) counts.symbol++;
    }
    return counts;
}
