import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { type Repository } from "typeorm"

import { Gadget } from "./gadget.entity"

@Controller("gadgets")
export class GadgetController {
  public constructor(
    @InjectRepository(Gadget)
    private readonly repository: Repository<Gadget>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() body: { name: string }): Promise<Gadget> {
    return this.repository.save(this.repository.create({ name: body.name }))
  }
}
