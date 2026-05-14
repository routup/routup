export const AppSymbol = Symbol.for('App');

export const AppPipelineStep = {
    START: 0,
    LOOKUP: 1,
    CHILD_BEFORE: 2,
    CHILD_DISPATCH: 3,
    CHILD_AFTER: 4,
    FINISH: 5,
} as const;

export type AppPipelineStep = typeof AppPipelineStep[keyof typeof AppPipelineStep];

export const AppStackEntryType = {
    APP: 'app',
    HANDLER: 'handler',
} as const;


export type AppStackEntryType = typeof AppStackEntryType[keyof typeof AppStackEntryType];
