import { HttpClient, HttpXhrBackend } from "@ngify/http";
import { setupConfig } from "@ngify/http";
import { Observable, catchError } from "rxjs";
import { Logger } from "aethon-arion-core";
import { API, APIRequest, APIRequestOptions, HttpMethod } from "aethon-api-types";

const XMLHttpRequest = require("xhr2");

export class Api {
    private _name: string = "API";
    private _http: HttpClient;
    private _api: API;
    private _logger: Logger;

    constructor(api: API, logger: Logger) {
        this._api = api;
        setupConfig({
            backend: new HttpXhrBackend(() => new XMLHttpRequest())
        });
        this._http = new HttpClient();
        this._logger = logger;
    }

    request$(operationId: string, options: APIRequestOptions): Observable<any> {
        const request: APIRequest | undefined = this._api.getRequest(operationId, options);
        let json$: Observable<any> = new Observable<any>();
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
            }
        }

        return json$.pipe(
            catchError((error, caught) => {
                this._handleError(error);
                return caught;
            })
        );
    }

    private _get$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.get(request.getURL(), request.options?.query);
    }

    private _post$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.post(request.getURL(), request.options?.body, {});
    }

    private _delete$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.delete(request.getURL(), {});
    }

    private _patch$(request: APIRequest): Observable<ArrayBuffer> {
        return this._http.patch(request.getURL(), request.options?.body);
    }

    private _handleError(error: any) {
        const data: any = error;
        const message: string = error.message;
        delete data?.error;
        this._logger.error({ sourceObject: this._name, message: message, data: data });
    }
}
