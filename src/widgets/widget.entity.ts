import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

import { CreatedBy, UpdatedBy } from "../../libs/argos/src"

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
