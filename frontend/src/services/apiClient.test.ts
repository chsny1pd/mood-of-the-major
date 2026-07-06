import axios, { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage, getApiFieldErrors, type ApiErrorBody } from "./apiClient";

function createAxiosError(body: ApiErrorBody, status = 422): AxiosError<ApiErrorBody> {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    data: body,
    statusText: "Error",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  });
}

describe("apiClient error helpers", () => {
  it("getApiErrorMessage returns server message", () => {
    const error = createAxiosError({
      success: false,
      error: { code: "VALIDATION_FAILED", message: "Invalid email or password." },
    });

    expect(getApiErrorMessage(error)).toBe("Invalid email or password.");
  });

  it("getApiErrorMessage falls back when response is missing", () => {
    expect(getApiErrorMessage(new Error("network"))).toBe("Something went wrong");
    expect(getApiErrorMessage(new Error("network"), "Custom fallback")).toBe("Custom fallback");
  });

  it("getApiFieldErrors maps validation details", () => {
    const error = createAxiosError({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        details: [
          { field: "email", message: "Enter a valid email" },
          { field: "password", message: "Password is too short" },
        ],
      },
    });

    expect(getApiFieldErrors(error)).toEqual({
      email: "Enter a valid email",
      password: "Password is too short",
    });
  });
});
