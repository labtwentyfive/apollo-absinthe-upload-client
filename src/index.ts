import { HTTPFetchNetworkInterface, printAST } from "apollo-client";
import {
    NetworkInterfaceOptions,
    RequestAndOptions
} from "apollo-client/transport/networkInterface";

type UploadFile = File | ReactNativeFile;
type UploadFiles = Array<{ file: UploadFile | UploadFile[]; name: string }>;

export class ReactNativeFile {
    private uri: string;
    private type: string;
    private name: string;

    constructor(params: { uri: string; type: string; name: string }) {
        this.uri = params.uri;
        this.type = params.type;
        this.name = params.name;
    }
}

export class HTTPFetchUploadNetworkInterface extends HTTPFetchNetworkInterface {
    public fetchFromRemoteEndpoint({
        request,
        options
    }: RequestAndOptions): Promise<Response> {
        if (typeof FormData !== "undefined" && isObject(request.variables)) {
            const {
                variables,
                files
            } = extractFiles(request.variables as object);
            if (files.length > 0) {
                const formData = new FormData();
                formData.append("query", printAST(request.query));
                formData.append("variables", JSON.stringify(variables));
                files.forEach(({ name, file }) =>
                    formData.append(name, file as any)
                );

                return fetch(this._uri, {
                    body: formData,
                    method: "POST",
                    ...options
                });
            }
        }

        return super.fetchFromRemoteEndpoint({ request, options });
    }
}

export function createNetworkInterface(
    options: NetworkInterfaceOptions
): HTTPFetchUploadNetworkInterface {
    return new HTTPFetchUploadNetworkInterface(options.uri, options.opts);
}

function extractFiles(
    variables: object
): { variables: object; files: UploadFiles } {
    const files: UploadFiles = [];
    const walkTree = (tree: object, path: string[] = []): object => {
        const mapped = { ...tree };
        for (const [key, value] of Object.entries(mapped)) {
            if (isUploadFile(value) || isFileList(value)) {
                const name = [...path, key].join(".");
                const file = isFileList(value)
                    ? Array.from(value as FileList)
                    : value as UploadFile;

                files.push({ file, name });
                mapped[key] = name;
            } else if (isObject(value)) {
                mapped[key] = walkTree(value, [...path, key]);
            }
        }
        return mapped;
    };

    return {
        files,
        variables: walkTree(variables)
    };
}

function isObject(value: any) {
    return value !== null && typeof value === "object";
}

function isUploadFile(value: any) {
    return (
        (typeof File !== "undefined" && value instanceof File) ||
        value instanceof ReactNativeFile
    );
}

function isFileList(value: any) {
    return typeof FileList !== "undefined" && value instanceof FileList;
}
