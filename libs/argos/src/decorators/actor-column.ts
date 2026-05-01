import { Column, getMetadataArgsStorage } from "typeorm"

import { getActor } from "../argos.store"

type EntityListenerEvent = "before-insert" | "before-update"

export function actorColumn(
  name: string,
  events: EntityListenerEvent[],
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    Column({ type: "varchar", nullable: true })(target, propertyKey)

    const methodName = `__argos${name}_${String(propertyKey)}`

    Object.defineProperty(target, methodName, {
      value: function (): void {
        this[propertyKey] = getActor()
      },
      writable: true,
      enumerable: false,
      configurable: true,
    })

    for (const type of events) {
      getMetadataArgsStorage().entityListeners.push({
        target: target.constructor,
        propertyName: methodName,
        type,
      })
    }
  }
}
