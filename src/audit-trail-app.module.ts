import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { ArgosModule } from "@lib"

import { TestAuditEvent } from "./audit-events/test-audit-event.entity"
import { GadgetController } from "./gadgets/gadget.controller"
import { Gadget } from "./gadgets/gadget.entity"
import { WidgetController } from "./widgets/widget.controller"
import { Widget } from "./widgets/widget.entity"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ":memory:",
      entities: [Widget, Gadget, TestAuditEvent],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Widget, Gadget]),
    ArgosModule.forRoot({
      auditEvent: TestAuditEvent,
      resolveActor: (req) => req.headers["x-actor"] as string,
    }),
  ],
  controllers: [WidgetController, GadgetController],
})
export class AuditTrailAppModule {}
