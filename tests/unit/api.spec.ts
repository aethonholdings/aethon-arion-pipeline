import { Api } from "../../src/classes/api/api.class";
import { Logger } from "aethon-arion-core";
import { API, APIRequestOptions } from "aethon-api-types";
import { of, throwError as rxjsThrowError } from "rxjs";

describe("Api", () => {
    let api: Api;
    let mockLogger: Logger;
    let mockAPI: API;

    beforeEach(() => {
        mockLogger = {
            error: jasmine.createSpy("error"),
            trace: jasmine.createSpy("trace"),
            info: jasmine.createSpy("info")
        } as unknown as Logger;

        mockAPI = {
            getRequest: jasmine.createSpy("getRequest")
        } as unknown as API;

        api = new Api(mockAPI, mockLogger);
    });

    describe("Bug Fix: Missing null check on error.message", () => {
        it("should handle errors without message property", (done) => {
            const errorWithoutMessage = { statusCode: 500 };

            // Mock a failed request
            (mockAPI.getRequest as jasmine.Spy).and.returnValue(undefined);

            api.request$("testOperation", {} as APIRequestOptions).subscribe({
                error: () => {
                    // Error should be logged with "Unknown error" message
                    expect(mockLogger.error).toHaveBeenCalledWith(
                        jasmine.objectContaining({
                            message: jasmine.stringContaining("Invalid request")
                        })
                    );
                    done();
                }
            });
        });

        it("should use error message when available", () => {
            const errorWithMessage = new Error("Specific error message");

            // Trigger error handling directly
            (api as any)._handleError(errorWithMessage);

            expect(mockLogger.error).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    message: "Specific error message"
                })
            );
        });

        it("should use fallback message for null error", () => {
            const nullError = null;

            (api as any)._handleError(nullError);

            expect(mockLogger.error).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    message: "Unknown error"
                })
            );
        });

        it("should use fallback message for undefined error", () => {
            const undefinedError = undefined;

            (api as any)._handleError(undefinedError);

            expect(mockLogger.error).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    message: "Unknown error"
                })
            );
        });
    });

    describe("Bug Fix: Empty observable on request failure", () => {
        it("should throw error observable when request is undefined", (done) => {
            (mockAPI.getRequest as jasmine.Spy).and.returnValue(undefined);

            api.request$("invalidOperation", {} as APIRequestOptions).subscribe({
                next: () => {
                    fail("Should not emit any values");
                },
                error: (err) => {
                    expect(err).toBeDefined();
                    expect(err.message).toContain("Invalid request");
                    done();
                }
            });
        });

        it("should throw error observable for unsupported HTTP method", (done) => {
            const mockRequest = {
                endpoint: { method: "INVALID_METHOD" as any },
                getURL: () => "http://test.com",
                options: {}
            };

            (mockAPI.getRequest as jasmine.Spy).and.returnValue(mockRequest);

            api.request$("testOperation", {} as APIRequestOptions).subscribe({
                next: () => {
                    fail("Should not emit any values");
                },
                error: (err) => {
                    expect(err).toBeDefined();
                    expect(err.message).toContain("Unsupported HTTP method");
                    done();
                }
            });
        });

        it("should not hang when request is invalid", (done) => {
            (mockAPI.getRequest as jasmine.Spy).and.returnValue(undefined);

            const subscription = api.request$("invalidOp", {} as APIRequestOptions).subscribe({
                complete: () => {
                    fail("Should error, not complete");
                },
                error: () => {
                    done();
                }
            });

            // If the observable hangs, this timeout will fail the test
            setTimeout(() => {
                if (!subscription.closed) {
                    subscription.unsubscribe();
                    fail("Observable hung and did not error");
                    done();
                }
            }, 1000);
        });
    });

    describe("Request handling", () => {
        it("should handle successful requests without errors", () => {
            const mockRequest = {
                endpoint: { method: "GET" },
                getURL: () => "http://test.com",
                options: { query: {} }
            };

            (mockAPI.getRequest as jasmine.Spy).and.returnValue(mockRequest);

            expect(() => {
                api.request$("testOp", {} as APIRequestOptions);
            }).not.toThrow();
        });
    });
});
