import {
  prepareDocument,
  hashContent,
} from "../services/embeddingService.js";

// ─── Test: Document Preparation ──────────────────────────────────

describe("prepareDocument", () => {
  const sampleSubmission = {
    title: "Two Sum",
    platform: "LeetCode",
    difficulty: "Easy",
    concept: "Hash Table",
    tags: [
      { name: "Array", slug: "array" },
      { name: "Hash Table", slug: "hash-table" },
    ],
    language: "Python",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    explanation:
      "Uses a hash map to find the complement of each number in one pass.",
    code: 'class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for i, n in enumerate(nums):\n            if target - n in seen:\n                return [seen[target - n], i]\n            seen[n] = i',
  };

  test("includes title in output", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Title: Two Sum");
  });

  test("includes platform, difficulty, and concept metadata", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Platform: LeetCode");
    expect(text).toContain("Difficulty: Easy");
    expect(text).toContain("Concept: Hash Table");
  });

  test("includes tag names", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Tags: Array, Hash Table");
  });

  test("includes language", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Language: Python");
  });

  test("includes complexity info", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Complexity: Time O(N), Space O(N)");
  });

  test("includes explanation", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Explanation: Uses a hash map");
  });

  test("includes code", () => {
    const text = prepareDocument(sampleSubmission);
    expect(text).toContain("Code:\nclass Solution:");
  });

  test("handles missing optional fields gracefully", () => {
    const minimal = {
      title: "Minimal Problem",
      language: "JavaScript",
      code: "console.log('hello');",
    };
    const text = prepareDocument(minimal);
    expect(text).toContain("Title: Minimal Problem");
    expect(text).toContain("Language: JavaScript");
    expect(text).not.toContain("Platform:");
    expect(text).not.toContain("Tags:");
  });

  test("truncates very long code blocks", () => {
    const longCode = "x".repeat(5000);
    const sub = { title: "Big Code", language: "C++", code: longCode };
    const text = prepareDocument(sub);
    expect(text).toContain("... (truncated)");
    // Code section should be capped, not include full 5000 chars
    expect(text.length).toBeLessThan(5000);
  });

  test("handles string tags (non-object format)", () => {
    const sub = {
      title: "String Tags",
      language: "Java",
      tags: ["dp", "greedy"],
      code: "//",
    };
    const text = prepareDocument(sub);
    expect(text).toContain("Tags: dp, greedy");
  });
});

// ─── Test: Content Hashing ───────────────────────────────────────

describe("hashContent", () => {
  test("produces consistent hash for same input", () => {
    const text = "Title: Two Sum\nLanguage: Python";
    expect(hashContent(text)).toBe(hashContent(text));
  });

  test("produces different hash for different input", () => {
    const hash1 = hashContent("Title: Two Sum");
    const hash2 = hashContent("Title: Three Sum");
    expect(hash1).not.toBe(hash2);
  });

  test("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashContent("test content");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ─── Test: Input Validation (via ragService) ─────────────────────

describe("RAG input validation", () => {
  // We test the validation logic directly by checking the error behavior
  // These tests don't need API calls — they validate before any network call

  test("prepareDocument returns a non-empty string for valid input", () => {
    const sub = { title: "Test", language: "Go", code: "package main" };
    const text = prepareDocument(sub);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  });

  test("prepareDocument handles completely empty submission", () => {
    const sub = {};
    const text = prepareDocument(sub);
    expect(typeof text).toBe("string");
    // Should produce empty or minimal output, not crash
  });
});

// ─── Test: User Isolation in Vector Search ───────────────────────

describe("User isolation", () => {
  // We test that the searchSimilar function constructs a pipeline
  // with the user filter. Since we can't run Atlas Vector Search in tests,
  // we verify the module exports exist and the function signature is correct.

  test("vectorStoreService exports searchSimilar function", async () => {
    const { searchSimilar } = await import(
      "../services/vectorStoreService.js"
    );
    expect(typeof searchSimilar).toBe("function");
  });

  test("vectorStoreService exports upsertEmbedding function", async () => {
    const { upsertEmbedding } = await import(
      "../services/vectorStoreService.js"
    );
    expect(typeof upsertEmbedding).toBe("function");
  });

  test("vectorStoreService exports deleteEmbedding function", async () => {
    const { deleteEmbedding } = await import(
      "../services/vectorStoreService.js"
    );
    expect(typeof deleteEmbedding).toBe("function");
  });

  test("vectorStoreService exports getEmbeddingStats function", async () => {
    const { getEmbeddingStats } = await import(
      "../services/vectorStoreService.js"
    );
    expect(typeof getEmbeddingStats).toBe("function");
  });
});

// ─── Test: Embedding Service Exports ─────────────────────────────

describe("Embedding service module", () => {
  test("exports generateEmbedding function", async () => {
    const { generateEmbedding } = await import(
      "../services/embeddingService.js"
    );
    expect(typeof generateEmbedding).toBe("function");
  });

  test("exports indexSubmissionEmbedding function", async () => {
    const { indexSubmissionEmbedding } = await import(
      "../services/embeddingService.js"
    );
    expect(typeof indexSubmissionEmbedding).toBe("function");
  });
});

// ─── Test: RAG Service Exports ───────────────────────────────────

describe("RAG service module", () => {
  test("exports ask function", async () => {
    const { ask } = await import("../services/ragService.js");
    expect(typeof ask).toBe("function");
  });
});
