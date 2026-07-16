import { AxiosError } from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const status = error.response?.status;

    if (status === 422) {
      if (data?.detail && Array.isArray(data.detail)) {
        return data.detail
          .map((e: { loc?: string[]; msg?: string }) => {
            const field = e.loc?.slice(-1)[0] || "field";
            return `${field}: ${e.msg}`;
          })
          .join(", ");
      }
      return "Some fields are invalid. Please check your input.";
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (status === 400) return data?.detail || "Invalid request";
    if (status === 401) return "Session expired. Please log in again.";
    if (status === 403) return "You don't have permission to perform this action.";
    if (status === 404) return "The requested resource was not found.";
    if (status === 409) return data?.detail || "A conflict occurred.";
    if (status && status >= 500) return "Server error. Please try again later.";
  }

  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
