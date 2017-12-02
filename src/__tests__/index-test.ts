import { printAST } from "apollo-client";
import { parse } from "graphql";
import {
    HTTPFetchUploadNetworkInterface,
    UploadFileType,
    createNetworkInterface
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
    const { fetch } = window;
    let fetchMock: jest.Mock<typeof fetch>;

    let networkInterface: HTTPFetchUploadNetworkInterface;

    const query = parse(`
        mutation Test($file: Upload!) {
            test(file: $file) {
                id
            }
        }
    `);

    beforeEach(() => {
        networkInterface = createNetworkInterface({ uri: "/graphql" });

        fetchMock = jest.fn();
        window.fetch = fetchMock;
    });

    afterAll(() => {
        window.fetch = fetch;
    });

    test("sending a file to the server", () => {
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
    });

    test("sending a ReactNative-file to the server", () => {
        class ReactNativeFile {
            public name: string;
            public uri: string;
            public type: string;

            constructor({ name, uri, type }) {
                this.name = name;
                this.uri = uri;
                this.type = type;
            }
        }

        function isReactNativeUploadFile(value: any): value is UploadFileType {
            return value instanceof ReactNativeFile;
        }

        const file = new ReactNativeFile({
            name: "some name",
            type: "image/png",
            uri: "/some/uri"
        });

        networkInterface = createNetworkInterface({
            uri: "/graphql",
            isUploadFile: isReactNativeUploadFile
        });

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
        expect(body.get("file")).toBe(String(file));
    });

    describe("fallbacks to super", () => {
        const {
            fetchFromRemoteEndpoint
        } = HTTPFetchUploadNetworkInterface.prototype.constructor.prototype;
        const requestAndOptions = { request: {} as Request, options: {} };
        // tslint:disable-next-line:ban-types
        let fetchFromRemoteEndpointMock: jest.Mock<
            typeof fetchFromRemoteEndpoint
        >;

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

        test("falls back to the parents `fetchFromRemoteEndpoint` if no files are attached", () => {
            expect(fetchFromRemoteEndpointMock).not.toBeCalled();
            networkInterface.fetchFromRemoteEndpoint({
                options: {},
                request: { variables: { test: "test" } }
            });
            expect(fetchFromRemoteEndpointMock).toBeCalled();
        });
    });
});
