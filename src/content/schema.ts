import { z } from 'zod'

const id = z.string().trim().min(1).regex(/^[a-z0-9][a-z0-9-]*$/)
const nonEmptyText = z.string().trim().min(1)

export const categorySchema = z.object({
  id,
  title: nonEmptyText,
  order: z.number().int().nonnegative(),
})

export const findingSchema = z.object({
  id,
  title: nonEmptyText,
  next: z.array(id).min(1),
})

export const methodologyNodeSchema = z.object({
  id,
  wstgId: nonEmptyText.optional(),
  title: nonEmptyText,
  category: id,
  parent: id.optional(),
  order: z.number().int().nonnegative(),
  goal: nonEmptyText,
  why: nonEmptyText.optional(),
  checklist: z.array(nonEmptyText).min(1),
  lookFor: z.array(nonEmptyText).min(1),
  tools: z.array(id).default([]),
  resources: z.array(id).default([]),
  findings: z.array(findingSchema).default([]),
  nextSteps: z.array(id).default([]),
})

export const methodologyFileSchema = z.object({
  version: nonEmptyText,
  categories: z.array(categorySchema).default([]),
  nodes: z.array(methodologyNodeSchema).default([]),
})

export const commandExampleSchema = z.object({
  context: nonEmptyText,
  syntax: nonEmptyText,
})

export const toolSchema = z.object({
  id,
  name: nonEmptyText,
  description: nonEmptyText,
  officialUrl: z.url(),
  examples: z.array(commandExampleSchema).default([]),
})

export const toolFileSchema = z.object({
  tools: z.array(toolSchema).default([]),
})

export const resourceSchema = z.object({
  id,
  title: nonEmptyText,
  url: z.url(),
  tier: z.number().int().min(1).max(4),
  role: z.enum(['Methodology', 'Documentation', 'Learning', 'Practice']),
})

export const resourceFileSchema = z.object({
  resources: z.array(resourceSchema).default([]),
})

export type Category = z.infer<typeof categorySchema>
export type Finding = z.infer<typeof findingSchema>
export type MethodologyNode = z.infer<typeof methodologyNodeSchema>
export type Tool = z.infer<typeof toolSchema>
export type Resource = z.infer<typeof resourceSchema>

export interface RootMapContent {
  version: string
  categories: Category[]
  nodes: MethodologyNode[]
  tools: Tool[]
  resources: Resource[]
}

