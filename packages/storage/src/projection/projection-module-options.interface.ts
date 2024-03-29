import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type'

export interface ProjectionModuleOptions {
  migrations?: Array<string | Function> | { [key: string]: string | Function }
  entities?: Array<EntityClassOrSchema> | { [key: string]: EntityClassOrSchema }
}
