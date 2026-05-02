import { Inject, Injectable } from "@nestjs/common"
import {
  DataSource,
  type EntitySubscriberInterface,
  EventSubscriber,
  type InsertEvent,
  type RemoveEvent,
  type UpdateEvent,
} from "typeorm"

import { type ArgosOptions, ARGOS_OPTIONS } from "../argos.options"
import { getActor } from "../argos.store"
import { AUDITED_METADATA_KEY } from "../decorators/audited.decorator"

/**
 * TypeORM subscriber that writes audit events for `@Audited()` entities.
 *
 * Captures `afterInsert`, `afterUpdate`, and `afterRemove` events and writes
 * a full entity snapshot to the consumer-provided audit event table. The
 * subscriber runs inside the transaction, so audit write failures roll back
 * the entity change.
 *
 * The subscriber is always registered as a provider but guards on
 * `options.auditEvent` — it does nothing if no audit event entity is configured.
 *
 * @example
 * ```typescript
 * // Registered automatically by ArgosModule — no manual setup needed.
 * ArgosModule.forRoot({
 *   auditEvent: MyAuditEvent,
 *   resolveActor: (req) => req.principal?.id ?? null,
 * })
 * ```
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  public constructor(
    @Inject(ARGOS_OPTIONS) private readonly options: ArgosOptions,
    dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this)
  }

  /**
   * Records a `"create"` audit event after an entity is inserted.
   *
   * @param event - The TypeORM insert event
   */
  public async afterInsert(event: InsertEvent<any>): Promise<void> {
    if (!this.shouldAudit(event.metadata?.target)) return

    await event.manager.save(this.options.auditEvent!, {
      entity: event.metadata.targetName,
      entityId: String(event.entity.id),
      action: "create",
      snapshot: { ...event.entity },
      actor: getActor(),
    })
  }

  /**
   * Records an `"update"` audit event after an entity is updated.
   *
   * Always reloads the full entity from the database to guarantee a complete
   * snapshot, since `event.entity` may be partial when using
   * `repository.save({ id, ...partial })`.
   *
   * @param event - The TypeORM update event
   */
  public async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    if (!this.shouldAudit(event.metadata?.target)) return
    if (!event.entity) return

    const full = await event.manager
      .getRepository(event.metadata.target)
      .findOneBy({ id: event.entity.id })

    if (!full) return

    await event.manager.save(this.options.auditEvent!, {
      entity: event.metadata.targetName,
      entityId: String(event.entity.id),
      action: "update",
      snapshot: { ...full },
      actor: getActor(),
    })
  }

  /**
   * Records a `"delete"` audit event after an entity is removed.
   *
   * Snapshots `event.databaseEntity` (the entity as it was before removal).
   * Silently skips if `event.databaseEntity` is not available.
   *
   * @param event - The TypeORM remove event
   */
  public async afterRemove(event: RemoveEvent<any>): Promise<void> {
    if (!this.shouldAudit(event.metadata?.target)) return
    if (!event.databaseEntity) return

    await event.manager.save(this.options.auditEvent!, {
      entity: event.metadata.targetName,
      entityId: String(event.databaseEntity.id),
      action: "delete",
      snapshot: { ...event.databaseEntity },
      actor: getActor(),
    })
  }

  /**
   * Checks whether an entity class should be audited.
   *
   * Returns `false` if `auditEvent` is not configured or if the entity
   * class does not have the `@Audited()` decorator.
   *
   * @param target - The entity class constructor
   * @returns Whether audit events should be written for this entity
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private shouldAudit(target: Function | string | undefined): boolean {
    if (!this.options.auditEvent) return false
    if (!target || typeof target === "string") return false

    return Reflect.getMetadata(AUDITED_METADATA_KEY, target) === true
  }
}
