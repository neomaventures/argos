import "reflect-metadata"

/**
 * Metadata key used by {@link Audited} to mark entity classes for audit tracking.
 *
 * The audit subscriber checks this key to determine whether an entity's
 * changes should be recorded in the audit trail.
 */
export const AUDITED_METADATA_KEY = Symbol("AUDITED_METADATA_KEY")

/**
 * Class decorator that marks a TypeORM entity for automatic audit tracking.
 *
 * When an entity decorated with `@Audited()` is created, updated, or deleted
 * via `repository.save()` / `repository.remove()`, the audit subscriber writes
 * a full snapshot to the configured audit event table.
 *
 * Entities without this decorator are silently ignored by the subscriber.
 *
 * @example
 * ```typescript
 * @Audited()
 * @Entity()
 * export class Invoice {
 *   @PrimaryGeneratedColumn("uuid")
 *   public id!: string
 *
 *   @Column()
 *   public total!: number
 * }
 * ```
 */

export function Audited(): (target: new (...args: any[]) => any) => void {
  return (target: new (...args: any[]) => any): void => {
    Reflect.defineMetadata(AUDITED_METADATA_KEY, true, target)
  }
}
