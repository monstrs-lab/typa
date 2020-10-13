/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { DiscoveryModule }               from '@nestjs/core'
import { Test }                          from '@nestjs/testing'
import { toArray }                       from 'streamtoarray'
import { v4 as uuid }                    from 'uuid'

import { TypaStorageModule }             from '@typa/storage'
import { DomainEventStore }              from '@typa/storage'

import { Aggregate }                     from '../decorators'
import { EventSourcingHandler }          from '../decorators'
import { EventSourcingMetadataAccessor } from '../metadata'
import { EventSourcingMetadataExplorer } from '../metadata'
import { EventSourcingMetadataRegistry } from '../metadata'
import { Repository }                    from './repository'
import { DomainEventWithState }          from './wolkenkit'
import { DomainEvent }                   from './wolkenkit'
import { DomainEventData }               from './wolkenkit'
import { buildCommandWithMetadata }      from './wolkenkit'
import { buildDomainEvent }              from './wolkenkit'

describe('event-sourcing', () => {
  describe('aggregate-instance', () => {
    let module
    let domainEventStore
    let aggregateInstance

    const aggregateId = uuid()

    class SucceessEvent {}

    class ExecuteEvent {
      constructor(private readonly strategy?: string) {}
    }

    @Aggregate()
    class TestAggregate {
      domainEventNames: string[] = []

      @EventSourcingHandler(ExecuteEvent)
      onExecute() {
        this.domainEventNames = [...this.domainEventNames, 'executed']
      }

      @EventSourcingHandler(SucceessEvent)
      onSuccess() {
        this.domainEventNames = [...this.domainEventNames, 'succeeded']
      }
    }

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [DiscoveryModule, TypaStorageModule.register()],
        providers: [
          EventSourcingMetadataAccessor,
          EventSourcingMetadataExplorer,
          EventSourcingMetadataRegistry,
          Repository,
          TestAggregate,
        ],
      }).compile()

      await module.init()

      aggregateInstance = await module
        .get(Repository)
        .getAggregateInstance({ name: 'test' }, { name: TestAggregate.name, id: aggregateId })

      domainEventStore = module.get(DomainEventStore)
    })

    afterEach(async () => {
      await module.close()
    })

    describe('contextIdentifier', () => {
      it('is initialized with the given value.', async () => {
        expect(aggregateInstance.contextIdentifier).toEqual({
          name: 'test',
        })
      })
    })

    describe('aggregateIdentifier', () => {
      it('is initialized with the given value.', async () => {
        expect(aggregateInstance.aggregateIdentifier).toEqual({
          name: 'TestAggregate',
          id: aggregateId,
        })
      })
    })

    describe('state', () => {
      it('is initialized with the given value.', async () => {
        expect(aggregateInstance.state).toEqual({
          domainEventNames: [],
        })
      })
    })

    describe('revision', () => {
      it('is initialized with the given value.', async () => {
        expect(aggregateInstance.revision).toBe(0)
      })
    })

    describe('unstoredDomainEvents', () => {
      it('is initialized with the given value.', async () => {
        expect(aggregateInstance.unstoredDomainEvents).toEqual([])
      })
    })

    describe('isPristine', () => {
      it('returns true when the revision is 0.', async () => {
        expect(aggregateInstance.isPristine()).toBe(true)
      })

      it('returns false when the revision is greater than 0.', async () => {
        aggregateInstance.applySnapshot({
          snapshot: {
            aggregateIdentifier: aggregateInstance.aggregateIdentifier,
            revision: 1,
            state: {
              domainEventNames: ['executed'],
            },
          },
        })

        expect(aggregateInstance.isPristine()).toBe(false)
      })
    })

    describe('applyDomainEvent', () => {
      it('throws an error if the context name does not match.', async () => {
        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: TestAggregate.name, id: aggregateId },
          name: ExecuteEvent.name,
          data: {
            strategy: 'succeed',
          },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            revision: 1,
          },
        })

        expect(aggregateInstance.applyDomainEvent(domainEvent)).rejects.toThrow(
          'Context name does not match.'
        )
      })

      it('throws an error if the aggregate name does not match.', async () => {
        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'test' },
          aggregateIdentifier: { name: 'nonExistent', id: aggregateId },
          name: ExecuteEvent.name,
          data: {
            strategy: 'succeed',
          },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            revision: 1,
          },
        })

        expect(aggregateInstance.applyDomainEvent(domainEvent)).rejects.toThrow(
          'Aggregate name does not match.'
        )
      })

      it('throws an error if the aggregate id does not match.', async () => {
        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'test' },
          aggregateIdentifier: { name: TestAggregate.name, id: uuid() },
          name: ExecuteEvent.name,
          data: {
            strategy: 'succeed',
          },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            revision: 1,
          },
        })

        expect(aggregateInstance.applyDomainEvent(domainEvent)).rejects.toThrow(
          'Aggregate id does not match.'
        )
      })

      it('returns the next state.', async () => {
        const domainEvent = buildDomainEvent({
          contextIdentifier: { name: 'test' },
          aggregateIdentifier: { name: TestAggregate.name, id: aggregateId },
          name: ExecuteEvent.name,
          data: {
            strategy: 'succeed',
          },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            revision: 1,
          },
        })

        const nextState = await aggregateInstance.applyDomainEvent(domainEvent)

        expect(nextState).toEqual({
          domainEventNames: ['executed'],
        })
      })
    })

    describe('handleCommand', () => {
      describe('handling', () => {
        it('publishes (and stores) an appropriate event for the incoming command.', async () => {
          const { aggregateIdentifier } = aggregateInstance

          const command = buildCommandWithMetadata({
            contextIdentifier: {
              name: 'test',
            },
            aggregateIdentifier,
            name: ExecuteEvent.name,
            data: {
              strategy: 'succeed',
            },
          })

          const domainEvents = await aggregateInstance.applyCommandEvents(command, [
            new SucceessEvent(),
            new ExecuteEvent(command.data.strategy),
          ])

          expect(domainEvents.length).toBe(2)

          expect(domainEvents[0]).toEqual(
            expect.objectContaining({
              contextIdentifier: {
                name: 'test',
              },
              aggregateIdentifier,
              name: SucceessEvent.name,
              data: {},
            })
          )

          expect(domainEvents[1]).toEqual(
            expect.objectContaining({
              contextIdentifier: {
                name: 'test',
              },
              aggregateIdentifier,
              name: ExecuteEvent.name,
              data: {
                strategy: 'succeed',
              },
            })
          )
        })

        it('updates the state.', async () => {
          const { aggregateIdentifier } = aggregateInstance

          const command = buildCommandWithMetadata({
            contextIdentifier: {
              name: 'test',
            },
            aggregateIdentifier,
            name: ExecuteEvent.name,
            data: {
              strategy: 'succeed',
            },
          })

          await aggregateInstance.applyCommandEvents(command, [
            new SucceessEvent(),
            new ExecuteEvent(command.data.strategy),
          ])

          expect(aggregateInstance.state).toEqual({
            domainEventNames: ['succeeded', 'executed'],
          })
        })
      })
    })

    describe('storeCurrentAggregateState', () => {
      it('does nothing if there are no unstored domain events.', async () => {
        await aggregateInstance.storeCurrentAggregateState()

        const domainEventStream = await domainEventStore.getReplayForAggregate({
          aggregateId,
        })

        const domainEvents = await toArray(domainEventStream)

        expect(domainEvents.length).toBe(0)
      })

      it('stores a single unstored domain event to the domain event store.', async () => {
        aggregateInstance.unstoredDomainEvents.push(
          new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: aggregateInstance.contextIdentifier,
              aggregateIdentifier: aggregateInstance.aggregateIdentifier,
              name: ExecuteEvent.name,
              data: {
                strategy: 'succeed',
              },
              metadata: {
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                revision: 1,
              },
            }),
            state: {
              previous: {
                domainEventNames: [],
              },
              next: {
                domainEventNames: ['executed'],
              },
            },
          })
        )

        await aggregateInstance.storeCurrentAggregateState()

        const domainEventStream = await domainEventStore.getReplayForAggregate({
          aggregateId,
        })

        const domainEvents: DomainEvent<DomainEventData>[] = await toArray(domainEventStream)

        expect(domainEvents.length).toBe(1)
        expect(domainEvents[0].name).toBe('ExecuteEvent')
        expect(domainEvents[0].data).toEqual({
          strategy: 'succeed',
        })
      })

      it('stores multiple unstored domain events to the domain event store.', async () => {
        aggregateInstance.unstoredDomainEvents.push(
          new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: aggregateInstance.contextIdentifier,
              aggregateIdentifier: aggregateInstance.aggregateIdentifier,
              name: SucceessEvent.name,
              data: {},
              metadata: {
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                revision: 1,
              },
            }),
            state: {
              previous: {
                domainEventNames: [],
              },
              next: {
                domainEventNames: ['succeeded'],
              },
            },
          })
        )

        aggregateInstance.unstoredDomainEvents.push(
          new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: aggregateInstance.contextIdentifier,
              aggregateIdentifier: aggregateInstance.aggregateIdentifier,
              name: ExecuteEvent.name,
              data: {
                strategy: 'succeed',
              },
              metadata: {
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                revision: 2,
              },
            }),
            state: {
              previous: {
                domainEventNames: ['succeeded'],
              },
              next: {
                domainEventNames: ['succeeded', 'executed'],
              },
            },
          })
        )

        await aggregateInstance.storeCurrentAggregateState()

        const domainEventStream = await domainEventStore.getReplayForAggregate({
          aggregateId,
        })

        const domainEvents: DomainEvent<DomainEventData>[] = await toArray(domainEventStream)

        expect(domainEvents.length).toBe(2)
        expect(domainEvents[0].name).toBe('SucceessEvent')
        expect(domainEvents[0].data).toEqual({})
        expect(domainEvents[1].name).toBe('ExecuteEvent')
        expect(domainEvents[1].data).toEqual({
          strategy: 'succeed',
        })
      })
    })

    describe('applySnapshot', () => {
      it(`throws an error if the id of the snapshot's aggregate identifier does not match.`, async () => {
        const snapshotAggregateIdentifierId = uuid()

        expect(() =>
          aggregateInstance.applySnapshot({
            snapshot: {
              aggregateIdentifier: { name: TestAggregate.name, id: snapshotAggregateIdentifierId },
              revision: 1,
              state: {
                domainEventNames: ['executed'],
              },
            },
          })
        ).toThrow('Failed to apply snapshot. Aggregate id does not match.')
      })

      it('updates the state.', async () => {
        aggregateInstance.applySnapshot({
          snapshot: {
            aggregateIdentifier: aggregateInstance.aggregateIdentifier,
            revision: 1,
            state: {
              domainEventNames: ['executed'],
            },
          },
        })

        expect(aggregateInstance.state).toEqual({
          domainEventNames: ['executed'],
        })
      })

      it('updates the revision.', async () => {
        aggregateInstance.applySnapshot({
          snapshot: {
            aggregateIdentifier: aggregateInstance.aggregateIdentifier,
            revision: 1,
            state: {
              domainEventNames: ['executed'],
            },
          },
        })

        expect(aggregateInstance.revision).toBe(1)
      })
    })
  })
})
