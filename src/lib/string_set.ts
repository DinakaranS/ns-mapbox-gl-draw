export default class StringSet {
  private _items: Record<string, number> = {};
  private _nums: Record<string, number> = {};
  private _length = 0;

  constructor(items?: (string | number)[]) {
    if (!items) return;
    this._length = items.length;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item === undefined) continue;
      if (typeof item === 'string') this._items[item] = i;
      else this._nums[item] = i;
    }
  }

  add(x: string | number): this {
    if (this.has(x)) return this;
    this._length++;
    if (typeof x === 'string') this._items[x] = this._length;
    else this._nums[x] = this._length;
    return this;
  }

  delete(x: string | number): this {
    if (!this.has(x)) return this;
    this._length--;
    delete this._items[x];
    delete this._nums[x];
    return this;
  }

  has(x: string | number): boolean {
    if (typeof x !== 'string' && typeof x !== 'number') return false;
    return this._items[x] !== undefined || this._nums[x] !== undefined;
  }

  values(): string[] {
    const values: { k: string | number; v: number }[] = [];
    Object.keys(this._items).forEach((k) => {
      values.push({ k, v: this._items[k] });
    });
    Object.keys(this._nums).forEach((k) => {
      values.push({ k: JSON.parse(k), v: this._nums[k] });
    });
    return values.sort((a, b) => a.v - b.v).map((a) => String(a.k));
  }

  clear(): this {
    this._length = 0;
    this._items = {};
    this._nums = {};
    return this;
  }
}
