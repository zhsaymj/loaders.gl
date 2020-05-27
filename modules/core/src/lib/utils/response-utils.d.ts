/**
 * Returns a Response object
 * Adds content-length header when possible
 *
 * @param resource
 */
export function makeResponse(resource: any): Response;

/**
 * Checks response status (async) and throws a helpful error message if status is not OK.
 * @param response
 */
export function checkResponse(response: Response): Promise<void>;

/**
 * Extracts helpful error message from a response (async).
 * Includes HTTP error code, something from the text/json, and URL.
 */
export function getResponseError(response: Response): Promise<string>;
