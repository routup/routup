import type { Router } from '../../router';
import { dispatchWebRequest } from './dispatch';

export function createWebListener(router: Router) {
    return async (request: Request) => {
        await dispatchWebRequest(router, request);
    };
}
