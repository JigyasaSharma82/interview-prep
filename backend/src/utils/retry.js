export async function retry(operation) {
  return operation();
}
