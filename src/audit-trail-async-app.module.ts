import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { type Request } from "express"

import { type ArgosOptions, ArgosModule } from "@lib"

import { TestAuditEvent } from "./audit-events/test-audit-event.entity"
import { WidgetController } from "./widgets/widget.controller"
import { Widget } from "./widgets/widget.entity"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ":memory:",
      entities: [Widget, TestAuditEvent],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Widget]),
    ArgosModule.forRootAsync({
      useFactory: (): ArgosOptions => ({
        auditEvent: TestAuditEvent,
        resolveActor: (req: Request) => req.headers["x-actor"] as string,
      }),
    }),
  ],
  controllers: [WidgetController],
})
export class AuditTrailAsyncAppModule {}
