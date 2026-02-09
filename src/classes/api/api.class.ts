import { HttpClient, HttpXhrBackend } from "@ngify/http";
import { setupConfig } from "@ngify/http";
import { Observable, catchError, throwError } from "rxjs";
import { Logger } from "aethon-arion-core";
import { API, APIRequest, APIRequestOptions, HttpMethod } from "aethon-api-types";

const XMLHttpRequest = require("xhr2");

/**
 * HTTP client wrapper for making authenticated API requests with logging and error handling.
 *
 * @remarks
 * The Api class provides a type-safe, Observable-based interface for interacting with
 * RESTful APIs. It handles HTTP method routing, error logging, and provides consistent
 * error handling across all request types.
 *
 * **Supported HTTP Methods:**
 *
 * - **GET**: Retrieve resources
 * - **POST**: Create resources
 * - **PATCH**: Update resources
 * - **DELETE**: Remove resources
 *
 * **Error Handling Strategy:**
 *
 * All requests are wrapped in RxJS error handlers that:
 * 1. Log errors via the {@link Logger} interface
 * 2. Re-throw errors for subscriber handling
 * 3. Provide fallback error messages for malformed errors
 *
 * **Observable Pattern:**
 *
 * Returns cold observables that:
 * - Execute only when subscribed
 * - Support cancellation via unsubscribe
 * - Propagate errors to subscribers
 * - Log all errors automatically
 *
 * **Bug Fixes (v0.5.1):**
 *
 * - Fixed null check on `error.message` (now uses fallback "Unknown error")
 * - Fixed empty observable when request undefined (now throws error observable)
 * - Fixed infinite retry loop in `catchError` (now properly re-throws errors)
 *
 * @example
 * ```typescript
 * const logger = new Logger();
 * const apiConfig = new API(endpoints);
 * const api = new Api(apiConfig, logger);
 *
 * // GET request
 * api.request$("getUser", { pathParams: { id: "123" } })
 *   .subscribe({
 *     next: (data) => console.log("User:", data),
 *     error: (err) => console.error("Failed:", err.message)
 *   });
 *
 * // POST request
 * api.request$("createUser", {
 *   body: { name: "Alice", email: "alice@example.com" }
 * }).subscribe({
 *   next: (response) => console.log("Created:", response),
 *   error: (err) => console.error("Error:", err)
 * });
 *
 * // Error handling
 * api.request$("invalidOperation", {})
 *   .subscribe({
 *     error: (err) => {
 *       // Error logged automatically
 *       console.log("Caught:", err.message);
 *       // Output: "Invalid request for operationId: invalidOperation"
 *     }
 *   });
 * ```
 *
 * @public
 */
export class Api {
    /**
     * Identifier for logging purposes.
     *
     * @remarks
     * Used as the `sourceObject` field in log messages to identify
     * the origin of logged events.
     */
    private _name: string = "API";

    /**
     * HttpClient instance for making HTTP requests.
     *
     * @remarks
     * Configured with XMLHttpRequest backend for Node.js compatibility.
     */
    private _http: HttpClient;

    /**
     * API configuration containing endpoint definitions.
     *
     * @remarks
     * Provides {@link APIRequest} objects for each operation ID,
     * including URL templates, HTTP methods, and parameter schemas.
     */
    private _api: API;

    /**
     * Logger instance for error reporting.
     *
     * @remarks
     * Used to log all request errors with contextual information.
     * **Bug Fix (v0.5.1):** Now safely handles errors without `message` property.
     */
    private _logger: Logger;

    /**
     * Creates a new Api client instance.
     *
     * @param api - API configuration with endpoint definitions
     * @param logger - Logger for error reporting
     *
     * @remarks
     * Initializes the HTTP client with XMLHttpRequest backend to enable
     * HTTP requests in Node.js environments. The backend uses the `xhr2`
     * package for cross-platform compatibility.
     *
     * **Configuration:**
     *
     * The HttpClient is configured to use `xhr2` as the XMLHttpRequest
     * implementation, enabling server-side HTTP requests.
     *
     * @example
     * ```typescript
     * const logger = new Logger();
     * const apiConfig = new API({
     *   baseUrl: "https://api.example.com",
     *   endpoints: [
     *     { operationId: "getUsers", method: "GET", path: "/users" },
     *     { operationId: "createUser", method: "POST", path: "/users" }
     *   ]
     * });
     *
     * const api = new Api(apiConfig, logger);
     * ```
     */
    constructor(api: API, logger: Logger) {
        this._api = api;
        setupConfig({
            backend: new HttpXhrBackend(() => new XMLHttpRequest())
        });
        this._http = new HttpClient();
        this._logger = logger;
    }

