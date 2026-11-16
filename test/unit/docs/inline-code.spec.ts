import { describe, expect, it } from 'vitest';
import { splitInlineCode } from '../../../docs/src/.vitepress/components/home/inline-code';

describe('docs/inline-code', () => {
    it('should split backtick spans into code segments', () => {
        expect(splitInlineCode('Await `event.next()` here')).toEqual([
            { text: 'Await ', code: false },
            { text: 'event.next()', code: true },
            { text: ' here', code: false },
        ]);
    });

    it('should return plain text as one segment', () => {
        expect(splitInlineCode('plain')).toEqual([{ text: 'plain', code: false }]);
    });

    it('should drop empty segments', () => {
        expect(splitInlineCode('`a` and `b`')).toEqual([
            { text: 'a', code: true },
            { text: ' and ', code: false },
            { text: 'b', code: true },
        ]);
    });
});
