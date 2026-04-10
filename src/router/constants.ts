export const RouterSymbol = Symbol.for('Router');

export const RouterPipelineStep = {
    START: 0,
    LOOKUP: 1,
    CHILD_BEFORE: 2,
    CHILD_DISPATCH: 3,
    CHILD_AFTER: 4,
    FINISH: 5,
} as const;

export type RouterPipelineStep = typeof RouterPipelineStep[keyof typeof RouterPipelineStep];
