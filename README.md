# Unique String Generator

A client-side toolkit for generating and inspecting strings: random strings,
hashes, password strength, UUIDs, Base64/URL encoding, and JWTs. Static
HTML/CSS/JS, no build step, no backend, no external dependencies — everything
runs in your browser.

## Tools

**Random String**
1. Enter the desired length.
2. Select the character type(s) to include (lowercase, uppercase, numbers, binary).
3. Click "Generate", then "Copy" to copy the result. A live meter shows the entropy.

**Hash Generator**
1. Type or paste the text to hash.
2. Choose an algorithm (MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-512) — an italic note below the dropdown explains each option.
3. Click "Hash" to compute the digest and see its identicon.
4. Click "Copy" to copy the hash.

**Password Strength**
1. Type a password to see a live entropy meter and which character-class requirements it meets.
2. Click "Show"/"Hide" to toggle visibility.

**UUID Generator**
1. Choose a version (v4 random, or v7 time-ordered) and click "Generate".
2. Pick an output format (standard, no dashes, uppercase, URN, braces) and click "Copy".
3. Paste any UUID into "Validate a UUID" to see its version, variant, and (for v1/v7) embedded timestamp.

**Base64 / URL Codec**
1. Type or paste text.
2. Choose an operation (Base64 encode/decode, URL encode/decode) and click "Convert".
3. A diverging bar shows the input/output byte-size comparison.

**JWT Decoder**
1. Paste a JWT.
2. Click "Decode" to see its header and payload (and expiry, if present). The signature is not verified — this is a client-side inspection tool only.
