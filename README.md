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
import ApolloClient from 'apollo-client'
import { createNetworkInterface } from 'apollo-absinthe-upload-client'

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: '/graphql'
  })
})
```

### Optional dependencies

This library uses `fetch`, if you target older browsers you can polyfill both.

## License

MIT (see LICENSE)

## Acknowledgements

* @jaydenseric's
  [apollo-upload-client](https://github.com/jaydenseric/apollo-upload-client)
