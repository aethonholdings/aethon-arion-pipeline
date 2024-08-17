import { HttpClient, HttpErrorResponse, HttpXhrBackend } from "@ngify/http";
import { setupConfig } from "@ngify/http";
import { Observable, catchError } from "rxjs";
import { Endpoint, EndpointOptions, Environment } from "../interfaces/pipeline.interfaces.http";
import { Logger } from "aethon-arion-core";

var XMLHttpRequest = require("xhr2");

export class Api {
    private _name: string = "API";
    private _http: HttpClient;
    private _environment: Environment;
    private _baseUrl: string;
    private _logger: Logger;

    constructor(environment: Environment, logger: Logger) {
        this._environment = environment;
        this._baseUrl = this._environment.hostname;
        if (this._environment?.port) this._baseUrl = this._baseUrl + ":" + this._environment.port;
        setupConfig({
            backend: new HttpXhrBackend(() => new XMLHttpRequest())
        });
        this._http = new HttpClient();
        this._logger = logger;
    }

    request$(endpoint: Endpoint): Observable<any> {
        let json$: Observable<any> = new Observable<any>();
        let url: string = this._baseUrl + endpoint.path;
        switch (endpoint.method) {
            case "GET":
                json$ = this._get$(url, endpoint.options);
                break;
            case "POST":
                json$ = this._post$(url, endpoint.options);
                break;
            case "PATCH":
                json$ = this._patch$(url, endpoint.options);
                break;
            case "DELETE":
                json$ = this._delete$(url, endpoint.options);
                break;
        }
        return json$.pipe(
            catchError((error, caught) => {
                this._handleError(error);
                return caught;
            })
        );
    }

    private _get$(url: string, options: EndpointOptions | null) {
        if (options?.id) url = url + "/" + options?.id;
        const queryParams: any = {};
        if (options?.params) queryParams.params = options.params;
        if (options?.query) queryParams.query = options.query;
        return this._http.get(url, queryParams);
    }

    private _post$(url: string, options: EndpointOptions | null) {
        return this._http.post(url, options?.body, {});
    }

    private _delete$(url: string, options: EndpointOptions | null) {
        if (options?.id) url = url + "/" + options?.id;
        return this._http.delete(url, {});
    }

    private _patch$(url: string, options: EndpointOptions | null) {
        if (options?.id) url = url + "/" + options?.id;
        return this._http.patch(url, options?.body, {});
    }

    private _handleError(error: any) {
        let message: string;
        let data: any;
        message = error.message;
        data = error;
        delete data?.error;
        
        this._logger.error({ sourceObject: this._name, message: message, data: data});
    }
}
