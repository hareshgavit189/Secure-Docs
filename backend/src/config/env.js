/**
 * Centralized environment variable config with validation.
 * Import this instead of reading process.env directly throughout the app.
 */
export const config = {
  port:            parseInt(process.env.PORT || '5001', 10),
  mongodbUri:      process.env.MONGODB_URI || '',
  mongodbLocalUri: process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/securedocs',
  jwtSecret:       process.env.JWT_SECRET || 'securedocs_sih_2026_super_secret_jwt_key_987654321',
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

  if (!process.env.MONGODB_URI) {
    warnings.push('⚠️  MONGODB_URI not set — will try local MongoDB at ' + config.mongodbLocalUri);
  }
  if (!process.env.JWT_SECRET) {
    warnings.push('⚠️  JWT_SECRET not set — using insecure default. Set a strong secret in production!');
  }
  if (config.isProduction && !process.env.MONGODB_URI) {
    warnings.push('🔴 CRITICAL: Running in production without MONGODB_URI — set this in your hosting env vars!');
  }

  if (warnings.length > 0) {
    console.warn('\n' + warnings.join('\n') + '\n');
  }
}
