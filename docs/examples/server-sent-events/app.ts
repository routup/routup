import { App, createEventStream, defineCoreHandler } from 'routup';

export const app = new App();

app.get('/events', defineCoreHandler((event) => {
    const stream = createEventStream(event);

    stream.write({
        id: '1',
        event: 'tick',
        data: 'one',
    });
    stream.write({
        id: '2',
        event: 'tick',
        data: 'two',
    });
    stream.write({
        id: '3',
        event: 'tick',
        data: 'three',
    });
    stream.end();

    return stream.response;
}));
