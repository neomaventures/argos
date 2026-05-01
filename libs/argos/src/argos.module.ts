import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"

import { ConfigurableModuleClass } from "./argos.module-definition"
import { ActorMiddleware } from "./middlewares/actor.middleware"

@Module({})
export class ArgosModule extends ConfigurableModuleClass implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ActorMiddleware).forRoutes("*")
  }
}
