import { toArray }                from 'streamtoarray'
import { createConnection }       from 'typeorm'
import { getMetadataArgsStorage } from 'typeorm'
import { v4 as uuid }             from 'uuid'

import { TypeOrmLogger }          from '@typa/logger'

import { DomainEventStore }       from './domain-event.store'
import { DomainEventSnapshot }    from './entities'
import { DomainEvent }            from './entities'
import { DomainEventData }        from './wolkenkit'
import { buildDomainEvent }       from './wolkenkit'

getMetadataArgsStorage().columns.forEach((column) => {
  if (column.options.type === 'jsonb') {
    // eslint-disable-next-line no-param-reassign
    column.options.type = 'simple-json'
  }
})

describe('domain-event-store', () => {
  let domainEventStore: DomainEventStore
  let connection

  beforeEach(async () => {
    connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      entities: [DomainEventSnapshot, DomainEvent],
      logger: new TypeOrmLogger(),
    })

    domainEventStore = new DomainEventStore(connection)
  })

  afterEach(async () => {
    await connection.close()
  })

  describe('getLastDomainEvent', () => {
    it('returns undefined for an aggregate without domain events.', async () => {
      const domainEvent = await domainEventStore.getLastDomainEvent({
        aggregateIdentifier: {
          id: uuid(),
          name: 'foo',
        },
      })

      expect(domainEvent).not.toBeDefined()
    })

    it('returns the last domain event for the given aggregate.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: 2,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted, domainEventJoined],
      })

      const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier })

      expect(domainEvent).toBeDefined()
      expect(domainEvent!.name).toBe('joined')
      expect(domainEvent!.metadata.revision).toBe(2)
    })

    it('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: {
          initiator: null,
          destination: undefined,
          participants: [],
        },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEventJoined] })

      const domainEvent: any = await domainEventStore.getLastDomainEvent({ aggregateIdentifier })

      expect(domainEvent).toBeDefined()
      expect(domainEvent!.data.initiator).toBeNull()
      expect(domainEvent!.data.participants).toEqual([])
    })

    it('supports tags.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
          tags: ['gdpr'],
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted],
      })

      const domainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier })

      expect(domainEvent!.metadata.tags).toEqual(['gdpr'])
    })
  })

  describe('getDomainEventsByCausationId', () => {
    it('stream ends immediately if no events with a matching causation id exist.', async () => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })

      const domainEventsByCausationId = await toArray(
        await domainEventStore.getDomainEventsByCausationId({ causationId: uuid() })
      )

      expect(domainEventsByCausationId).toEqual([])
    })

    it('returns all domain events with a matching causation id.', async () => {
      const causationId = uuid()

      const domainEvent1 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })
      const domainEvent2 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })
      const domainEvent3 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({
        domainEvents: [domainEvent1, domainEvent2, domainEvent3],
      })

      const domainEventsByCausationId = await toArray(
        await domainEventStore.getDomainEventsByCausationId({ causationId })
      )

      expect(domainEventsByCausationId.length).toBe(2)
      expect(
        domainEventsByCausationId.find((domainEvent): boolean => domainEvent.id === domainEvent1.id)
      ).toBeDefined()
      expect(
        domainEventsByCausationId.find((domainEvent): boolean => domainEvent.id === domainEvent2.id)
      ).toBeDefined()
      expect(
        domainEventsByCausationId.find((domainEvent): boolean => domainEvent.id === domainEvent3.id)
      ).toBeUndefined()
    })
  })

  describe('hasDomainEventsWithCausationId', () => {
    it('returns false if no events with a matching causation id exist.', async () => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })

      const hasDomainEventsWithCausationId = await domainEventStore.hasDomainEventsWithCausationId({
        causationId: uuid(),
      })

      expect(hasDomainEventsWithCausationId).toBe(false)
    })

    it('returns true if events with a matching causation id exist.', async () => {
      const causationId = uuid()

      const domainEvent1 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })
      const domainEvent2 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId,
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })
      const domainEvent3 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({
        domainEvents: [domainEvent1, domainEvent2, domainEvent3],
      })

      const hasDomainEventsWithCausationId = await domainEventStore.hasDomainEventsWithCausationId({
        causationId,
      })

      expect(hasDomainEventsWithCausationId).toBe(true)
    })
  })

  describe('getDomainEventsByCorrelationId', () => {
    it('returns an empty array if no events with a matching correlation id exist.', async () => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })

      const domainEventsByCorrelationId = await toArray(
        await domainEventStore.getDomainEventsByCorrelationId({ correlationId: uuid() })
      )

      expect(domainEventsByCorrelationId).toEqual([])
    })

    it('returns all domain events with a matching correlation id.', async () => {
      const correlationId = uuid()

      const domainEvent1 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId,
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })
      const domainEvent2 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId,
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })
      const domainEvent3 = buildDomainEvent({
        contextIdentifier: {
          name: 'sampleContext',
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid(),
        },
        name: 'execute',
        data: {},
        id: uuid(),
        metadata: {
          causationId: uuid(),
          correlationId: uuid(),
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({
        domainEvents: [domainEvent1, domainEvent2, domainEvent3],
      })

      const domainEventsByCorrelationId = await toArray(
        await domainEventStore.getDomainEventsByCorrelationId({ correlationId })
      )

      expect(domainEventsByCorrelationId.length).toBe(2)
      expect(
        domainEventsByCorrelationId.find(
          (domainEvent): boolean => domainEvent.id === domainEvent1.id
        )
      ).toBeDefined()
      expect(
        domainEventsByCorrelationId.find(
          (domainEvent): boolean => domainEvent.id === domainEvent2.id
        )
      ).toBeDefined()
      expect(
        domainEventsByCorrelationId.find(
          (domainEvent): boolean => domainEvent.id === domainEvent3.id
        )
      ).toBeUndefined()
    })
  })

  describe('getReplayForAggregate', () => {
    it('returns an empty stream for a non-existent aggregate.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(0)
    })

    it('returns a stream of domain events for the given aggregate.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: 2,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted, domainEventJoined],
      })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(2)
      expect(aggregateDomainEvents[0].name).toBe('started')
      expect(aggregateDomainEvents[1].name).toBe('joined')
    })

    it('returns a stream from revision.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: 2,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted, domainEventJoined],
      })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
        fromRevision: 2,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(1)
      expect(aggregateDomainEvents[0].name).toBe('joined')
    })

    it('returns a stream to revision.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: 2,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted, domainEventJoined],
      })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
        toRevision: 1,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(1)
      expect(aggregateDomainEvents[0].name).toBe('started')
    })

    it('supports tags.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
          tags: ['gdpr'],
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted],
      })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents[0].metadata.tags).toEqual(['gdpr'])
    })

    it('throws an error if the parameter fromRevision is less than 1.', async () => {
      await expect(
        domainEventStore.getReplayForAggregate({ aggregateId: uuid(), fromRevision: 0 })
      ).rejects.toThrow(`Parameter 'fromRevision' must be at least 1.`)
    })

    it('throws an error if the parameter toRevision is less than 1.', async () => {
      await expect(
        domainEventStore.getReplayForAggregate({ aggregateId: uuid(), toRevision: 0 })
      ).rejects.toThrow(`Parameter 'toRevision' must be at least 1.`)
    })

    it(`throws an error if the parameter 'fromRevision' is greater than 'toRevision'.`, async () => {
      await expect(
        domainEventStore.getReplayForAggregate({
          aggregateId: uuid(),
          fromRevision: 5,
          toRevision: 3,
        })
      ).rejects.toThrow(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`)
    })
  })

  describe('storeDomainEvents', () => {
    it('throws an error if domain events is an empty array.', async () => {
      await expect(domainEventStore.storeDomainEvents({ domainEvents: [] })).rejects.toThrow(
        'Domain events are missing.'
      )
    })

    it('stores domain events.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      const domainEventJoined = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'joined',
        data: { participant: 'Jane Doe' },
        metadata: {
          revision: 2,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents<DomainEventData>({
        domainEvents: [domainEventStarted, domainEventJoined],
      })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(2)
      expect(aggregateDomainEvents[0].name).toBe('started')
      expect(aggregateDomainEvents[1].name).toBe('joined')
    })

    it('stores domain events with special characters in keys.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEventStarted = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: {
            user: {
              id: 'jane.doe',
              claims: {
                'https://invalid.token/is-anonymous': true,
                sub: 'jane.doe',
              },
            },
          },
        },
      })

      await expect(
        domainEventStore.storeDomainEvents<DomainEventData>({
          domainEvents: [domainEventStarted],
        })
      ).resolves.toBeUndefined()
    })

    it('throws an error if the aggregate id and revision of the new domain event are already in use.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })

      await expect(
        domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })
      ).rejects.toThrow('Aggregate id and revision already exist.')
    })

    it('correctly handles undefined and null.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: null, destination: undefined },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(1)
      expect(aggregateDomainEvents[0].data).toEqual({ initiator: null })
    })

    it('supports tags.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'planning' },
        aggregateIdentifier,
        name: 'started',
        data: { initiator: 'Jane Doe', destination: 'Riva' },
        metadata: {
          revision: 1,
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
          tags: ['gdpr'],
        },
      })

      await domainEventStore.storeDomainEvents({ domainEvents: [domainEvent] })

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
      })
      const aggregateDomainEvents = await toArray(domainEventStream)

      expect(aggregateDomainEvents.length).toBe(1)
      expect(aggregateDomainEvents[0].metadata.tags).toEqual(['gdpr'])
    })
  })

  describe('getSnapshot', () => {
    it('returns undefined for an aggregate without a snapshot.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

      expect(snapshot).toBeUndefined()
    })

    it('returns a snapshot for the given aggregate.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: ['Jane Doe'],
      }

      await domainEventStore.storeSnapshot({
        snapshot: { aggregateIdentifier, revision: 5, state },
      })

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

      expect(snapshot).toEqual({
        aggregateIdentifier,
        revision: 5,
        state,
      })
    })

    it('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const state = {
        initiator: null,
        destination: undefined,
        participants: [],
      }

      await domainEventStore.storeSnapshot({
        snapshot: { aggregateIdentifier, revision: 5, state },
      })

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

      expect(snapshot).toBeDefined()
      expect(snapshot!.aggregateIdentifier).toEqual(aggregateIdentifier)
      expect(snapshot!.revision).toBe(5)
      expect(snapshot!.state).toEqual({
        initiator: null,
        participants: [],
      })
    })

    it('returns the newest snapshot for the given aggregate.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const stateOld = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: ['Jane Doe'],
      }

      const stateNew = {
        initiator: 'Jane Doe',
        destination: 'Moulou',
        participants: ['Jane Doe', 'Jenny Doe'],
      }

      await domainEventStore.storeSnapshot({
        snapshot: { aggregateIdentifier, revision: 5, state: stateOld },
      })
      await domainEventStore.storeSnapshot({
        snapshot: { aggregateIdentifier, revision: 10, state: stateNew },
      })

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

      expect(snapshot).toEqual({
        aggregateIdentifier,
        revision: 10,
        state: stateNew,
      })
    })
  })

  describe('storeSnapshot', () => {
    it('stores a snapshot.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }

      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: ['Jane Doe'],
      }

      await domainEventStore.storeSnapshot({
        snapshot: { aggregateIdentifier, revision: 10, state },
      })

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

      expect(snapshot).toEqual({
        aggregateIdentifier,
        revision: 10,
        state,
      })
    })

    it('stores multiple snapshots.', async () => {
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: ['Jane Doe'],
      }

      const aggregateIdentifiers = [
        {
          id: uuid(),
          name: 'foo',
        },
        {
          id: uuid(),
          name: 'bar',
        },
        {
          id: uuid(),
          name: 'baz',
        },
      ]

      // eslint-disable-next-line no-restricted-syntax
      for (const aggregateIdentifier of aggregateIdentifiers) {
        // eslint-disable-next-line no-await-in-loop
        await domainEventStore.storeSnapshot({
          snapshot: { aggregateIdentifier, revision: 10, state },
        })
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const aggregateIdentifier of aggregateIdentifiers) {
        // eslint-disable-next-line no-await-in-loop
        const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

        expect(snapshot).toEqual({
          aggregateIdentifier,
          revision: 10,
          state,
        })
      }
    })

    it('correctly handles null, undefined and empty arrays.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }
      const state = {
        initiator: null,
        destination: undefined,
        participants: [],
      }

      await domainEventStore.storeSnapshot({
        snapshot: { aggregateIdentifier, revision: 10, state },
      })

      const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier })

      expect(snapshot).toEqual({
        aggregateIdentifier,
        revision: 10,
        state: {
          initiator: null,
          participants: [],
        },
      })
    })

    it('does not throw an error if trying to store an already stored snapshot.', async () => {
      const aggregateIdentifier = {
        id: uuid(),
        name: 'peerGroup',
      }
      const state = {
        initiator: 'Jane Doe',
        destination: 'Riva',
        participants: ['Jane Doe'],
      }

      await expect(
        domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } })
      ).resolves.toBeUndefined()
      await expect(
        domainEventStore.storeSnapshot({ snapshot: { aggregateIdentifier, revision: 10, state } })
      ).resolves.toBeUndefined()
    })
  })

  describe('getReplay', () => {
    it('returns an empty stream.', async () => {
      const replayStream = await domainEventStore.getReplay({})
      const replayEvents = await toArray(replayStream)

      expect(replayEvents.length).toBe(0)
    })

    describe('with existent data', (): void => {
      beforeEach(async () => {
        const aggregateIdentifier = {
          id: uuid(),
          name: 'peerGroup',
        }

        const domainEventStarted = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'started',
          data: { initiator: 'Jane Doe', destination: 'Riva' },
          metadata: {
            revision: 1,
            timestamp: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            tags: ['gdpr'],
          },
        })

        const domainEventJoinedFirst = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jane Doe' },
          metadata: {
            revision: 2,
            timestamp: 2,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            tags: ['gdpr'],
          },
        })

        const domainEventJoinedSecond = buildDomainEvent({
          contextIdentifier: { name: 'planning' },
          aggregateIdentifier,
          name: 'joined',
          data: { participant: 'Jennifer Doe' },
          metadata: {
            revision: 3,
            timestamp: 3,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
            tags: ['gdpr'],
          },
        })

        await domainEventStore.storeDomainEvents<DomainEventData>({
          domainEvents: [domainEventStarted, domainEventJoinedFirst, domainEventJoinedSecond],
        })
      })

      it('returns all domain events if no options are given.', async () => {
        const replayStream = await domainEventStore.getReplay({})
        const replayEvents = (await toArray(replayStream)) as any[]

        expect(replayEvents.length).toBe(3)
        expect(replayEvents[0].name).toBe('started')
        expect(replayEvents[0].metadata.revision).toBe(1)
        expect(replayEvents[1].name).toBe('joined')
        expect(replayEvents[1].metadata.revision).toBe(2)
        expect(replayEvents[2].name).toBe('joined')
        expect(replayEvents[2].metadata.revision).toBe(3)
      })

      it('returns all domain events from the given timestamp.', async () => {
        const replayStream = await domainEventStore.getReplay({ fromTimestamp: 2 })
        const replayEvents = (await toArray(replayStream)) as any[]

        expect(replayEvents.length).toBe(2)
        expect(replayEvents[0].name).toBe('joined')
        expect(replayEvents[0].metadata.revision).toBe(2)
        expect(replayEvents[1].name).toBe('joined')
        expect(replayEvents[1].metadata.revision).toBe(3)
      })

      it('supports tags.', async () => {
        const replayStream = await domainEventStore.getReplay({})
        const replayEvents = (await toArray(replayStream)) as any[]

        expect(replayEvents[0].metadata.tags).toEqual(['gdpr'])
        expect(replayEvents[1].metadata.tags).toEqual(['gdpr'])
        expect(replayEvents[2].metadata.tags).toEqual(['gdpr'])
      })
    })

    it('throws an error if the parameter fromTimestamp is less than 0.', async () => {
      await expect(domainEventStore.getReplay({ fromTimestamp: -1 })).rejects.toThrow(
        `Parameter 'fromTimestamp' must be at least 0.`
      )
    })
  })
})
