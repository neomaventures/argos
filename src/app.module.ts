import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { ArgosModule } from "../libs/argos/src"

import { AppController } from "./app.controller"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ":memory:",
      entities: ["src/**/*.entity.ts"],
      synchronize: true,
    }),
    ArgosModule.forRoot({}),
  ],
  controllers: [AppController],
})
export class AppModule {}
