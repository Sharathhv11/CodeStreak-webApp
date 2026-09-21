// extention/code360Parser.js
// Modular parser for Coding Ninjas Code360 platform

(function (root) {
  const Code360Parser = {
    /**
     * Normalizes language string or token into canonical language identifier
     */
    normalizeLanguage(lang, langToken) {
      const token = (langToken || "").toLowerCase().trim();
      const raw = (lang || "").toLowerCase().trim();

      if (token.includes("py") || raw.includes("python")) return "python3";
      if (token.includes("cpp") || raw.includes("c++") || raw === "cpp") return "cpp";
      if (token.includes("java") && !token.includes("script") && !raw.includes("script")) return "java";
      if (token.includes("js") || token.includes("node") || raw.includes("javascript")) return "javascript";
      if (token.includes("ts") || raw.includes("typescript")) return "typescript";
      if (token.includes("cs") || raw.includes("c#") || raw.includes("csharp")) return "csharp";
      if (token.includes("go") || raw.includes("golang")) return "go";
      if (token.includes("rs") || raw.includes("rust")) return "rust";
      if (raw === "c" || token === "c") return "c";
      if (raw.includes("kotlin") || token.includes("kt")) return "kotlin";
      if (raw.includes("php") || token.includes("php")) return "php";
      if (raw.includes("ruby") || token.includes("rb")) return "ruby";

      return raw || "cpp";
    },

    /**
     * Checks if a given request URL matches the Code360 submission list API
     */
    isSubmissionListUrl(url) {
      if (!url || typeof url !== "string") return false;
      return (
        url.includes("public_section/submission/list") ||
        url.includes("submission/list")
      );
    },

    /**
     * Dynamically extracts query parameters from Code360 submission list URL
     */
    parseUrlParams(url) {
      if (!url || typeof url !== "string") return {};

      try {
        const urlObj = new URL(url, "https://www.naukri.com");
        const params = {};
        for (const [key, value] of urlObj.searchParams.entries()) {
          params[key] = value;
        }
        return {
          offering_id: params.offering_id || null,
          problem_id: params.problem_id || null,
          request_differentiator: params.request_differentiator || null,
          app_context: params.app_context || null,
          naukri_request: params.naukri_request || null,
          ...params,
        };
      } catch {
        const getParam = (param) => {
          const match = url.match(new RegExp(`[?&]${param}=([^&]+)`));
          return match ? decodeURIComponent(match[1]) : null;
        };
        return {
          offering_id: getParam("offering_id"),
          problem_id: getParam("problem_id"),
          request_differentiator: getParam("request_differentiator"),
          app_context: getParam("app_context"),
          naukri_request: getParam("naukri_request"),
        };
      }
    },

    /**
     * Helper to check if a submission item is considered 100% / accepted
     */
    isPerfectScore(s) {
      if (!s || typeof s !== "object") return false;
      const score = Number(s.percentage_score ?? s.percentage_score_without_penalty ?? 0);
      if (score >= 100) return true;

      const codeSub = s.submission?.code_submission || s.code_submission || {};
      let rJson = codeSub.result_json || s.result_json || {};
      if (typeof rJson === "string") {
        try { rJson = JSON.parse(rJson); } catch { rJson = {}; }
      }

      const total = Number(rJson.count?.total ?? codeSub.count?.total ?? s.count?.total ?? 0);
      const passed = Number(rJson.count?.passed ?? codeSub.count?.passed ?? s.count?.passed ?? 0);
      if (total > 0 && passed === total) return true;

      if (s.is_best === true && score > 0) return true;
      if (s.status_message === "Correct Answer" || rJson.status_message === "Correct Answer") return true;

      if (Array.isArray(rJson.test_cases) && rJson.test_cases.length > 0) {
        const allAccepted = rJson.test_cases.every((t) => t.accepted === true);
        if (allAccepted) return true;
      }

      return false;
    },

    /**
     * Selects the most appropriate submission from the Code360 submissions list
     */
    selectSubmission(submissions) {
      if (!Array.isArray(submissions) || submissions.length === 0) {
        return null;
      }

      const subs = [...submissions].filter(Boolean);
      if (subs.length === 0) return null;
      if (subs.length === 1) return subs[0];

      subs.sort((a, b) => {
        const dateA = Number(a.created_date) || 0;
        const dateB = Number(b.created_date) || 0;
        return dateB - dateA;
      });

      const newest = subs[0];
      if (this.isPerfectScore(newest)) return newest;

      const bestSubmission = subs.find((s) => s.is_best && this.isPerfectScore(s));
      if (bestSubmission) return bestSubmission;

      const anyPerfect = subs.find((s) => this.isPerfectScore(s));
      if (anyPerfect) return anyPerfect;

      return newest;
    },

    /**
     * Normalizes Code360 raw submission into universal schema representation
     */
    normalizeSubmission(rawSubmission, context = {}) {
      if (!rawSubmission || typeof rawSubmission !== "object") return null;

      const codeSubmission =
        rawSubmission.submission?.code_submission ||
        rawSubmission.code_submission ||
        {};

      let resultJson = codeSubmission.result_json || rawSubmission.result_json || {};
      if (typeof resultJson === "string") {
        try {
          resultJson = JSON.parse(resultJson);
        } catch {
          resultJson = {};
        }
      }

      const percentageScore = Number(
        rawSubmission.percentage_score ??
          rawSubmission.percentage_score_without_penalty ??
          resultJson.percentage_score ??
          0
      );

      const rawScore = Number(resultJson.score ?? rawSubmission.score ?? 0);

      const countTotal = Number(
        resultJson.count?.total ??
          codeSubmission.count?.total ??
          rawSubmission.count?.total ??
          0
      );

      const countPassed = Number(
        resultJson.count?.passed ??
          codeSubmission.count?.passed ??
          rawSubmission.count?.passed ??
          0
      );

      const compiled =
        resultJson.compiled !== undefined
          ? Boolean(resultJson.compiled)
          : codeSubmission.compiled !== undefined
          ? Boolean(codeSubmission.compiled)
          : rawSubmission.compiled !== undefined
          ? Boolean(rawSubmission.compiled)
          : true;

      const compilationError =
        resultJson.compilation_error ||
        resultJson.compile_error ||
        resultJson.error ||
        codeSubmission.compilation_error ||
        codeSubmission.compile_error ||
        rawSubmission.compilation_error ||
        "";

      let status = "failed";
      if (!compiled || compilationError) {
        status = "compilation_error";
      } else if (
        percentageScore >= 100 ||
        (countPassed === countTotal && countTotal > 0) ||
        (rawSubmission.is_best && (percentageScore >= 100 || countPassed === countTotal)) ||
        this.isPerfectScore(rawSubmission)
      ) {
        status = "accepted";
      } else if (countPassed < countTotal && countTotal > 0) {
        status = "wrong_answer";
      }

      let runtime = "N/A";
      if (codeSubmission.total_time !== undefined && codeSubmission.total_time !== null) {
        runtime = `${codeSubmission.total_time}s`;
      } else if (resultJson.time !== undefined && resultJson.time !== null) {
        runtime = `${resultJson.time}s`;
      } else if (Array.isArray(resultJson.test_cases) && resultJson.test_cases.length > 0) {
        const firstTime = resultJson.test_cases[0]?.time;
        if (firstTime !== undefined && firstTime !== null) {
          runtime = `${firstTime}s`;
        }
      }

      let memory = "N/A";
      if (countTotal > 0) {
        memory = `${countPassed}/${countTotal} Test Cases`;
      }
      if (Array.isArray(resultJson.test_cases) && resultJson.test_cases.length > 0) {
        const firstMem = resultJson.test_cases[0]?.memory;
        if (firstMem) {
          memory = countTotal > 0 ? `${countPassed}/${countTotal} Test Cases (${firstMem})` : String(firstMem);
        }
      }

      const rawLang = codeSubmission.language || rawSubmission.language || context.language || "cpp";
      const langToken = codeSubmission.language_token || rawSubmission.language_token || context.language_token || "";
      const normalizedLang = this.normalizeLanguage(rawLang, langToken);

      const code =
        codeSubmission.code ||
        codeSubmission.source_code ||
        codeSubmission.user_code ||
        rawSubmission.code ||
        rawSubmission.source ||
        context.code ||
        "";

      const slug = context.slug || rawSubmission.problem_slug || `code360-problem-${rawSubmission.problem_id || "unknown"}`;
      const title = context.title || rawSubmission.problem_title || this.slugToTitle(slug);

      return {
        platform: "Coding Ninjas",
        slug,
        title,
        language: normalizedLang,
        raw_language: rawLang,
        language_token: langToken,
        code,
        runtime,
        memory,
        status,
        score: rawScore || percentageScore,
        percentage_score: percentageScore,
        passed_tests: countPassed,
        total_tests: countTotal,
        compiled,
        compilation_error: compilationError,
        is_best: Boolean(rawSubmission.is_best),
        created_date: rawSubmission.created_date || Date.now(),
        problem_id: rawSubmission.problem_id || null,
        offering_id: rawSubmission.offering_id || null,
        tags: Array.isArray(context.tags) ? context.tags : [],
        difficulty: context.difficulty || "Medium",
      };
    },

    slugToTitle(slug) {
      if (!slug) return "Code360 Problem";
      return slug
        .replace(/^problem-/, "")
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },

    parseResponse(responseData, url = "", context = {}) {
      if (!responseData || typeof responseData !== "object") return null;

      const submissions = responseData.data?.submissions || responseData.submissions;
      if (!Array.isArray(submissions) || submissions.length === 0) return null;

      const urlParams = this.parseUrlParams(url);
      const enrichedContext = {
        ...urlParams,
        ...context,
      };

      const selected = this.selectSubmission(submissions);
      if (!selected) return null;

      return this.normalizeSubmission(selected, enrichedContext);
    },
  };

  // Export for browser window or Node environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Code360Parser;
  } else {
    root.Code360Parser = Code360Parser;
  }
})(typeof window !== "undefined" ? window : globalThis);
