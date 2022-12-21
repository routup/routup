# Usage
Create a new middleware function to serve files from within a given directory.
When a file is not found, instead of sending a 404 response, this module will instead call `next()`
to move on to the next middleware, allowing for stacking and fall-backs.

```typescript
import {Router, send} from 'routup';
import {
    createHandler
} from '@routup/static';

const router = new Router();

// serve static files of folder: public
router.use(createHandler('public'));

router.listen(3000);
```

### Multiple Directories

Sometimes it may be necessary to serve static files from multiple directories.
To accomplish this, this plugin can be used multiple times.
An example of this is shown below:

```typescript
import {Router, send} from 'routup';
import {
    createHandler
} from '@routup/static';

const router = new Router();

router.use(createHandler('public'));
router.use(createHandler('files'));

router.listen(3000);
```

This will allow to serve files from the `public` and the `files` directories.
When a request for a file is made, those in the `public` directory will be checked before those in the `files` directory.
If a file with the same name exists in both directories, the one in the `public` directory will be served.

### Mount Path

It is also possible to define a mount path for a root directory.
This is done as follows:

```typescript
import {Router, send} from 'routup';
import {
    createHandler
} from '@routup/static';

const router = new Router();

router.use('/public', createHandler('public'));

router.listen(3000);
```

With this setup, requests for files in the `public` directory must start with `/public`.

