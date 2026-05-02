import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { type Request } from "express"

import { type ArgosOptions, ArgosModule } from "@lib"

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
    ArgosModule.forRootAsync({
      useFactory: (): ArgosOptions => ({
        auditEvent: TestAuditEvent,
        resolveActor: (req: Request) => req.headers["x-actor"] as string,
      }),
    }),
  ],
  controllers: [WidgetController, GadgetController],
})
export class AuditTrailAsyncAppModule {}
