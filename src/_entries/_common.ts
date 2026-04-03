import type { Router } from '../router/module.ts';

export function freezeRouter(_router: Router): void {
    // Prevent route mutation after serve() — optional safety measure
    // TODO: implement in a later phase
}
