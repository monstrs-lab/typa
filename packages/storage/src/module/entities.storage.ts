import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type'

export class EntitiesStorage {
  private static readonly storage = new Set<EntityClassOrSchema>()

  static addEntities(
    entities: Array<EntityClassOrSchema> | { [key: string]: EntityClassOrSchema }
  ) {
    ;(Array.isArray(entities) ? entities : Object.values(entities)).forEach((entity) => {
      this.storage.add(entity)
    })
  }

  static hasEntities() {
    return this.storage.size > 0
  }

  static getEntities() {
    return Array.from(this.storage)
  }
}
