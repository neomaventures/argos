import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { ArgosModule } from "../libs/argos/src"

import { WidgetController } from "./widgets/widget.controller"
import { Widget } from "./widgets/widget.entity"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ":memory:",
      entities: [Widget],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Widget]),
    ArgosModule.forRoot({
      resolveActor: (req) => req.headers["x-actor"] as string,
    }),
  ],
  controllers: [WidgetController],
})
export class ValueResolverAppModule {}
