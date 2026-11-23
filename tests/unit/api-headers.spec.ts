import * as http from "http";
import { AddressInfo } from "net";
import { lastValueFrom } from "rxjs";
import { Logger } from "aethon-arion-core";
import { API } from "aethon-api-types";
import { Api } from "../../src/classes/api/api.class";

/** Default headers set with Api.setHeader reach the server on every HTTP method. */
describe("Api headers", () => {
    let server: http.Server;
    let received: { method: string; headers: http.IncomingHttpHeaders }[];
    let api: Api;

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            received.push({ method: req.method as string, headers: req.headers });
            req.resume();
            req.on("end", () => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, payload: {} }));
            });
        });
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
        const port = (server.address() as AddressInfo).port;
        const spec = {
            paths: {
                "/thing": { get: { operationId: "get" }, post: { operationId: "post" } },
                "/thing/{id}": { patch: { operationId: "patch" }, delete: { operationId: "delete" } }
            }
        };
        api = new Api(new API("http", "127.0.0.1", spec, port, ""), new Logger());
    });

    beforeEach(() => (received = []));
    afterAll(() => server.close());

    it("sends a default header with GET, POST, PATCH and DELETE", async () => {
        api.setHeader("Authorization", "Bearer secret");
        await lastValueFrom(api.request$("get", { query: { a: 1 } }));
        await lastValueFrom(api.request$("post", { body: { b: 2 } }));
        await lastValueFrom(api.request$("patch", { params: { id: 1 }, body: { c: 3 } }));
        await lastValueFrom(api.request$("delete", { params: { id: 1 } }));
        expect(received.map((r) => r.method)).toEqual(["GET", "POST", "PATCH", "DELETE"]);
        for (const r of received) expect(r.headers["authorization"]).toBe("Bearer secret");
    });

    it("lets a request override a default header, and removes a header set to null", async () => {
        api.setHeader("Authorization", "Bearer secret");
        await lastValueFrom(api.request$("get", { headers: { Authorization: "Bearer other" } }));
        api.setHeader("Authorization", null);
        await lastValueFrom(api.request$("get", {}));
        expect(received[0].headers["authorization"]).toBe("Bearer other");
        expect(received[1].headers["authorization"]).toBeUndefined();
        expect(api.getHeaders()).toEqual({});
    });
});
