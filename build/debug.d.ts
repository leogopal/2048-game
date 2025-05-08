/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/calculateMoveScore
 * @param value `i32`
 * @returns `i32`
 */
export declare function calculateMoveScore(value: number): number;
/**
 * assembly/index/isValidMove
 * @param board `~lib/typedarray/Int32Array`
 * @param size `i32`
 * @param direction `i32`
 * @returns `bool`
 */
export declare function isValidMove(board: Int32Array, size: number, direction: number): boolean;
/**
 * assembly/index/performMove
 * @param board `~lib/typedarray/Int32Array`
 * @param size `i32`
 * @param direction `i32`
 * @returns `bool`
 */
export declare function performMove(board: Int32Array, size: number, direction: number): boolean;
/**
 * assembly/index/getAIHint
 * @param board `~lib/typedarray/Int32Array`
 * @param size `i32`
 * @returns `i32`
 */
export declare function getAIHint(board: Int32Array, size: number): number;
