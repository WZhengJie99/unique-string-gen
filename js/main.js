import { generateRandomString, estimateEntropyBits } from "./generator.js";
import { computeHash, ALGORITHMS } from "./hash.js";
import { renderIdenticon, renderIdenticonPlaceholder } from "./identicon.js";
import { estimatePasswordEntropyBits, evaluatePasswordRequirements, countCharacterClasses } from "./password.js";
import { generateUuid, generateUuidV7, formatUuidVariants, parseUuid } from "./uuid.js";
import { renderUuidBarcode } from "./uuidBarcode.js";
import { runEncodeMode, byteLength } from "./encode.js";
import { decodeJwt } from "./jwt.js";

const ENTROPY_LEVELS = [
    { minBits: 64, label: "Strong", className: "strong" },
    { minBits: 40, label: "Fair", className: "fair" },
    { minBits: 0, label: "Weak", className: "weak" },
];

const LEVEL_COLOR_VAR = { weak: "error", fair: "warn", strong: "accent" };

const CHARSET_SIZES = { upper: 26, number: 10, symbol: 32 };
const MAX_CHARSET_SIZE = Math.max(...Object.values(CHARSET_SIZES));
// A bar reaches its full charset-size reference height once this many
// characters of that type appear — realistic passwords rarely have anywhere
// near 26-32 of one class, so scaling raw count/charsetSize left bars flat.
const BAR_SATURATION_COUNT = 5;

function showResult(outputEl, errorEl, value) {
    outputEl.textContent = value;
    errorEl.textContent = "";
    errorEl.hidden = true;
}

function showError(outputEl, errorEl, message) {
    outputEl.textContent = "";
    errorEl.textContent = message;
    errorEl.hidden = false;
}

function copyText(text, buttonEl) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        clearTimeout(buttonEl._copyTimeout);
        const original = buttonEl.dataset.originalLabel ?? buttonEl.textContent;
        buttonEl.dataset.originalLabel = original;
        buttonEl.textContent = "Copied!";
        buttonEl._copyTimeout = setTimeout(() => {
            buttonEl.textContent = original;
        }, 1200);
    });
}

function updateEntropyMeter(fillEl, labelEl, bits) {
    const level = ENTROPY_LEVELS.find((l) => bits >= l.minBits);
    const percent = Math.min(100, (bits / 128) * 100);

    fillEl.style.width = `${percent}%`;
    fillEl.className = `meter-fill ${level.className}`;
    labelEl.textContent = `${level.label} · ${bits.toFixed(1)} bits of entropy`;
}

function updateRadialMeter(ringEl, valueEl, labelEl, bits) {
    const level = ENTROPY_LEVELS.find((l) => bits >= l.minBits);
    const percent = Math.min(100, (bits / 128) * 100);
    const degrees = (percent / 100) * 360;
    const colorVar = LEVEL_COLOR_VAR[level.className];

    ringEl.style.background = `conic-gradient(var(--${colorVar}) 0deg ${degrees}deg, var(--input-bg) ${degrees}deg 360deg)`;
    valueEl.textContent = bits.toFixed(0);
    labelEl.textContent = level.label;
    labelEl.className = `meter-label ${level.className}`;
}

function initGenerator() {
    const lengthInput = document.getElementById("length");
    const generatedStringEl = document.getElementById("generatedString");
    const generatorErrorEl = document.getElementById("generatorError");
    const copyGeneratedBtn = document.getElementById("copyGeneratedBtn");
    const entropyFillEl = document.getElementById("entropyFill");
    const entropyLabelEl = document.getElementById("entropyLabel");

    function refreshEntropyMeter() {
        const length = parseInt(lengthInput.value, 10);
        const selectedTypes = Array.from(
            document.querySelectorAll('input[name="charType"]:checked')
        ).map((checkbox) => checkbox.value);
        updateEntropyMeter(entropyFillEl, entropyLabelEl, estimateEntropyBits(length, selectedTypes));
    }

    document.getElementById("generateBtn").addEventListener("click", () => {
        const selectedTypes = Array.from(
            document.querySelectorAll('input[name="charType"]:checked')
        ).map((checkbox) => checkbox.value);
        const length = parseInt(lengthInput.value, 10);

        try {
            const result = generateRandomString(length, selectedTypes);
            showResult(generatedStringEl, generatorErrorEl, result);
        } catch (err) {
            showError(generatedStringEl, generatorErrorEl, err.message);
        }
        refreshEntropyMeter();
    });

    copyGeneratedBtn.addEventListener("click", () => {
        copyText(generatedStringEl.textContent, copyGeneratedBtn);
    });
}