    /**
     * Makes an HTTP request and returns an Observable of the response.
     *
     * @param operationId - Unique identifier for the API operation
     * @param options - Request parameters (path params, query params, body)
     * @returns Observable that emits the response or error
     *
     * @remarks
     * Routes the request to the appropriate HTTP method handler based on the
     * endpoint configuration. All errors are logged automatically before being
     * propagated to subscribers.
     *
     * **Request Flow:**
     *
     * 1. Resolve {@link APIRequest} from `operationId` and `options`
     * 2. Route to HTTP method handler (GET, POST, PATCH, DELETE)
     * 3. Execute HTTP request via HttpClient
     * 4. On error: Log via {@link _handleError}, then re-throw
     * 5. On success: Emit response to subscriber
     *
     * **Error Scenarios:**
     *
     * - **Invalid operationId**: Throws error observable with descriptive message
     * - **Unsupported HTTP method**: Throws error observable for unknown methods
     * - **Network error**: Catches and logs, then re-throws to subscriber
     * - **Server error**: Catches and logs, then re-throws to subscriber
     *
     * **Bug Fixes (v0.5.1):**
     *
     * - Now throws error observable when request is undefined (previously returned empty observable)
     * - Properly re-throws errors after logging (previously caused infinite retry loop)
     * - Added default case for unsupported HTTP methods
     *
     * **Complexity:** O(1) for routing, depends on network latency for execution
     *
     * @throws {Error} When operationId is invalid or HTTP method not supported
     *
     * @example
     * ```typescript
     * // GET with path params
     * api.request$("getUser", {
     *   pathParams: { id: "42" }
     * }).subscribe({
     *   next: (user) => console.log("User:", user),
     *   error: (err) => console.error("Failed:", err.message)
     * });
     *
     * // POST with body
     * api.request$("createProduct", {
     *   body: {
     *     name: "Widget",
     *     price: 29.99,
     *     category: "tools"
     *   }
     * }).subscribe({
     *   next: (product) => console.log("Created:", product.id),
     *   error: (err) => {
     *     // Error automatically logged
     *     console.error("Creation failed:", err);
     *   }
     * });
     *
     * // PATCH with query params
     * api.request$("updateStatus", {
     *   pathParams: { id: "123" },
     *   query: { status: "active" }
     * }).subscribe({
     *   next: () => console.log("Updated"),
     *   error: (err) => console.error("Update failed")
     * });
     *
     * // Handling invalid operation
     * api.request$("nonExistentOp", {})
     *   .subscribe({
     *     error: (err) => {
     *       console.log(err.message);
     *       // "Invalid request for operationId: nonExistentOp"
     *     }
     *   });
     * ```
     */
    request$(operationId: string, options: APIRequestOptions): Observable<any> {
        const request: APIRequest | undefined = this._api.getRequest(operationId, options);
        let json$: Observable<any>;
        if (request) {
            switch (request.endpoint.method) {
                case HttpMethod.GET:
                    json$ = this._get$(request);
                    break;
                case HttpMethod.POST:
                    json$ = this._post$(request);
                    break;
                case HttpMethod.PATCH:
                    json$ = this._patch$(request);
                    break;
                case HttpMethod.DELETE:
                    json$ = this._delete$(request);
                    break;
                default:
                    json$ = throwError(() => new Error(`Unsupported HTTP method: ${request.endpoint.method}`));
            }
        } else {
            json$ = throwError(() => new Error(`Invalid request for operationId: ${operationId}`));
        }

        return json$.pipe(
            catchError((error) => {
                this._handleError(error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Executes an HTTP GET request.
     *
     * @param request - API request configuration with URL and query params
     * @returns Observable that emits the response ArrayBuffer
     *
     * @remarks
     * GET requests are used to retrieve resources. Query parameters are
     * automatically URL-encoded and appended to the request URL.
     *
     * @internal
     */
    private _get$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.get(request.getURL(), request.options?.query);
    }

    /**
     * Executes an HTTP POST request.
     *
     * @param request - API request configuration with URL and body
     * @returns Observable that emits the response ArrayBuffer
     *
     * @remarks
     * POST requests are used to create new resources. The request body
     * is automatically serialized to JSON.
     *
     * @internal
     */
    private _post$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.post(request.getURL(), request.options?.body, {});
    }

    /**
     * Executes an HTTP DELETE request.
     *
     * @param request - API request configuration with URL
     * @returns Observable that emits the response ArrayBuffer
     *
     * @remarks
     * DELETE requests are used to remove resources. Typically have no
     * request body.
     *
     * @internal
     */
    private _delete$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.delete(request.getURL(), {});
    }

    /**
     * Executes an HTTP PATCH request.
     *
     * @param request - API request configuration with URL and body
     * @returns Observable that emits the response ArrayBuffer
     *
     * @remarks
     * PATCH requests are used to partially update existing resources.
     * Only the fields in the request body are modified.
     *
     * @internal
     */
    private _patch$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.patch(request.getURL(), request.options?.body);
    }

    /**
     * Logs error information for debugging and monitoring.
     *
     * @param error - Error object from failed request
     *
     * @remarks
     * Extracts error details and logs them via the {@link Logger} interface.
     * The `error.error` property is removed to avoid circular references
     * in logged data.
     *
     * **Bug Fix (v0.5.1):** Now safely handles errors without a `message`
     * property by using the fallback `"Unknown error"`.
     *
     * **Logged Fields:**
     *
     * - `sourceObject`: Always `"API"` to identify log source
     * - `message`: Error message or "Unknown error" if missing
     * - `data`: Full error object (minus `error.error` property)
     *
     * **Error Message Extraction:**
     *
     * ```
     * message = error?.message || "Unknown error"
     * ```
     *
     * This handles:
     * - Standard Error objects: `error.message` exists
     * - Network errors: May have `message` property
     * - Null/undefined: Falls back to "Unknown error"
     * - Plain objects: Falls back to "Unknown error"
     *
     * @internal
     *
     * @example
     * ```typescript
     * // Called automatically on errors:
     * // _handleError(new Error("Network timeout"));
     * // Logs:
     * // {
     * //   sourceObject: "API",
     * //   message: "Network timeout",
     * //   data: { name: "Error", stack: "..." }
     * // }
     *
     * // _handleError({ status: 404 });
     * // Logs:
     * // {
     * //   sourceObject: "API",
     * //   message: "Unknown error",
     * //   data: { status: 404 }
     * // }
     * ```
     */
    private _handleError(error: any) {
        const data: any = error;
        const message: string = error?.message || "Unknown error";
        delete data?.error;
        this._logger.error({ sourceObject: this._name, message: message, data: data });
    }
}
