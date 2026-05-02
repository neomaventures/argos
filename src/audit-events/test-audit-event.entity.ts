import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm"

import { type AuditableEvent } from "@lib"

@Entity()
export class TestAuditEvent implements AuditableEvent {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public entity!: string

  @Column()
  public entityId!: string

  @Column()
  public action!: string

  @Column({ type: "simple-json" })
  public snapshot!: Record<string, any>

  @Column()
  public actor!: string

  @CreateDateColumn()
  public createdAt!: Date
}
