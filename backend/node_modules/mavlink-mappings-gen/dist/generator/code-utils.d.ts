declare global {
    interface String {
        replaceAll(s: string, r: string): string;
    }
}
export declare const snakeToCamel: (s: string) => string;
export declare const snakeToPascal: (s: string) => string;
/**
 * Given the message convert it to a valid class name
 *
 * @param message message to convert to class name
 * @returns class name of the given message
 */
export declare function makeClassName(message: string): string;
/**
 * Extracts type of the array
 *
 * @param type type to extract the size
 * @returns type of the array
 */
export declare function extractArrayType(type: string): string;
/**
 * Extracts the type of item of an array type
 *
 * @param type type to extract the size
 * @returns type of the array element
 */
export declare function extractArrayItemType(type: string): string;
/**
 * Extracts the size of array type
 *
 * @param type type to extract the size
 * @returns size of the array
 */
export declare function extractArraySize(type: string): number | undefined;
/**
 * Returns size in bytes of the given type
 *
 * @param type type to get the size
 * @returns number of bytes occupied by the given type
 */
export declare function getTypeSize(type: string): 1 | 2 | 4 | 8;
/**
 * Match text to the given width cutting it into multiple
 * lines if the original text's length exceeds the given
 * width
 *
 * @param s string to match
 * @param width width to match
 */
export declare function matchTextToWidth(s: string, width?: number): string[];
export declare function nameToClassName(input?: string): string;
export declare function labelToIdentifier(input: string): string;
export declare function calculateCommonPrefix(entry: {
    values: {
        source: {
            name: string;
        };
    }[];
    source: {
        name: string;
    };
}): string;
export declare function makeEnumFieldType(fieldType: string, enumName: string): string;
/**
 * Compute max length of value name for later padding values
 */
export declare function calculateMaxEnumValueNameLength(enums: {
    values: {
        name: string;
    }[];
}[]): number;
