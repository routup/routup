export const RouterSymbol = Symbol.for('Router');

export enum RouterPipelineStep {
    START = 'start',
    LOOKUP = 'lookup',
    CHILD_BEFORE = 'childBefore',
    CHILD_DISPATCH = 'childDispatch',
    CHILD_AFTER = 'childAfter',
    FINISH = 'finish',
}
