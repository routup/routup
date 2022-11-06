# Routing

**Routing** refers to the process of determining how an application should respond to an incoming client request on a particular endpoint, 
which is identified by a URI (or path) and a HTTP method (GET, POST, ...).

Each endpoint aka path can have one or more handler functions, which are executed when the route (& method) is matched.

A route definition has the following structure:

```
router.METHOD(PATH, HANDLER)
```
Where: 
- **router** represents a router instance
- **METHOD** the HTTP method (get, post, ...) in lowercase or the `use` method to respond to any HTTP method.
- **PATH** defines the endpoint and the mount path of the handler
- **HANDLER** is a function, which is executed when the route matches

Routing methods can have **more** than one callback function as argument. In this case it is important, that if a callback
function will not handle the request, it should pass the task to the next callback function in the chain, by calling the **next()**
function argument of a handler.

