import { type Request } from "express"

export const ARGOS_OPTIONS = Symbol("ARGOS_OPTIONS")

export interface ArgosOptions {
  /**
   * The actor string used when `resolveActor` is not defined, returns
   * `null`/`undefined`, or when no request context exists.
   *
   * @default "system"
   */
  defaultActor?: string

  /**
   * Extracts the actor string from the incoming request.
   *
   * The returned value is stored in AsyncLocalStorage for the
   * duration of the request. If the function returns `null` or
   * `undefined`, the actor falls back to {@link defaultActor}.
   *
   * @param req - The Express request object
   * @returns The actor string, or null/undefined to use the default
   *
   * @example
   * ```typescript
   * ArgosModule.forRoot({
   *   resolveActor: (req) => req.principal
   *     ? `principal:${req.principal.id}`
   *     : null,
   * })
   * ```
   */
  resolveActor?: (
    req: Request,
  ) => string | null | undefined | Promise<string | null | undefined>
}
