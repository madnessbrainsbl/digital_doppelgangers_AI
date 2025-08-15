/**
 * Helper function to safely extract an error message from any error type
 * @param error The error to process
 * @returns A string representation of the error message
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}