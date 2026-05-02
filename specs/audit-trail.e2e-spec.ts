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

      it("should not write audit rows when no subscriber exists", async () => {
        const actor = `principal:${faker.string.uuid()}`

        await request(app.getHttpServer())
          .post("/widgets")
          .set("x-actor", actor)
          .send({ name: faker.commerce.productName() })
          .expect(HttpStatus.CREATED)

        const events = await app
          .get(DataSource)
          .getRepository(TestAuditEvent)
          .find()

        expect(events).toHaveLength(0)
      })
    })
  })
})
