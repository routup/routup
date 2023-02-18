<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><% title %></title>
    <base href="<% baseHref %>" />
    <link rel="stylesheet" type="text/css" href="./swagger-ui.css" >
    <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *,
        *:before,
        *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }

        .swagger-ui .topbar {
            display: none;
        }
    </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="./swagger-ui-bundle.js"> </script>
<script src="./swagger-ui-standalone-preset.js"> </script>
<script>
    window.onload = function() {
        // Build a system
        let url = window.location.search.match(/url=([^&]+)/);
        if (url && url.length > 1) {
            url = decodeURIComponent(url[1]);
        } else {
            url = window.location.origin;
        }

        <% swaggerOptions %>

        const oauth = options.oauth;
        const authAction = options.authAction;

        delete options.oauth;
        delete options.authAction;

        const swaggerOptions = {
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
        }

        const keys = Object.keys(options);
        for (let i=0; i<keys.length; i++) {
            swaggerOptions[keys[i]] = options[keys[i]];
        }

        if(typeof swaggerOptions.url === 'undefined') {
            swaggerOptions.url = url;
        }

        const ui = SwaggerUIBundle(swaggerOptions);

        if (oauth) {
            ui.initOAuth(oauth)
        }

        if (authAction) {
            ui.authActions.authorize(authAction)
        }

        window.ui = ui
    }
</script>
</body>
</html>
