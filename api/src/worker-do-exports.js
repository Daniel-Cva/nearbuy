/**
 * worker-do-exports.js
 *
 * Cloudflare adapter-cloudflare requires Durable Object classes to be
 * re-exported from the worker's main entry point.
 *
 * The adapter merges this file automatically via the "durable_objects"
 * binding in wrangler.jsonc — however we also place it here as a
 * dedicated export shim that the adapter can pick up.
 *
 * See: https://developers.cloudflare.com/durable-objects/get-started/
 */
export { CollabTracker } from '$lib/server/CollabTracker.js';
