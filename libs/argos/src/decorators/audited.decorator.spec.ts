import "reflect-metadata"

import { Audited, AUDITED_METADATA_KEY } from "./audited.decorator"

describe("@Audited()", () => {
  describe("Given a class decorated with @Audited()", () => {
    @Audited()
    class DecoratedEntity {}

    it("should set the audited metadata to true", () => {
      const metadata = Reflect.getMetadata(
        AUDITED_METADATA_KEY,
        DecoratedEntity,
      )

      expect(metadata).toBe(true)
    })
  })
})
