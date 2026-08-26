export default function stringSetsAreEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}
