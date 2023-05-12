# Plugins

According to the fact that routup is a minimalistic framework, it depends on plugins to cover some
typically http framework functions, which are not integrated in the main package.

| Name                                               | Description                                                            |
|----------------------------------------------------|------------------------------------------------------------------------|
| [body](./../plugins/body/)                         | Read and parse the request body.                                       |
| [cookie](./../plugins/cookie/)                     | Read and parse request cookies and serialize cookies for the response. |
| [decorators](./../plugins/decorators/)             | Create request handlers with class-, method- & parameter-decorators.   |
| [prometheus](./../plugins/prometheus/)             | Collect and serve metrics for prometheus.                              |
| [query](./../plugins/query/)                       | Read and parse the query string of the request url.                    |
| [rate-limit](./../plugins/rate-limit/)             | Rate limit incoming requests.                                          |
| [rate-limit-redis](./../plugins/rate-limit-redis/) | Redis adapter for the rate-limit plugin.                               |
| [static](./../plugins/static/)                     | Serve static files from a directory.                                   |
| [swagger](./../plugins/swagger/)                   | Serve generated docs from URL or based on a JSON file.                 |
