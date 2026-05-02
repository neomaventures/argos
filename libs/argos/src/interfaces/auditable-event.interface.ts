/**
 * Contract for a consumer-provided audit event entity.
 *
 * The consumer creates their own TypeORM entity that implements this
 * interface and passes its constructor to {@link ArgosOptions.auditEvent}.
 * Argos writes audit rows to that entity's table.
 *
 * @example
 * ```typescript
 * @Entity()
 * export class AuditEvent implements AuditableEvent {
 *   @PrimaryGeneratedColumn("uuid")
 *   public id!: string
 *
 *   @Column()
 *   public entity!: string
 *
 *   @Column()
 *   public entityId!: string
 *
 *   @Column()
 *   public action!: string
 *
 *   @Column({ type: "simple-json" })
 *   public snapshot!: Record<string, any>
 *
 *   @Column()
 *   public actor!: string
 *
 *   @CreateDateColumn()
 *   public createdAt!: Date
 * }
 * ```
 */
export interface AuditableEvent {
  /** Primary key (typically a UUID). */
  id: string

  /** Name of the audited entity class (e.g. `"Widget"`). */
  entity: string

  /** Primary key of the audited entity instance. */
  entityId: string

  /** The action that produced this event: `"create"`, `"update"`, or `"delete"`. */
  action: string

  /** Full snapshot of the audited entity at the time of the action. */
  snapshot: Record<string, any>

  /** Actor string resolved from AsyncLocalStorage (e.g. `"principal:abc123"`). */
  actor: string

  /** Timestamp when the action occurred. */
  createdAt: Date
}
