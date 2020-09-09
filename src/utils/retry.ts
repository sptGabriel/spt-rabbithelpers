export const retry = <T>(
  operation: () => Promise<T>,
  maxRetries: number,
  waitTimeMSeconds: number
) => {
  return new Promise<T>((resolve) => {
    operation()
      .then(resolve)
      .catch((error) =>
        maxRetries > 0
          ? setTimeout(() => {
              retry(operation, maxRetries - 1, waitTimeMSeconds).then(resolve);
            }, waitTimeMSeconds)
          : Promise.reject(error)
      );
  });
};
