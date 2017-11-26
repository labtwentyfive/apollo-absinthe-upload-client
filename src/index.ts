import { HTTPFetchNetworkInterface, printAST } from "apollo-client";
import {
    NetworkInterfaceOptions,
    RequestAndOptions
} from "apollo-client/transport/networkInterface";

export type UploadFileType = File;
export type IsUploadFileType = typeof isUploadFile;
export type ExtendedNetworkInterfaceAndOptionsType = NetworkInterfaceOptions & {
    isUploadFile?: IsUploadFileType;
};

type ExtractedFilesType = Array<{
    file: UploadFileType | UploadFileType[];
    name: string;
}>;

export class HTTPFetchUploadNetworkInterface extends HTTPFetchNetworkInterface {
    private isUploadFile: IsUploadFileType;

    constructor(
        uri: NetworkInterfaceOptions["uri"],
        opts: NetworkInterfaceOptions["opts"],
        isUploadFile: IsUploadFileType
    ) {
        super(uri, opts);
        this.isUploadFile = isUploadFile;
    }

    public fetchFromRemoteEndpoint({
        request,
        options
    }: RequestAndOptions): Promise<Response> {
        if (typeof FormData !== "undefined" && isObject(request.variables)) {
            const { variables, files } = extractFiles(
                request.variables as object,
                this.isUploadFile
            );
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
    options: ExtendedNetworkInterfaceAndOptionsType
): HTTPFetchUploadNetworkInterface {
    const { uri, opts } = options;
    const isUploadFileUnpacked = options.isUploadFile || isUploadFile;
    return new HTTPFetchUploadNetworkInterface(uri, opts, isUploadFileUnpacked);
}

export function isUploadFile(value: any): value is UploadFileType {
    return typeof File !== "undefined" && value instanceof File;
}

function extractFiles(
    variables: object,
    isUploadFile: IsUploadFileType
): { variables: object; files: ExtractedFilesType } {
    const files: ExtractedFilesType = [];
    const walkTree = (
        tree: any[] | object,
        path: string[] = []
    ): any[] | object => {
        const mapped = Array.isArray(tree) ? [...tree] : { ...tree };
        Object.keys(mapped).forEach(key => {
            const value = mapped[key];
            if (isUploadFile(value) || isFileList(value)) {
                const name = [...path, key].join(".");
                const file = isFileList(value)
                    ? Array.prototype.slice.call(value)
                    : value;
                files.push({ file, name });
                mapped[key] = name;
            } else if (isObject(value)) {
                mapped[key] = walkTree(value, [...path, key]);
            }
        });
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

function isFileList(value: any): value is FileList {
    return typeof FileList !== "undefined" && value instanceof FileList;
}
