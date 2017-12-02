# Apollo-Absinthe-Upload-Client

A network interface for Apollo that enables file-uploading to Absinthe back
ends.

## Difference between `apollo-upload-client` and `apollo-absinthe-upload-client`

Both Apollo, through
[`apollo-upload-server`](https://github.com/jaydenseric/apollo-upload-server),
and Absinthe support file-uploads through GraphQL-mutations, unfortunately, they
differ in their protocol.

## Usage

Install via yarn or npm and then use `createNetworkInterface` from the package
in the construction of your `ApolloClient`-instance.

```js
import ApolloClient from "apollo-client";
import { createNetworkInterface } from "apollo-absinthe-upload-client";

const client = new ApolloClient({
    networkInterface: createNetworkInterface({
        uri: "/graphql"
    })
});
```

### Usage with React Native

React Native is not supported out of the box, because React Native is very
liberal in what it accepts as
[files](https://github.com/facebook/react-native/blob/v0.50.3/Libraries/Network/FormData.js#L70-L82),
and because this library is designed to be as light as possible. Nevertheless,
usage with React Native is possible. All you have to do is to define a function
that checks if a value is a file that you want to upload. This function should
be passed into `createNetworkInterface` under the key `isUploadFile`.

A simple example, that checks if an object contains the required `uri`
attribute.

```ts
import {
    UploadFileType,
    createNetworkInterface
} from "apollo-absinthe-upload-client";

function isReactNativeUploadFile(value: any): value is UploadFile {
    return value && typeof value === "object" && value.uri != null;
}

createNetworkInterface({
    uri: "/graphql",
    isUploadFile: isReactNativeUploadFile
});
```

We recommend to explicitly wrap files, that you want to upload from React
Native, in a `ReactNativeFile`-class similar to the following. Only checking for
the existence of the `uri`-attribute might lead to false positives.

```ts
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

function isReactNativeUploadFile(value: any): value is UploadFile {
    return value instanceof ReactNativeFile;
}
```

### Optional dependencies

This library uses `fetch`, if you target older browsers you can polyfill both.

## License

MIT (see LICENSE)

## Acknowledgements

* @jaydenseric's
  [apollo-upload-client](https://github.com/jaydenseric/apollo-upload-client)
