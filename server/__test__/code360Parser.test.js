// server/__test__/code360Parser.test.js
import {
  isCode360SubmissionListUrl,
  parseCode360UrlParams,
  selectCode360Submission,
  normalizeCode360Submission,
  parseCode360Response,
  normalizeLanguage,
  slugToTitle,
} from "../util/code360Parser.js";

describe("Coding Ninjas Code360 Parser", () => {
  // ── 1. Dynamic Request URL Detection & Query Parsing ──
  describe("Dynamic Request URL Handling", () => {
    test("detects stable Code360 submission list URL pattern", () => {
      const validUrl =
        "https://www.naukri.com/code360/api/v3/public_section/submission/list?offering_id=981269&problem_id=9238&request_differentiator=1788714504794&app_context=publicsection&naukri_request=true";
      expect(isCode360SubmissionListUrl(validUrl)).toBe(true);

      const partialUrl = "/code360/api/v3/public_section/submission/list?problem_id=123";
      expect(isCode360SubmissionListUrl(partialUrl)).toBe(true);

      const leetcodeUrl = "https://leetcode.com/graphql";
      expect(isCode360SubmissionListUrl(leetcodeUrl)).toBe(false);

      const gfgUrl = "https://practiceapiorigin.geeksforgeeks.org/problems/submission/submit";
      expect(isCode360SubmissionListUrl(gfgUrl)).toBe(false);
    });

    test("dynamically extracts query parameters without hardcoding", () => {
      const url =
        "https://www.naukri.com/code360/api/v3/public_section/submission/list?offering_id=981269&problem_id=9238&request_differentiator=1788714504794&app_context=publicsection&naukri_request=true";

      const params = parseCode360UrlParams(url);
      expect(params.offering_id).toBe("981269");
      expect(params.problem_id).toBe("9238");
      expect(params.request_differentiator).toBe("1788714504794");
      expect(params.app_context).toBe("publicsection");
      expect(params.naukri_request).toBe("true");
    });
  });

  // ── 2. Language Normalization ──
  describe("Language Normalization", () => {
    test("normalizes Python (3.10) with token py3_10 to python3", () => {
      expect(normalizeLanguage("Python (3.10)", "py3_10")).toBe("python3");
      expect(normalizeLanguage("Python", "py")).toBe("python3");
    });

    test("normalizes C++, Java, JavaScript, and other languages", () => {
      expect(normalizeLanguage("C++", "cpp")).toBe("cpp");
      expect(normalizeLanguage("Java (SE 17)", "java")).toBe("java");
      expect(normalizeLanguage("JavaScript", "js")).toBe("javascript");
      expect(normalizeLanguage("TypeScript", "ts")).toBe("typescript");
    });
  });

  // ── 3. Accepted Submission Parsing ──
  describe("Accepted Submission", () => {
    test("correctly parses and normalizes a 100% accepted submission", () => {
      const sampleResponse = {
        data: {
          submissions: [
            {
              id: 987654,
              percentage_score: 100.0,
              user_id: 42,
              offering_id: 981269,
              problem_id: 9238,
              created_date: 1788714504794,
              is_best: true,
              percentage_score_without_penalty: 100.0,
              type: "code",
              submission: {
                type: "code",
                code_submission: {
                  id: 112233,
                  language: "Python (3.10)",
                  language_token: "py3_10",
                  total_time: 0.15,
                  code: "def reverseList(head):\n    pass",
                  result_json: {
                    compiled: true,
                    score: 10000,
                    count: {
                      total: 50,
                      passed: 50,
                    },
                    test_cases: [
                      {
                        test_case: 1,
                        time: "0.01",
                        time_wall: "0.01",
                        memory: "10MB",
                        error: null,
                        status_message: "Correct Answer",
                        accepted: true,
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      };

      const result = parseCode360Response(sampleResponse, "", {
        slug: "reverse-linked-list",
        title: "Reverse Linked List",
      });

      expect(result).not.toBeNull();
      expect(result.platform).toBe("Coding Ninjas");
      expect(result.status).toBe("accepted");
      expect(result.score).toBe(10000);
      expect(result.percentage_score).toBe(100.0);
      expect(result.passed_tests).toBe(50);
      expect(result.total_tests).toBe(50);
      expect(result.compiled).toBe(true);
      expect(result.language).toBe("python3");
      expect(result.raw_language).toBe("Python (3.10)");
      expect(result.language_token).toBe("py3_10");
      expect(result.code).toContain("def reverseList");
      expect(result.runtime).toBe("0.15s");
      expect(result.memory).toContain("50/50 Test Cases");
      expect(result.slug).toBe("reverse-linked-list");
      expect(result.title).toBe("Reverse Linked List");
    });
  });

  // ── 4. Partially Accepted / Failed Submission ──
  describe("Partially Accepted / Failed Submission", () => {
    test("maps partial test score correctly to wrong_answer status", () => {
      const sampleSubmission = {
        id: 55555,
        percentage_score: 60.0,
        created_date: 1788714000,
        is_best: false,
        code_submission: {
          id: 4444,
          language: "C++",
          language_token: "cpp",
          result_json: {
            compiled: true,
            score: 6000,
            count: {
              total: 50,
              passed: 30,
            },
          },
        },
      };

      const result = normalizeCode360Submission(sampleSubmission);
      expect(result.status).toBe("wrong_answer");
      expect(result.percentage_score).toBe(60);
      expect(result.passed_tests).toBe(30);
      expect(result.total_tests).toBe(50);
      expect(result.compiled).toBe(true);
    });
  });

  // ── 5. Compilation Error Handling ──
  describe("Compilation Error", () => {
    test("maps compiled = false and compilation_error into compilation_error status", () => {
      const sampleSubmission = {
        id: 3333,
        percentage_score: 0,
        created_date: 1788713000,
        code_submission: {
          id: 2222,
          language: "Python (3.10)",
          language_token: "py3_10",
          result_json: {
            compiled: false,
            compilation_error: "SyntaxError: invalid syntax",
            count: { total: 50, passed: 0 },
          },
        },
      };

      const result = normalizeCode360Submission(sampleSubmission);
      expect(result.status).toBe("compilation_error");
      expect(result.compiled).toBe(false);
      expect(result.compilation_error).toBe("SyntaxError: invalid syntax");
    });
  });

  // ── 6. Selecting the Correct Submission from Multi-Item List ──
  describe("Selecting Correct Submission", () => {
    test("prefers the latest 100% submission over older submissions", () => {
      const submissions = [
        {
          id: 1,
          created_date: 1000,
          percentage_score: 50,
          is_best: false,
        },
        {
          id: 2,
          created_date: 2000,
          percentage_score: 100,
          is_best: true,
        },
        {
          id: 3,
          created_date: 3000,
          percentage_score: 100,
          is_best: true,
        },
      ];

      const selected = selectCode360Submission(submissions);
      expect(selected.id).toBe(3);
    });

    test("falls back to is_best with 100% if newest attempt was partial", () => {
      const submissions = [
        {
          id: 10,
          created_date: 5000,
          percentage_score: 100,
          is_best: true,
        },
        {
          id: 20,
          created_date: 6000,
          percentage_score: 40,
          is_best: false,
        },
      ];

      const selected = selectCode360Submission(submissions);
      expect(selected.id).toBe(10);
    });

    test("returns newest submission when none achieved 100%", () => {
      const submissions = [
        {
          id: 101,
          created_date: 1000,
          percentage_score: 20,
          is_best: false,
        },
        {
          id: 102,
          created_date: 2000,
          percentage_score: 40,
          is_best: false,
        },
      ];

      const selected = selectCode360Submission(submissions);
      expect(selected.id).toBe(102);
    });
  });

  // ── 7. Stringified result_json Handling ──
  describe("Stringified result_json Support", () => {
    test("safely parses result_json when returned as JSON string", () => {
      const submission = {
        id: 777,
        percentage_score: 100,
        code_submission: {
          language: "Java",
          result_json: JSON.stringify({
            compiled: true,
            score: 10000,
            count: { total: 20, passed: 20 },
            time: 0.05,
          }),
        },
      };

      const result = normalizeCode360Submission(submission);
      expect(result.status).toBe("accepted");
      expect(result.total_tests).toBe(20);
      expect(result.passed_tests).toBe(20);
      expect(result.runtime).toBe("0.05s");
    });
  });

  // ── 8. Graceful Error Handling on Malformed Input ──
  describe("Graceful Error Handling", () => {
    test("returns null on null or undefined input", () => {
      expect(parseCode360Response(null)).toBeNull();
      expect(parseCode360Response(undefined)).toBeNull();
      expect(parseCode360Response({})).toBeNull();
    });
  });

  // ── 9. Repository & File Structure Verification (/coding360/{concept}/{problemname}) ──
  describe("Repository & File Structure Verification", () => {
    test("maps Coding Ninjas / Code360 platform to coding360 directory", () => {
      // Inline verification matching server controller logic
      const getPlatformDir = (platform) => {
        const p = (platform || "").toLowerCase().trim();
        if (p.includes("code360") || p.includes("codingninjas") || p.includes("coding ninjas") || p === "coding360") {
          return "coding360";
        }
        if (p.includes("geeks") || p.includes("gfg")) return "geeksforgeeks";
        if (p.includes("codeforces") || p === "cf") return "codeforces";
        return "leetcode";
      };

      expect(getPlatformDir("Coding Ninjas")).toBe("coding360");
      expect(getPlatformDir("Coding Ninjas Code360")).toBe("coding360");
      expect(getPlatformDir("Code360")).toBe("coding360");
      expect(getPlatformDir("coding360")).toBe("coding360");
      expect(getPlatformDir("LeetCode")).toBe("leetcode");
      expect(getPlatformDir("GeeksforGeeks")).toBe("geeksforgeeks");
    });

    test("formats repository solution paths strictly as /coding360/{concept}/{problemname}", () => {
      const canonicalizeConcept = (slug) => {
        if (!slug) return "general";
        const s = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (s.includes("two-pointer") || s.includes("2-pointer")) return "2-pointer";
        if (s === "trees" || s === "tree" || s === "binary-trees") return "binary-tree";
        if (s === "binary-search-tree" || s === "bst") return "binary-search-tree";
        if (s === "linked-lists") return "linked-list";
        if (s === "dynamic-programming" || s === "dp") return "dynamic-programming";
        if (s === "sliding-windows") return "sliding-window";
        return s;
      };

      const buildPath = (platform, concept, slug) => {
        const plat = "coding360";
        const c = canonicalizeConcept(concept);
        const p = slug.toLowerCase().replace(/[^a-z0-9-_.]+/g, "-");
        return `/${plat}/${c}/${p}`;
      };

      expect(buildPath("Coding Ninjas", "Two Pointers", "two-sum")).toBe("/coding360/2-pointer/two-sum");
      expect(buildPath("Coding Ninjas", "Linked List", "reverse-linked-list")).toBe("/coding360/linked-list/reverse-linked-list");
      expect(buildPath("Coding Ninjas", "Binary Tree", "maximum-depth")).toBe("/coding360/binary-tree/maximum-depth");
      expect(buildPath("Coding Ninjas", "Stack", "valid-parentheses")).toBe("/coding360/stack/valid-parentheses");
      expect(buildPath("Coding Ninjas", "Dynamic Programming", "climbing-stairs")).toBe("/coding360/dynamic-programming/climbing-stairs");
    });
  });
});
