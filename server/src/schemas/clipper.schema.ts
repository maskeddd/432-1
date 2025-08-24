import { z } from "zod"

export const SegmentSchema = z.object({
	start: z.string(),
	end: z.string(),
})

export const ClipperOptionsSchema = z.object({
	speed: z.number().optional(),
	fade: z.union([z.boolean(), z.number()]).optional(),
	resize: z.string().optional(),
})

export type Segment = z.infer<typeof SegmentSchema>
export type ClipperOptions = z.infer<typeof ClipperOptionsSchema>
