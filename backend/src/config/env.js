/**
 * Centralized environment variable config with validation.
 * Import this instead of reading process.env directly throughout the app.
 *
 * Security note: config.hmacSecret is used only server-side in integrity.js.
 * It is NEVER returned to the frontend or stored in MongoDB.
 */
export const config = {
  port:            parseInt(process.env.PORT || '5001', 10),
  mongodbUri:      process.env.MONGODB_URI || '',
  mongodbLocalUri: process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/securedocs',
  jwtSecret:       process.env.JWT_SECRET || 'securedocs_sih_2026_super_secret_jwt_key_987654321',
  hmacSecret:      process.env.DOCUMENT_HMAC_SECRET || '',
  nodeEnv:         process.env.NODE_ENV || 'development',
  isProduction:    process.env.NODE_ENV === 'production',
  corsOrigin:      (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
                     .split(',').map(s => s.trim()),
};

/**
 * Validate environment on startup and print helpful warnings.
 */
export function validateEnv() {
  const warnings = [];
  const errors   = [];

  if (!process.env.MONGODB_URI) {
    warnings.push('⚠️  MONGODB_URI not set — will try local MongoDB at ' + config.mongodbLocalUri);
  }
  if (!process.env.JWT_SECRET) {
    warnings.push('⚠️  JWT_SECRET not set — using insecure default. Set a strong secret in production!');
  }
  if (!process.env.DOCUMENT_HMAC_SECRET) {
    warnings.push(
      '⚠️  DOCUMENT_HMAC_SECRET not set — HMAC integrity checks will be skipped for new uploads!\n' +
      '   Generate one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  } else if (process.env.DOCUMENT_HMAC_SECRET.length < 32) {
    errors.push('🔴 DOCUMENT_HMAC_SECRET is too short (< 32 chars). Use at least 32 random characters.');
  }
  if (config.isProduction && !process.env.MONGODB_URI) {
    errors.push('🔴 CRITICAL: Running in production without MONGODB_URI!');
  }
  if (config.isProduction && !process.env.DOCUMENT_HMAC_SECRET) {
    errors.push('🔴 CRITICAL: Running in production without DOCUMENT_HMAC_SECRET!');
  }

  if (warnings.length > 0) console.warn('\n' + warnings.join('\n') + '\n');
  if (errors.length > 0)   console.error('\n' + errors.join('\n') + '\n');
}
