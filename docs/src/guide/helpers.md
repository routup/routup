# Helpers

A "helper" is a function that allows logic to be encapsulated and reused in different places.

They exist to transform and interact with the incoming [request](../api/request-helpers.md) and 
manipulate the [response](../api/response-helpers.md) upstream. For example, 
it may be necessary to access the IP address, Host, Path, etc. at different places.

The most important response composable, is properly the [send](../api/response-helpers.md#send) method, 
which sends any (optional) data to client and terminates the request on completion.
