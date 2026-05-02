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
import { auditStore } from "../argos.store"
import { Audited } from "../decorators/audited.decorator"
import { type AuditableEvent } from "../interfaces/auditable-event.interface"

import { AuditSubscriber } from "./audit.subscriber"

@Audited()
@Entity("audited_widgets")
class AuditedWidget {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public name!: string

  @Column({ default: "draft" })
  public status!: string
}

@Entity("plain_widgets")
class PlainWidget {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public name!: string
}

@Entity("test_audit_events")
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

describe("AuditSubscriber", () => {
  let dataSource: DataSource
  let auditedRepo: Repository<AuditedWidget>
  let plainRepo: Repository<PlainWidget>
  let auditRepo: Repository<TestAuditEvent>

  async function setup(options: ArgosOptions): Promise<void> {
    dataSource = await datasource([AuditedWidget, PlainWidget, TestAuditEvent])

    // The subscriber registers itself via dataSource.subscribers.push(this)
    new AuditSubscriber(options, dataSource)

    auditedRepo = dataSource.getRepository(AuditedWidget)
    plainRepo = dataSource.getRepository(PlainWidget)
    auditRepo = dataSource.getRepository(TestAuditEvent)
  }

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy()
    }
  })

  describe("afterInsert()", () => {
    describe("Given an @Audited() entity is inserted", () => {
      it("should write an audit event with action 'create' and entity snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const name = faker.commerce.productName()
        const saved = await auditedRepo.save(
          auditedRepo.create({ name, status: "active" }),
        )

        const events = await auditRepo.find()
        expect(events).toMatchObject([
          {
            entity: "AuditedWidget",
            entityId: saved.id,
            action: "create",
            actor: "system",
            snapshot: {
              id: saved.id,
              name,
              status: "active",
            },
          },
        ])
      })
    })
  })

  describe("afterUpdate()", () => {
    describe("Given an @Audited() entity is updated with a full entity", () => {
      it("should write an audit event with action 'update' and full snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const widget = await auditedRepo.save(
          auditedRepo.create({
            name: faker.commerce.productName(),
            status: "draft",
          }),
        )

        const updatedName = faker.commerce.productName()
        widget.name = updatedName
        widget.status = "active"
        await auditedRepo.save(widget)

        const events = await auditRepo.find({
          where: { action: "update" },
        })
        expect(events).toMatchObject([
          {
            entity: "AuditedWidget",
            entityId: widget.id,
            action: "update",
            actor: "system",
            snapshot: {
              id: widget.id,
              name: updatedName,
              status: "active",
            },
          },
        ])
      })
    })

    describe("Given an @Audited() entity is updated with a partial entity", () => {
      it("should reload and write a complete snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const originalName = faker.commerce.productName()
        const widget = await auditedRepo.save(
          auditedRepo.create({ name: originalName, status: "draft" }),
        )

        // Partial update — only status changes
        await auditedRepo.save({ id: widget.id, status: "completed" })

        const events = await auditRepo.find({
          where: { action: "update" },
        })
        expect(events).toMatchObject([
          {
            entity: "AuditedWidget",
            entityId: widget.id,
            action: "update",
            snapshot: {
              id: widget.id,
              name: originalName,
              status: "completed",
            },
          },
        ])
      })
    })
  })

  describe("afterRemove()", () => {
    describe("Given an @Audited() entity is removed", () => {
      it("should write an audit event with action 'delete' and final snapshot", async () => {
        await setup({ auditEvent: TestAuditEvent })

        const name = faker.commerce.productName()
        const widget = await auditedRepo.save(
          auditedRepo.create({ name, status: "active" }),
        )

        const widgetId = widget.id

        await auditedRepo.remove(widget)

        const events = await auditRepo.find({
          where: { action: "delete" },
        })
        expect(events).toMatchObject([
          {
            entity: "AuditedWidget",
            entityId: widgetId,
            action: "delete",
            actor: "system",
            snapshot: {
              name,
              status: "active",
            },
          },
        ])
      })
    })
  })

  describe("Given an entity without @Audited()", () => {
    it("should not write an audit event on insert", async () => {
      await setup({ auditEvent: TestAuditEvent })

      await plainRepo.save(
        plainRepo.create({ name: faker.commerce.productName() }),
      )

      const events = await auditRepo.find()
      expect(events).toHaveLength(0)
    })
  })

  describe("Given the actor is set in ALS context", () => {
    it("should record the actor from the ALS context", async () => {
      await setup({ auditEvent: TestAuditEvent })

      const actor = `principal:${faker.string.uuid()}`

      await auditStore.run({ actor }, async () => {
        await auditedRepo.save(
          auditedRepo.create({
            name: faker.commerce.productName(),
            status: "active",
          }),
        )
      })

      const events = await auditRepo.find()
      expect(events).toHaveLength(1)
      expect(events[0].actor).toBe(actor)
    })
  })

  describe("Given auditEvent is not configured", () => {
    it("should not write any audit events", async () => {
      await setup({})

      await auditedRepo.save(
        auditedRepo.create({
          name: faker.commerce.productName(),
          status: "active",
        }),
      )

      const events = await auditRepo.find()
      expect(events).toHaveLength(0)
    })
  })
})
