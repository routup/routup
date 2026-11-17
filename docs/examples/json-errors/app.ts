import {
    App,
    AppError,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';

export const app = new App();

app.get('/validate', defineCoreHandler(() => {
    throw new AppError({ status: 422, message: 'Name is required' });
}));

app.get('/crash', defineCoreHandler(() => {
    throw new Error('boom');
}));

app.use(defineErrorHandler((error, event) => {
    event.response.status = error.status;

    return {
        error: {
            status: error.status,
            message: error.message,
        },
    };
}));
