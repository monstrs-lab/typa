export class MigrationsStorage {
  private static readonly storage = new Set<string | Function>()

  static addMigrations(
    migrations: Array<string | Function> | { [key: string]: string | Function }
  ) {
    ;(Array.isArray(migrations) ? migrations : Object.values(migrations)).forEach((migration) => {
      this.storage.add(migration)
    })
  }

  static hasMigrations() {
    return this.storage.size > 0
  }

  static getMigrations() {
    return Array.from(this.storage)
  }
}
