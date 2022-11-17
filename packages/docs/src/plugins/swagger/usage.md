# Usage

## UI

```typescript
import fs from 'fs';
import path from 'path';
import { Router } from 'routup';
import { createUIHandler } from '@routup/swagger';

const router = new Router();

const docStr = fs.readFileSync(
    path.resolve(__dirname, '..', 'test', 'data', 'swagger.json'),
    {
        encoding: 'utf-8',
    }
);
const doc = JSON.parse(docStr);

router.use('/docs', createUIHandler(doc));

router.listen(3000);
```
