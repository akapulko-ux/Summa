import { ZodError } from "zod";

export function zValidationErrorToMessage(error: ZodError): string {
  return error.errors
    .map((err) => {
      const field = err.path.join(".");
      return `${field ? field + ": " : ""}${err.message}`;
    })
    .join(", ");
}
