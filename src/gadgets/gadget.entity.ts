import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Gadget {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  public name!: string
}
