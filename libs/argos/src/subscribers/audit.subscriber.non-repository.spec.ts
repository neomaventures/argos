/* eslint-disable @typescript-eslint/no-unsafe-argument */
import "reflect-metadata"

import { faker } from "@faker-js/faker"
import {
  Column,
  CreateDateColumn,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  type Repository,
} from "typeorm"

import { datasource } from "../../../../fixtures/database"
import { type ArgosOptions } from "../argos.options"
import { Audited } from "../decorators/audited.decorator"
import { type AuditableEvent } from "../interfaces/auditable-event.interface"

import { AuditSubscriber } from "./audit.subscriber"

@Audited()
@Entity("audited_gadgets")
class AuditedGadget {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public name!: string

  @Column({ default: "draft" })
  public status!: string
}

@Entity("test_audit_events_nr")
class TestAuditEvent implements AuditableEvent {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public entity!: string

  @Column()
  public entityId!: string

  @Column()
  public action!: string

  @Column({ type: "simple-json" })
  public snapshot!: Record<string, any>

  @Column()
  public actor!: string

  @CreateDateColumn()
  public createdAt!: Date
}

describe("AuditSubscriber (non-repository operations)", () => {
  let dataSource: DataSource
  let repository: Repository<AuditedGadget>
  let auditRepo: Repository<TestAuditEvent>

  async function setup(options: ArgosOptions): Promise<void> {
    dataSource = await datasource([AuditedGadget, TestAuditEvent])
    new AuditSubscriber(options, dataSource)
    repository = dataSource.getRepository(AuditedGadget)
    auditRepo = dataSource.getRepository(TestAuditEvent)
  }

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy()
    }
  })

  describe("Repository operations (baseline)", () => {
    describe("repository.save() — insert", () => {
      it("should write an audit event with action 'create' and full snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const name = faker.commerce.productName()
        const saved = await repository.save(
          repository.create({ name, status: "active" }),
        )

        const events = await auditRepo.find()
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          entity: "AuditedGadget",
          entityId: saved.id,
          action: "create",
          snapshot: { id: saved.id, name, status: "active" },
        })
      })
    })

    describe("repository.save() — update", () => {
      it("should write an audit event with action 'update' and full snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const gadget = await repository.save(
          repository.create({
            name: faker.commerce.productName(),
            status: "draft",
          }),
        )

        const updatedName = faker.commerce.productName()
        gadget.name = updatedName
        await repository.save(gadget)

        const events = await auditRepo.find({ where: { action: "update" } })
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          entity: "AuditedGadget",
          entityId: gadget.id,
          action: "update",
          snapshot: { id: gadget.id, name: updatedName, status: "draft" },
        })
      })
    })

    describe("repository.remove()", () => {
      it("should write an audit event with action 'delete' and final snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const name = faker.commerce.productName()
        const gadget = await repository.save(
          repository.create({ name, status: "active" }),
        )
        const gadgetId = gadget.id

        await repository.remove(gadget)

        const events = await auditRepo.find({ where: { action: "delete" } })
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          entity: "AuditedGadget",
          entityId: gadgetId,
          action: "delete",
          snapshot: { name, status: "active" },
        })
      })
    })
  })

  describe("EntityManager operations", () => {
    describe("manager.insert()", () => {
      it("should write an audit event with a valid entityId and full snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const name = faker.commerce.productName()

        await dataSource.manager.insert(AuditedGadget, {
          name,
          status: "active",
        })

        // Finding: manager.insert() fires afterInsert with event.entity populated.
        // TypeORM auto-generates the UUID for PrimaryGeneratedColumn("uuid") and
        // mutates event.entity in-place, so event.entity.id is available.
        const events = await auditRepo.find()
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          entity: "AuditedGadget",
          action: "create",
          snapshot: { name, status: "active" },
        })
        // The entityId is a valid UUID, not "undefined"
        expect(events[0].entityId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
        // Snapshot includes the auto-generated id
        expect(events[0].snapshot.id).toBe(events[0].entityId)
      })
    })

    describe("manager.update()", () => {
      it("should log event properties for investigation", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const gadget = await repository.save(
          repository.create({
            name: faker.commerce.productName(),
            status: "draft",
          }),
        )
        await auditRepo.clear()

        const captured: any[] = []
        const sub = dataSource.subscribers[0]
        const origAfterUpdate = sub.afterUpdate!.bind(sub)

        sub.beforeUpdate = async (event: any): Promise<void> => {
          captured.push({
            hook: "beforeUpdate",
            keys: Object.keys(event),
            entity: event.entity,
            databaseEntity: event.databaseEntity,
            entityId: event.entityId,
          })
        }
        sub.afterUpdate = async (event: any): Promise<void> => {
          captured.push({
            hook: "afterUpdate",
            keys: Object.keys(event),
            entity: event.entity,
            databaseEntity: event.databaseEntity,
            entityId: event.entityId,
          })
          return origAfterUpdate(event)
        }

        await dataSource.manager.update(AuditedGadget, gadget.id, {
          name: faker.commerce.productName(),
        })

        console.log(
          "manager.update() events:",
          JSON.stringify(captured, null, 2),
        )

        const events = await auditRepo.find()
        expect(events.length).toBeGreaterThanOrEqual(0)
      })
    })

    describe("manager.delete()", () => {
      it("should log event properties for investigation", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const gadget = await repository.save(
          repository.create({
            name: faker.commerce.productName(),
            status: "active",
          }),
        )
        await auditRepo.clear()

        const captured: any[] = []
        const sub = dataSource.subscribers[0]
        const origAfterRemove = sub.afterRemove!.bind(sub)

        sub.beforeRemove = async (event: any): Promise<void> => {
          captured.push({
            hook: "beforeRemove",
            keys: Object.keys(event),
            entity: event.entity,
            databaseEntity: event.databaseEntity,
            entityId: event.entityId,
          })
        }
        sub.afterRemove = async (event: any): Promise<void> => {
          captured.push({
            hook: "afterRemove",
            keys: Object.keys(event),
            entity: event.entity,
            databaseEntity: event.databaseEntity,
            entityId: event.entityId,
          })
          return origAfterRemove(event)
        }

        await dataSource.manager.delete(AuditedGadget, gadget.id)

        console.log(
          "manager.delete() events:",
          JSON.stringify(captured, null, 2),
        )

        const events = await auditRepo.find()
        expect(events.length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe("QueryBuilder operations", () => {
    describe("queryBuilder.insert()", () => {
      it("should write an audit event with a valid entityId and full snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const name = faker.commerce.productName()

        await dataSource
          .createQueryBuilder()
          .insert()
          .into(AuditedGadget)
          .values({ name, status: "active" })
          .execute()

        // Finding: queryBuilder.insert() fires afterInsert with event.entity
        // populated. Same as manager.insert — TypeORM auto-generates the UUID
        // and mutates the values object, so event.entity.id is present.
        const events = await auditRepo.find()
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          entity: "AuditedGadget",
          action: "create",
          snapshot: { name, status: "active" },
        })
        expect(events[0].entityId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
        expect(events[0].snapshot.id).toBe(events[0].entityId)
      })
    })

    describe("queryBuilder.update()", () => {
      it("should write an audit event but with entityId 'undefined' because event.entity lacks an id", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const gadget = await repository.save(
          repository.create({
            name: faker.commerce.productName(),
            status: "draft",
          }),
        )

        // Clear the create audit event
        await auditRepo.clear()

        const updatedName = faker.commerce.productName()
        await dataSource
          .createQueryBuilder()
          .update(AuditedGadget)
          .set({ name: updatedName })
          .where("id = :id", { id: gadget.id })
          .execute()

        // Finding: queryBuilder.update() fires afterUpdate and event.entity IS
        // defined (the partial set object), but event.entity.id is undefined.
        // Same bug as manager.update — entityId becomes "undefined".
        const events = await auditRepo.find()
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          entity: "AuditedGadget",
          action: "update",
        })
        // BUG: entityId is the string "undefined"
        expect(events[0].entityId).toBe("undefined")
        // Snapshot is reloaded from DB (same findOneBy({ id: undefined }) issue)
        expect(events[0].snapshot).toMatchObject({
          id: gadget.id,
          status: "draft",
        })
      })
    })

    describe("queryBuilder.delete()", () => {
      it("should not write an audit event because event.databaseEntity is undefined", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const gadget = await repository.save(
          repository.create({
            name: faker.commerce.productName(),
            status: "active",
          }),
        )

        // Clear the create audit event
        await auditRepo.clear()

        await dataSource
          .createQueryBuilder()
          .delete()
          .from(AuditedGadget)
          .where("id = :id", { id: gadget.id })
          .execute()

        // Finding: queryBuilder.delete() fires afterRemove but event.databaseEntity
        // is undefined. The subscriber's guard skips silently.
        // No audit trail for this delete.
        const events = await auditRepo.find()
        expect(events).toHaveLength(0)
      })
    })
  })
})
