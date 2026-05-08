import { describe, expect, it } from 'vitest';
import {
    HeaderName,
    setResponseHeaderAttachment,
    setResponseHeaderInline,
} from '../../../src';
import { createTestEvent } from '../../helpers';

function dispositionFor(filename?: string): string | null {
    const event = createTestEvent('/');
    setResponseHeaderAttachment(event, filename);
    return event.response.headers.get(HeaderName.CONTENT_DISPOSITION);
}

function inlineDispositionFor(filename?: string): string | null {
    const event = createTestEvent('/');
    setResponseHeaderInline(event, filename);
    return event.response.headers.get(HeaderName.CONTENT_DISPOSITION);
}

describe('src/helpers/response/header-disposition (jshttp/content-disposition parity)', () => {
    it('should create an attachment header without filename', () => {
        expect(dispositionFor()).toEqual('attachment');
    });

    describe('with filename', () => {
        it('should create a header with file name', () => {
            expect(dispositionFor('plans.pdf'))
                .toEqual('attachment; filename=plans.pdf');
        });

        it('should preserve a posix path', () => {
            expect(dispositionFor('/path/to/plans.pdf'))
                .toEqual('attachment; filename="/path/to/plans.pdf"');
        });

        it('should preserve a windows path', () => {
            expect(dispositionFor('\\path\\to\\plans.pdf'))
                .toEqual('attachment; filename="\\\\path\\\\to\\\\plans.pdf"');
        });

        it('should preserve a windows path with drive letter', () => {
            expect(dispositionFor('C:\\path\\to\\plans.pdf'))
                .toEqual('attachment; filename="C:\\\\path\\\\to\\\\plans.pdf"');
        });

        it('should preserve a posix path with trailing slash', () => {
            expect(dispositionFor('/path/to/plans.pdf/'))
                .toEqual('attachment; filename="/path/to/plans.pdf/"');
        });

        it('should preserve a windows path with trailing slash', () => {
            expect(dispositionFor('\\path\\to\\plans.pdf\\'))
                .toEqual('attachment; filename="\\\\path\\\\to\\\\plans.pdf\\\\"');
        });
    });

    describe('when filename is US-ASCII', () => {
        it('should only include filename parameter', () => {
            expect(dispositionFor('plans.pdf'))
                .toEqual('attachment; filename=plans.pdf');
        });

        it('should escape quotes', () => {
            expect(dispositionFor('the "plans".pdf'))
                .toEqual('attachment; filename="the \\"plans\\".pdf"');
        });
    });

    describe('when filename is not US-ASCII', () => {
        it('should include filename* parameter for ISO-8859-1', () => {
            expect(dispositionFor('«plans».pdf'))
                .toEqual('attachment; filename="?plans?.pdf"; filename*=UTF-8\'\'%C2%ABplans%C2%BB.pdf');
        });

        it('should include filename* parameter for ISO-8859-1 with quotes', () => {
            expect(dispositionFor('the "plans" (1µ).pdf'))
                .toEqual('attachment; filename="the \\"plans\\" (1?).pdf"; filename*=UTF-8\'\'the%20%22plans%22%20%281%C2%B5%29.pdf');
        });

        it('should include filename* parameter for latin characters with diacritics', () => {
            expect(dispositionFor('foo-ä.html'))
                .toEqual('attachment; filename="foo-?.html"; filename*=UTF-8\'\'foo-%C3%A4.html');
        });
    });

    describe('when filename is Unicode', () => {
        it('should include filename* parameter', () => {
            expect(dispositionFor('планы.pdf'))
                .toEqual('attachment; filename="?????.pdf"; filename*=UTF-8\'\'%D0%BF%D0%BB%D0%B0%D0%BD%D1%8B.pdf');
        });

        it('should include filename fallback', () => {
            expect(dispositionFor('£ and € rates.pdf'))
                .toEqual('attachment; filename="? and ? rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf');
            expect(dispositionFor('€ rates.pdf'))
                .toEqual('attachment; filename="? rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf');
        });

        it('should encode special characters', () => {
            expect(dispositionFor("€'*%().pdf"))
                .toEqual("attachment; filename=\"?'*%().pdf\"; filename*=UTF-8''%E2%82%AC%27%2A%25%28%29.pdf");
        });
    });

    describe('when filename contains hex escape', () => {
        it('should keep a simple filename', () => {
            expect(dispositionFor('the%20plans.pdf'))
                .toEqual("attachment; filename=the%20plans.pdf; filename*=UTF-8''the%2520plans.pdf");
        });

        it('should handle Unicode', () => {
            expect(dispositionFor('€%20£.pdf'))
                .toEqual('attachment; filename="?%20?.pdf"; filename*=UTF-8\'\'%E2%82%AC%2520%C2%A3.pdf');
        });
    });

    describe('inline', () => {
        it('should create an inline header without filename', () => {
            expect(inlineDispositionFor()).toEqual('inline');
        });

        it('should create an inline header with ASCII filename', () => {
            expect(inlineDispositionFor('plans.pdf'))
                .toEqual('inline; filename=plans.pdf');
        });

        it('should create an inline header with quoted ASCII filename', () => {
            expect(inlineDispositionFor('the "plans".pdf'))
                .toEqual('inline; filename="the \\"plans\\".pdf"');
        });

        it('should create an inline header with extended Unicode filename', () => {
            expect(inlineDispositionFor('€ rates.pdf'))
                .toEqual('inline; filename="? rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf');
        });
    });
});
