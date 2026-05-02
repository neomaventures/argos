import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

import { Audited, CreatedBy, UpdatedBy } from "@lib"

@Audited()
@Entity()
export class Widget {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public name!: string

  @CreatedBy()
  public createdBy!: string

  @UpdatedBy()
  public updatedBy!: string
}
