import assert from 'assert'

export type RawValue = string | number | BigInt | null | boolean | Record<string, unknown>

export class ValueObject<V> {
  constructor(readonly value: V) {
    this.value = value

    if (typeof this.value === 'object') {
      Object.freeze(this.value)
    }

    this.checkIfEmpty()
    this.validate()
  }

  public static fromRaw(value: any): any {
    return new this(value)
  }

  toRaw(): RawValue {
    return this.value as RawValue
  }

  equal(object: ValueObject<V>): boolean {
    return this.value === object.value
  }

  isNullable(): boolean {
    return this.value === null
  }

  protected checkIfEmpty() {
    assert.ok(this.isEmpty(this.value), `Empty value`)
  }

  protected isEmpty(value: unknown): boolean {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return false
    }

    if (typeof value === 'undefined' || value === null) {
      return true
    }

    if (value instanceof Date) {
      return false
    }

    if (value instanceof Object && !Object.keys(value).length) {
      return true
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return true
      }

      if (value.every((item) => this.isEmpty(item))) {
        return true
      }
    }

    if (value === '') {
      return true
    }

    return false
  }

  protected validate() {}
}
