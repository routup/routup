# Plugins

According to the fact that routup is a minimalistic framework, it depends on plugins to cover some
typically http framework functions, which are not integrated in the main package.

| Name                           | Description                                                            |
|--------------------------------|------------------------------------------------------------------------|
| [body](./../plugins/body/)     | Read and parse the request body.                                       |
| [cookie](./../plugins/cookie/) | Read and parse request cookies and serialize cookies for the response. |
| [query](./../plugins/query/)   | Read and parse the query string of the request url.                    |
