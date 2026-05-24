import { describe, it, expect } from "vitest"
import { selectTopics, fisherYatesShuffle } from "../distribution"
import type { Topic } from "@/lib/db/schema"

function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: overrides.id ?? "t-" + Math.random().toString(36).slice(2),
    ai_model_id: overrides.ai_model_id ?? "m1",
    politeness_level: overrides.politeness_level ?? 1,
    theme_cn: overrides.theme_cn ?? "",
    theme_en: overrides.theme_en ?? "",
    content_md: overrides.content_md ?? "# Test",
    content_md_en: overrides.content_md_en ?? "",
    is_active: overrides.is_active ?? true,
    created_at: overrides.created_at ?? new Date().toISOString(),
  }
}

describe("selectTopics", () => {
  it("returns all topics when pool is sufficient", () => {
    const topics = [
      makeTopic({ id: "t1", ai_model_id: "m1" }),
      makeTopic({ id: "t2", ai_model_id: "m2" }),
    ]
    const result = selectTopics(topics, ["m1", "m2"])
    expect(result.error).toBeUndefined()
    expect(result.topics).toHaveLength(2)
  })

  it("works with a single topic", () => {
    const topics = [makeTopic()]
    const result = selectTopics(topics, ["m1"])
    expect(result.error).toBeUndefined()
    expect(result.topics).toHaveLength(1)
  })

  it("returns error when pool is empty", () => {
    const result = selectTopics([], ["m1"])
    expect(result.error).toBeDefined()
    expect(result.topics).toHaveLength(0)
  })

  it("picks 1 topic per model first, then fills remaining", () => {
    const topics = [
      makeTopic({ id: "m1-a", ai_model_id: "m1" }),
      makeTopic({ id: "m1-b", ai_model_id: "m1" }),
      makeTopic({ id: "m2-a", ai_model_id: "m2" }),
    ]
    const result = selectTopics(topics, ["m1", "m2"])
    // m1 has 2 topics, m2 has 1 topic => result should be 3
    expect(result.topics).toHaveLength(3)
    // First topic should be from m1 or m2 (unique models first)
    const modelIds = result.topics.map((t) => t.ai_model_id)
    expect(modelIds.filter((id) => id === "m1").length).toBe(2)
    expect(modelIds.filter((id) => id === "m2").length).toBe(1)
  })
})

describe("fisherYatesShuffle", () => {
  it("returns same length", () => {
    expect(fisherYatesShuffle([1, 2, 3, 4, 5])).toHaveLength(5)
  })

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5]
    expect(fisherYatesShuffle(arr).sort()).toEqual([...arr].sort())
  })

  it("does not mutate original array", () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    fisherYatesShuffle(arr)
    expect(arr).toEqual(copy)
  })
})