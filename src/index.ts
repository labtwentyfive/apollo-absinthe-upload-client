import { HTTPFetchNetworkInterface, printAST } from "apollo-client";
import {
    NetworkInterfaceOptions,
    RequestAndOptions
} from "apollo-client/transport/networkInterface";

type Files = Array<{ file: File | File[]; name: string }>;

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

function extractFiles(variables: object): { variables: object; files: Files } {
    const files: Files = [];
    const walkTree = (tree: any, path: string[] = []): object => {
        const mapped = isArray(tree) ? [...tree] : { ...tree };
        for (const [key, value] of Object.entries(mapped)) {
            if (isFile(value) || isFileList(value)) {
                const name = [...path, key].join(".");
                const file = isFileList(value)
                    ? Array.from(value as FileList)
                    : value as File;

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

function isArray(value: any) {
    return value !== null && value instanceof Array;
}

function isObject(value: any) {
    return value !== null && typeof value === "object";
}

function isFile(value: any) {
    return typeof File !== "undefined" && value instanceof File;
}

function isFileList(value: any) {
    return typeof FileList !== "undefined" && value instanceof FileList;
}
