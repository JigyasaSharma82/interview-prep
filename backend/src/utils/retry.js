const defaultSleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function retry(
  operation,
  {
    retries = 3,
    baseDelayMs = 250,
    maxDelayMs = 4000,
    shouldRetry = () => true,
    sleep = defaultSleep,
  } = {}
) {
  let attempt = 0;

  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      const exponentialDelay = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** attempt
      );
      const jitter = exponentialDelay * (0.5 + Math.random() * 0.5);

      await sleep(jitter);
      attempt += 1;
    }
  }
}
