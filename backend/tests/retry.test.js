import { describe, expect, it, vi } from "vitest";
import { retry } from "../src/utils/retry.js";

describe("retry", () => {
  it("retries transient failures with bounded backoff", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("busy"), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error("busy"), { status: 503 }))
      .mockResolvedValue("ok");

    const result = await retry(operation, {
      baseDelayMs: 1,
      maxDelayMs: 2,
      sleep: async () => {},
      shouldRetry: (error) => error.status === 503,
    });

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("stops when an error is not retryable", async () => {
    const error = new Error("bad request");
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      retry(operation, {
        sleep: async () => {},
        shouldRetry: () => false,
      })
    ).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