function initHasher() {
    const algorithmSelect = document.getElementById("algorithm");
    const descriptionEl = document.getElementById("algorithmDescription");
    const hashInput = document.getElementById("hashInput");
    const hashOutputEl = document.getElementById("hashOutput");
    const hashErrorEl = document.getElementById("hashError");
    const copyHashBtn = document.getElementById("copyHashBtn");
    const hashIdenticonEl = document.getElementById("hashIdenticon");

    let hasHashedOnce = false;

    function updateDescription() {
        const info = ALGORITHMS[algorithmSelect.value];
        descriptionEl.textContent = info ? info.description : "";
    }

    async function refreshIdenticon() {
        const digest = await computeHash(algorithmSelect.value, hashInput.value);
        renderIdenticon(hashIdenticonEl, digest);
    }

    algorithmSelect.addEventListener("change", () => {
        updateDescription();
        if (hasHashedOnce) {
            refreshIdenticon();
        }
    });
    updateDescription();

    document.getElementById("hashBtn").addEventListener("click", async () => {
        const message = hashInput.value;
        if (message.length === 0) {
            showError(hashOutputEl, hashErrorEl, "Enter some text to hash.");
            return;
        }
        try {
            const digest = await computeHash(algorithmSelect.value, message);
            showResult(hashOutputEl, hashErrorEl, digest);
            renderIdenticon(hashIdenticonEl, digest);
            hasHashedOnce = true;
        } catch (err) {
            showError(hashOutputEl, hashErrorEl, err.message);
        }
    });

    copyHashBtn.addEventListener("click", () => {
        copyText(hashOutputEl.textContent, copyHashBtn);
    });

    renderIdenticonPlaceholder(hashIdenticonEl);
}

function initPasswordChecker() {
    const passwordInput = document.getElementById("passwordInput");
    const toggleBtn = document.getElementById("togglePasswordBtn");
    const ringEl = document.getElementById("passwordMeterRing");
    const valueEl = document.getElementById("passwordMeterValue");
    const labelEl = document.getElementById("passwordMeterLabel");
    const requirementChips = document.querySelectorAll("#passwordRequirements .chip");
    const charsetBars = document.querySelectorAll("#passwordCharsetChart .charset-bar-fill");

    function refreshRequirements() {
        const requirements = evaluatePasswordRequirements(passwordInput.value);
        requirementChips.forEach((chip) => {
            chip.classList.toggle("met", requirements[chip.dataset.req]);
        });
    }

    function refreshCharsetChart() {
        const counts = countCharacterClasses(passwordInput.value);
        charsetBars.forEach((bar) => {
            const req = bar.dataset.req;
            const maxHeightPercent = (CHARSET_SIZES[req] / MAX_CHARSET_SIZE) * 100;
            const growth = Math.min(counts[req], BAR_SATURATION_COUNT) / BAR_SATURATION_COUNT;
            bar.style.height = `${maxHeightPercent * growth}%`;
            bar.classList.toggle("met", counts[req] > 0);
        });
    }

    passwordInput.addEventListener("input", () => {
        updateRadialMeter(ringEl, valueEl, labelEl, estimatePasswordEntropyBits(passwordInput.value));
        refreshRequirements();
        refreshCharsetChart();
    });

    toggleBtn.addEventListener("click", () => {
        const showing = passwordInput.type === "text";
        passwordInput.type = showing ? "password" : "text";
        toggleBtn.textContent = showing ? "Show" : "Hide";
    });
}

const UUID_GENERATORS = {
    v4: generateUuid,
    v7: generateUuidV7,
};

function initUuidGenerator() {
    const versionSelect = document.getElementById("uuidVersionSelect");
    const barcodeEl = document.getElementById("uuidBarcode");
    const formatSelect = document.getElementById("uuidFormatSelect");
    const formatValueEl = document.getElementById("uuidFormatValue");
    const copyFormatBtn = document.getElementById("copyUuidFormatBtn");

    let currentVariants = {};

    function refreshFormatValue() {
        formatValueEl.textContent = currentVariants[formatSelect.value];
    }

    function generateAndRender() {
        const uuid = UUID_GENERATORS[versionSelect.value]();
        renderUuidBarcode(barcodeEl, uuid);

        currentVariants = formatUuidVariants(uuid);
        refreshFormatValue();
    }

    document.getElementById("generateUuidBtn").addEventListener("click", generateAndRender);

    formatSelect.addEventListener("change", refreshFormatValue);

    copyFormatBtn.addEventListener("click", () => {
        copyText(formatValueEl.textContent, copyFormatBtn);
    });

    generateAndRender();

    const validateInput = document.getElementById("uuidValidateInput");
    const validateErrorEl = document.getElementById("uuidValidateError");
    const validateResultEl = document.getElementById("uuidValidateResult");
    const validateVersionEl = document.getElementById("uuidValidateVersion");
    const validateVariantEl = document.getElementById("uuidValidateVariant");
    const validateTimestampRowEl = document.getElementById("uuidValidateTimestampRow");
    const validateTimestampEl = document.getElementById("uuidValidateTimestamp");

    document.getElementById("uuidValidateBtn").addEventListener("click", () => {
        if (validateInput.value.trim().length === 0) {
            validateErrorEl.textContent = "Paste a UUID to validate.";
            validateErrorEl.hidden = false;
            validateResultEl.hidden = true;
            return;
        }
        try {
            const info = parseUuid(validateInput.value);
            validateErrorEl.hidden = true;
            validateVersionEl.textContent = info.version;
            validateVariantEl.textContent = info.variant;
            validateTimestampRowEl.hidden = info.timestamp === null;
            validateTimestampEl.textContent = info.timestamp ?? "";
            validateResultEl.hidden = false;
        } catch (err) {
            validateErrorEl.textContent = err.message;
            validateErrorEl.hidden = false;
            validateResultEl.hidden = true;
        }
    });
}

