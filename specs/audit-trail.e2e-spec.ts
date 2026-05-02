import { faker } from "@faker-js/faker"
import { managedAppInstance } from "@neoma/managed-app"
import { HttpStatus } from "@nestjs/common"
import request from "supertest"
import { DataSource } from "typeorm"

import { TestAuditEvent } from "../src/audit-events/test-audit-event.entity"

const modules = [
  {
    label: "forRoot",
    path: "src/audit-trail-app.module.ts#AuditTrailAppModule",
  },
  {
    label: "forRootAsync",
    path: "src/audit-trail-async-app.module.ts#AuditTrailAsyncAppModule",
  },
]

describe("Audit trail", () => {
  modules.forEach(({ label, path }) => {
    describe(`Given auditEvent is configured (${label})`, () => {
      let app: Awaited<ReturnType<typeof managedAppInstance>>

      beforeEach(async () => {
        app = await managedAppInstance(path)
      })

      it("should not write audit rows for non-audited entities", async () => {
        const actor = `principal:${faker.string.uuid()}`
        const server = app.getHttpServer()

        await request(server)
          .post("/gadgets")
          .set("x-actor", actor)
          .send({ name: faker.commerce.productName() })
          .expect(HttpStatus.CREATED)

        const events = await app
          .get(DataSource)
          .getRepository(TestAuditEvent)
          .find()

        expect(events).toHaveLength(0)
      })

      it("should record create, update, and delete audit events", async () => {
        const actor = `principal:${faker.string.uuid()}`
        const server = app.getHttpServer()
        const widgetName = faker.commerce.productName()
        const updatedName = faker.commerce.productName()

        // Create
        const { body: created } = await request(server)
          .post("/widgets")
          .set("x-actor", actor)
          .send({ name: widgetName })
          .expect(HttpStatus.CREATED)

        // Update
        await request(server)
          .put(`/widgets/${created.id}`)
          .set("x-actor", actor)
          .send({ name: updatedName })
          .expect(HttpStatus.OK)

        // Delete
        await request(server)
          .delete(`/widgets/${created.id}`)
          .set("x-actor", actor)
          .expect(HttpStatus.NO_CONTENT)

        // Query audit events
        const events = await app
          .get(DataSource)
          .getRepository(TestAuditEvent)
          .find({ order: { createdAt: "ASC" } })

        expect(events).toMatchObject([
          {
            entity: "Widget",
            entityId: created.id,
            action: "create",
            actor,
            snapshot: { name: widgetName },
          },
          {
            entity: "Widget",
            entityId: created.id,
            action: "update",
            actor,
            snapshot: { name: updatedName },
          },
          {
            entity: "Widget",
            entityId: created.id,
            action: "delete",
            actor,
            snapshot: { name: updatedName },
          },
        ])
      })
    })
  })
})
