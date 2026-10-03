/**
 * integrity.js — HMAC-SHA-256 Document Integrity Utilities
 *
 * Security design:
 *  - SHA-256 detects accidental corruption (bit-flip, storage error).
 *  - HMAC-SHA-256 detects deliberate tampering (proves file was created by this system).
 *  - The HMAC secret lives ONLY in process.env — never in MongoDB, never in API responses.
 *  - crypto.timingSafeEqual() prevents timing-based side-channel attacks.
 *
 * Flow:
 *   UPLOAD  → computeSHA256(buffer) + computeHMAC(buffer) → store both in DB
 *   DOWNLOAD → reconstruct buffer → verifyDocumentIntegrity() → serve or block
 *   VERIFY  → uploaded file buffer → verifyDocumentIntegrity() → report result
 */

import crypto from 'node:crypto';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Get the HMAC secret from environment.
 * Throws clearly if the secret is missing so developers see the error early.
 */
function getHmacSecret() {
  const secret = process.env.DOCUMENT_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'DOCUMENT_HMAC_SECRET must be set in .env and be at least 32 characters. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a Buffer.
 * @param   {Buffer} buffer
 * @returns {string} 64-char lowercase hex
 */
export function computeSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute HMAC-SHA-256 of a Buffer using DOCUMENT_HMAC_SECRET.
 * The secret is read directly from env — NEVER passed as argument to prevent accidental logging.
 * @param   {Buffer} buffer
 * @returns {string} 64-char lowercase hex
 */
export function computeHMAC(buffer) {
  const secret = getHmacSecret();
  return crypto.createHmac('sha256', secret).update(buffer).digest('hex');
}

/**
 * Timing-safe comparison of two HMAC hex strings.
 * Prevents timing attacks where an attacker measures response time to guess bytes.
 * @param   {string} hmacA
 * @param   {string} hmacB
 * @returns {boolean}
 */
export function hmacEqual(hmacA, hmacB) {
  try {
    const bufA = Buffer.from(hmacA, 'hex');
    const bufB = Buffer.from(hmacB, 'hex');
    // Lengths must be equal for timingSafeEqual
    if (bufA.length !== 32 || bufB.length !== 32) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ─── Main Integrity Verifier ─────────────────────────────────────────────────

/**
 * Verifies a file buffer against its stored SHA-256 hash and HMAC.
 *
 * Handles two document types:
 *  - Legacy / seed documents (no hmac stored): SHA-256 check only.
 *  - New documents (hmac stored): full SHA-256 + HMAC-SHA-256 check.
 *
 * @param {Buffer} buffer       - The actual file bytes (decoded from base64 or received file)
 * @param {string} storedSHA256 - The SHA-256 stored in the DB at upload time
 * @param {string} storedHMAC   - The HMAC stored in the DB at upload time (empty for legacy)
 * @returns {{
 *   valid:         boolean,        // overall pass/fail
 *   sha256Valid:   boolean,        // was SHA-256 correct?
 *   hmacValid:     boolean|null,   // was HMAC correct? null = legacy (not checked)
 *   isLegacy:      boolean,        // true = no HMAC was stored (old data)
 *   computedSHA256: string,        // what we computed — safe to log
 *   method:        string,         // human-readable description
 * }}
 */
export function verifyDocumentIntegrity(buffer, storedSHA256, storedHMAC) {
  const computedSHA256 = computeSHA256(buffer);
  const sha256Valid     = computedSHA256 === storedSHA256;

  // ── Legacy / seed document (no HMAC stored) ──────────────────────────────
  if (!storedHMAC) {
    return {
      valid:          sha256Valid,
      sha256Valid,
      hmacValid:      null,       // N/A for legacy
      isLegacy:       true,
      computedSHA256,
      method:         'SHA-256 only (legacy document — no HMAC stored)',
    };
  }

  // ── Full HMAC verification ────────────────────────────────────────────────
  let computedHMAC;
  let hmacValid = false;
  try {
    computedHMAC = computeHMAC(buffer);
    hmacValid    = hmacEqual(computedHMAC, storedHMAC);
  } catch (err) {
    // Secret missing — treat as failure
    console.error('HMAC verification error:', err.message);
    return {
      valid:          false,
      sha256Valid,
      hmacValid:      false,
      isLegacy:       false,
      computedSHA256,
      method:         'HMAC-SHA-256 (secret unavailable — check DOCUMENT_HMAC_SECRET in .env)',
    };
  }

  return {
    valid:          sha256Valid && hmacValid,
    sha256Valid,
    hmacValid,
    isLegacy:       false,
    computedSHA256,
    method:         'SHA-256 + HMAC-SHA-256 (timingSafeEqual)',
  };
}

/**
 * Compute both SHA-256 and HMAC for a newly uploaded file.
 * Call this during upload — store results in the document record.
 *
 * @param   {Buffer} buffer
 * @returns {{ sha256: string, hmac: string }}
 */
export function computeUploadIntegrity(buffer) {
  return {
    sha256: computeSHA256(buffer),
    hmac:   computeHMAC(buffer),
  };
}

/**
 * Streaming SHA-256 and HMAC-SHA-256 calculation for disk files of any size (up to multi-GB).
 * Uses constant memory (~64 KB) by streaming chunks directly into hash digests.
 *
 * @param {string} filePath - Absolute path to file on disk
 * @returns {Promise<{ sha256: string, hmac: string }>}
 */
export function computeFileIntegrityStream(filePath) {
  return new Promise((resolve, reject) => {
    import('node:fs').then(({ createReadStream }) => {
      let hmacCalculator = null;
      try {
        const secret = getHmacSecret();
        hmacCalculator = crypto.createHmac('sha256', secret);
      } catch (err) {
        console.warn('⚠️ HMAC calculation skipped in stream:', err.message);
      }

      const shaCalculator = crypto.createHash('sha256');
      const readStream = createReadStream(filePath);

      readStream.on('data', (chunk) => {
        shaCalculator.update(chunk);
        if (hmacCalculator) hmacCalculator.update(chunk);
      });

      readStream.on('end', () => {
        resolve({
          sha256: shaCalculator.digest('hex'),
          hmac:   hmacCalculator ? hmacCalculator.digest('hex') : '',
        });
      });

      readStream.on('error', (err) => reject(err));
    });
  });
}

