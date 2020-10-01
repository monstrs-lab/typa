export type ParamsMetadata = Record<
  number,
  {
    index: number
  }
>

export const assignMetadata = <T>(args: ParamsMetadata, paramtype: T, index: number) => ({
  ...args,
  [`${paramtype}:${index}`]: {
    index,
  },
})
