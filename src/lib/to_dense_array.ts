export default function toDenseArray<T>(x: T | T[]): T[] {
  return ([] as T[]).concat(x).filter((y) => y !== undefined);
}
