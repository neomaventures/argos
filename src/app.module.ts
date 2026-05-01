import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { ArgosModule } from "@lib"

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
