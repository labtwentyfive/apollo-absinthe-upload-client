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
