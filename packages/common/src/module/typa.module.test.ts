/* eslint-disable max-classes-per-file */

import { Module }                from '@nestjs/common'
import { Test }                  from '@nestjs/testing'

import { ChildrenModulesConfig } from './children-modules.config'
import { TYPA_MODULE_OPTIONS }   from './typa.constants'
import { TypaModule }            from './typa.module'
import { TypaModuleOptions }     from './type-module-options.interface'

describe('typa', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [TypaModule.register()],
      }).compile()

      expect(module.get(TYPA_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(ChildrenModulesConfig)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaModule.registerAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(ChildrenModulesConfig)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestTypaModuleOptions {
        createTypaOptions(): TypaModuleOptions {
          return {}
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaModule.registerAsync({
            useClass: TestTypaModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(ChildrenModulesConfig)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestTypaModuleOptions {
        createTypaOptions(): TypaModuleOptions {
          return {}
        }
      }

      @Module({})
      class TestTypaModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaModule.registerAsync({
            imports: [
              {
                module: TestTypaModule,
                providers: [TestTypaModuleOptions],
                exports: [TestTypaModuleOptions],
              },
            ],
            useExisting: TestTypaModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(ChildrenModulesConfig)).toBeDefined()
    })
  })
})
