/**
 * Escapes special regex characters in a string to prevent ReDoS attacks.
 * Use whenever building a RegExp from user-supplied input.
 */
export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