function initEncoder() {
    const input = document.getElementById("encodeInput");
    const modeSelect = document.getElementById("encodeMode");
    const outputEl = document.getElementById("encodeOutput");
    const errorEl = document.getElementById("encodeError");
    const copyBtn = document.getElementById("copyEncodeBtn");
    const sizeCompareEl = document.getElementById("encodeSizeCompare");
    const sizeInputFillEl = document.getElementById("encodeSizeInputFill");
    const sizeOutputFillEl = document.getElementById("encodeSizeOutputFill");
    const sizeInputValueEl = document.getElementById("encodeSizeInputValue");
    const sizeOutputValueEl = document.getElementById("encodeSizeOutputValue");
    const sizeDeltaEl = document.getElementById("encodeSizeDelta");

    function resetSizeCompare() {
        sizeInputFillEl.style.width = "0%";
        sizeOutputFillEl.style.width = "0%";
        sizeOutputFillEl.classList.remove("grew");
        sizeInputValueEl.textContent = "–";
        sizeOutputValueEl.textContent = "–";
        sizeDeltaEl.textContent = "";
        sizeDeltaEl.classList.remove("grew");
        sizeCompareEl.classList.add("empty");
    }

    function updateSizeCompare(inputText, outputText) {
        const inputBytes = byteLength(inputText);
        const outputBytes = byteLength(outputText);
        const maxBytes = Math.max(inputBytes, outputBytes, 1);
        const grew = outputBytes > inputBytes;
        const deltaPercent = inputBytes === 0 ? 0 : ((outputBytes - inputBytes) / inputBytes) * 100;
        const sign = deltaPercent > 0 ? "+" : "";

        sizeInputFillEl.style.width = `${(inputBytes / maxBytes) * 100}%`;
        sizeOutputFillEl.style.width = `${(outputBytes / maxBytes) * 100}%`;
        sizeOutputFillEl.classList.toggle("grew", grew);
        sizeInputValueEl.textContent = `${inputBytes} B`;
        sizeOutputValueEl.textContent = `${outputBytes} B`;
        sizeDeltaEl.textContent = `(${sign}${deltaPercent.toFixed(0)}%)`;
        sizeDeltaEl.classList.toggle("grew", grew);
        sizeCompareEl.classList.remove("empty");
    }

    resetSizeCompare();

    document.getElementById("encodeBtn").addEventListener("click", () => {
        if (input.value.length === 0) {
            showError(outputEl, errorEl, "Enter some text to convert.");
            resetSizeCompare();
            return;
        }
        try {
            const result = runEncodeMode(modeSelect.value, input.value);
            showResult(outputEl, errorEl, result);
            updateSizeCompare(input.value, result);
        } catch (err) {
            showError(outputEl, errorEl, err.message);
            resetSizeCompare();
        }
    });

    copyBtn.addEventListener("click", () => {
        copyText(outputEl.textContent, copyBtn);
    });
}

function initJwtDecoder() {
    const input = document.getElementById("jwtInput");
    const errorEl = document.getElementById("jwtError");
    const expiryEl = document.getElementById("jwtExpiry");
    const headerEl = document.getElementById("jwtHeader");
    const payloadEl = document.getElementById("jwtPayload");

    document.getElementById("decodeJwtBtn").addEventListener("click", () => {
        if (input.value.trim().length === 0) {
            errorEl.textContent = "Paste a JWT to decode.";
            errorEl.hidden = false;
            expiryEl.hidden = true;
            headerEl.textContent = "";
            payloadEl.textContent = "";
            return;
        }
        try {
            const { header, payload, expiryNote } = decodeJwt(input.value);
            errorEl.hidden = true;
            headerEl.textContent = header;
            payloadEl.textContent = payload;
            expiryEl.textContent = expiryNote ?? "";
            expiryEl.hidden = expiryNote === null;
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.hidden = false;
            expiryEl.hidden = true;
            headerEl.textContent = "";
            payloadEl.textContent = "";
        }
    });
}

initGenerator();
initHasher();
initPasswordChecker();
initUuidGenerator();
initEncoder();
initJwtDecoder();

document.getElementById("footerYear").textContent = new Date().getFullYear();
