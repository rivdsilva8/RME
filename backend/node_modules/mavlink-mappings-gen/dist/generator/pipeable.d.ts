/**
 * A pipeable object definition
 */
export interface Pipeable<I> {
    pipe<O>(transform: (input: I) => O): O & Pipeable<O>;
}
/**
 * Construction of Pipeable object
 */
export declare function pipeable<I>(input: I): I & Pipeable<I>;
