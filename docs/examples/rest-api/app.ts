import { App, AppError, defineCoreHandler } from 'routup';
import type { IAppEvent } from 'routup';
import { body, readRequestBody } from '@routup/body';

type Todo = {
    id: number,
    title: string,
    done: boolean,
};

const todos = new Map<number, Todo>();
let nextId = 1;

function findTodo(event: IAppEvent): Todo {
    const id = Number(event.params.id);
    const todo = todos.get(id);

    if (!todo) {
        throw new AppError({ status: 404, message: `Todo ${event.params.id} not found` });
    }

    return todo;
}

export const app = new App();

app.use(body());

app.get('/todos', defineCoreHandler(() => todos.values().toArray()));

app.post('/todos', defineCoreHandler(async (event) => {
    const { title } = await readRequestBody(event);
    const todo: Todo = {
        id: nextId++,
        title,
        done: false,
    };

    todos.set(todo.id, todo);

    event.response.status = 201;

    return todo;
}));

app.get('/todos/:id', defineCoreHandler((event) => findTodo(event)));

app.patch('/todos/:id', defineCoreHandler(async (event) => {
    const todo = findTodo(event);
    const { title, done } = await readRequestBody(event);

    if (typeof title === 'string') {
        todo.title = title;
    }

    if (typeof done === 'boolean') {
        todo.done = done;
    }

    return todo;
}));

app.delete('/todos/:id', defineCoreHandler((event) => {
    todos.delete(findTodo(event).id);

    event.response.status = 204;

    return null;
}));
