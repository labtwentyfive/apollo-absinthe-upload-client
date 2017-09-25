import { printAST } from "apollo-client";
import { parse } from "graphql";
import {
    createNetworkInterface,
    HTTPFetchUploadNetworkInterface
} from "../index";

declare global {
    // tslint:disable-next-line:interface-name
    interface Window {
        FormData?: object;
    }
}

describe("createNetworkInterface", () => {
    test("returns a new instance of HTTPFetchUploadNetworkInterface", () => {
        expect(
            createNetworkInterface({
                uri: "/graphql"
            }) instanceof HTTPFetchUploadNetworkInterface
        ).toBe(true);
    });
});

describe("HTTPFetchUploadNetworkInterface", () => {
    let networkInterface: HTTPFetchUploadNetworkInterface;

    beforeEach(() => {
        networkInterface = createNetworkInterface({
            uri: "/graphql"
        });
    });

    test("sends the data to the server using `fetch`", () => {
        const { fetch } = window;
        const fetchMock = jest.fn();
        window.fetch = fetchMock;

        const query = parse(`
            mutation Test($file: Upload!) {
                test(file: $file) {
                    id
                }
            }
        `);

        const file = new File([], "test");

        expect(fetchMock).not.toBeCalled();
        networkInterface.fetchFromRemoteEndpoint({
            options: {},
            request: {
                query,
                variables: { file }
            }
        });
        expect(fetchMock).toBeCalled();
        const { body } = fetchMock.mock.calls[0][1];
        expect(body.get("query")).toBe(printAST(query));
        expect(body.get("file")).toBe(file);
        expect(body.get("variables")).toBe(JSON.stringify({ file: "file" }));

        window.fetch = fetch;
    });

    describe("fallbacks to super", () => {
        const {
            fetchFromRemoteEndpoint
        } = HTTPFetchUploadNetworkInterface.prototype.constructor.prototype;
        const requestAndOptions = { request: {} as Request, options: {} };
        // tslint:disable-next-line:ban-types
        let fetchFromRemoteEndpointMock: Function;

        beforeEach(() => {
            fetchFromRemoteEndpointMock = jest.fn();
            HTTPFetchUploadNetworkInterface.prototype.constructor.prototype.fetchFromRemoteEndpoint = fetchFromRemoteEndpointMock;
        });

        afterAll(() => {
            HTTPFetchUploadNetworkInterface.prototype.constructor.prototype.fetchFromRemoteEndpoint = fetchFromRemoteEndpoint;
        });

        test("falls back to the parents `fetchFromRemoteEndpoint` if `FormData` is `undefined`", () => {
            const { FormData } = window;
            window.FormData = undefined;

            expect(fetchFromRemoteEndpointMock).not.toBeCalled();
            networkInterface.fetchFromRemoteEndpoint(requestAndOptions);
            expect(fetchFromRemoteEndpointMock).toBeCalled();

            window.FormData = FormData;
        });

        test("falls back to the parents `fetchFromRemoteEndpoint` if `request.variables` is not an object", () => {
            expect(fetchFromRemoteEndpointMock).not.toBeCalled();
            networkInterface.fetchFromRemoteEndpoint({
                options: {},
                request: { variables: null } as any
            });
            expect(fetchFromRemoteEndpointMock).toBeCalled();
        });

        test("falls back to the parents `fetchFromRemoteEndpoint` if no `File`s or `FileList`s are attached", () => {
            expect(fetchFromRemoteEndpointMock).not.toBeCalled();
            networkInterface.fetchFromRemoteEndpoint({
                options: {},
                request: { variables: { test: "test" } } as any
            });
            expect(fetchFromRemoteEndpointMock).toBeCalled();
        });
    });
});
