export const RouterSymbol = Symbol.for('Router');

export enum RouterPipelineStep {
    START,
    LOOKUP,
    CHILD_BEFORE,
    CHILD_DISPATCH,
    CHILD_AFTER,
    FINISH,
}
