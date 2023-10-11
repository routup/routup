import type { Router } from './module';

export type RouterMatch = {
    path?: string,
    type: 'router',
    element: Router
};
