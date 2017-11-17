import { HTTPFetchNetworkInterface, printAST } from "apollo-client";
import {
    NetworkInterfaceOptions,
    RequestAndOptions
} from "apollo-client/transport/networkInterface";

interface IReactNativeFile {
    uri: string;
}

type UploadFile = File | IReactNativeFile;
type UploadFiles = Array<{ file: UploadFile | UploadFile[]; name: string }>;

export class HTTPFetchUploadNetworkInterface extends HTTPFetchNetworkInterface {
    public fetchFromRemoteEndpoint({
        request,
        options
    }: RequestAndOptions): Promise<Response> {
        if (typeof FormData !== "undefined" && isObject(request.variables)) {
            const { variables, files } = extractFiles(
                request.variables as object
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
    options: NetworkInterfaceOptions
): HTTPFetchUploadNetworkInterface {
    return new HTTPFetchUploadNetworkInterface(options.uri, options.opts);
}

function extractFiles(
    variables: object
): { variables: object; files: UploadFiles } {
    const files: UploadFiles = [];
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
                    ? [...value]
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

function isUploadFile(value: any): value is UploadFile {
    return (
        (typeof File !== "undefined" && value instanceof File) ||
        // React Native treats any object that has a URI attribute as a file, see
        // https://github.com/facebook/react-native/blob/v0.50.3/Libraries/Network/FormData.js#L70-L82
        // for more details
        (value && typeof value === "object" && value.uri != null)
    );
}

function isFileList(value: any): value is FileList {
    return typeof FileList !== "undefined" && value instanceof FileList;
}
