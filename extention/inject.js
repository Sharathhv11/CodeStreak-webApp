(function () {
  console.log("[CodeStreak] inject.js loaded");

  // Cache for recently submitted GFG solution info
  let lastGfgSubmission = {
    code: "",
    language: "",
    slug: "",
    timestamp: 0
  };

  // ── Helper: Normalize Language Names ──
  function normalizeLanguage(lang) {
    if (!lang) return "cpp";
    const l = String(lang).toLowerCase().trim();
    if (l.includes("c++") || l === "cpp" || l.includes("c_cpp")) return "cpp";
    if (l.includes("python3") || l === "py3" || l === "python") return "python3";
    if (l.includes("java") && !l.includes("script")) return "java";
    if (l.includes("javascript") || l === "js" || l.includes("node")) return "javascript";
    if (l.includes("typescript") || l === "ts") return "typescript";
    if (l.includes("c#") || l.includes("csharp")) return "csharp";
    if (l.includes("golang") || l === "go") return "go";
    if (l.includes("rust") || l === "rs") return "rust";
    if (l === "c") return "c";
    if (l.includes("kotlin")) return "kotlin";
    if (l.includes("php")) return "php";
    return l;
  }

  // ── Helper: Extract GFG Problem Slug ──
  function getGfgSlug() {
    const match = window.location.pathname.match(/\/problems\/([^\/]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    return lastGfgSubmission.slug || "";
  }

  // ── Helper: Extract GFG Problem Title ──
  function getGfgTitle(slug) {
    const titleEl = document.querySelector(
      "[class*='problem_title'], [class*='problem-title'], [class*='problemTitle'], [class*='problems_problem_title'], h3, h1"
    );
    if (titleEl && titleEl.innerText && titleEl.innerText.trim()) {
      return titleEl.innerText.trim();
    }
    if (document.title) {
      const cleaned = document.title.replace(/\s*[-|]\s*(Practice|GeeksforGeeks).*/gi, "").trim();
      if (cleaned) return cleaned;
    }
    if (slug) {
      return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return "GeeksforGeeks Problem";
  }

  // ── Helper: Extract GFG Code from Memory or DOM/Editor ──
  function getGfgCode() {
    if (lastGfgSubmission && lastGfgSubmission.code && lastGfgSubmission.code.trim()) {
      return lastGfgSubmission.code;
    }
    // 1. Monaco Editor (Global window model)
    try {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          const val = models[0].getValue();
          if (val && val.trim()) return val;
        }
      }
    } catch (e) {}

    // 2. Ace Editor
    try {
      const aceEl = document.querySelector(".ace_editor");
      if (aceEl && window.ace) {
        const editor = window.ace.edit(aceEl);
        const val = editor.getValue();
        if (val && val.trim()) return val;
      }
    } catch (e) {}

    // 3. CodeMirror
    try {
      const cmEl = document.querySelector(".CodeMirror");
      if (cmEl && cmEl.CodeMirror) {
        const val = cmEl.CodeMirror.getValue();
        if (val && val.trim()) return val;
      }
    } catch (e) {}

    // 4. Textarea fallback
    const textarea = document.querySelector("textarea#editor, textarea.code-editor, textarea[name='code']");
    if (textarea && textarea.value && textarea.value.trim()) {
      return textarea.value;
    }

    return "";
  }

  // ── Helper: Extract GFG Language ──
  function getGfgLanguage() {
    if (lastGfgSubmission && lastGfgSubmission.language) {
      return normalizeLanguage(lastGfgSubmission.language);
    }
    // 1. Check DOM selector elements
    const langSelectors = [
      ".select-lang",
      "[data-track-type='language_selected']",
      ".divider.text",
      ".dropdown .text",
      "button[class*='language']",
      "select[name='language'] option:checked",
      ".ant-select-selection-item"
    ];
    for (const sel of langSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        const text = el.innerText.trim();
        if (/^(c\+\+|cpp|java|python|python3|c#|c|javascript|js|typescript|ts|go|golang|rust|kotlin|php)/i.test(text)) {
          return normalizeLanguage(text);
        }
      }
    }

    // 2. Try Ace editor mode
    try {
      const aceEl = document.querySelector(".ace_editor");
      if (aceEl && window.ace) {
        const editor = window.ace.edit(aceEl);
        const mode = editor.getSession()?.getMode()?.$id;
        if (mode) return normalizeLanguage(mode.replace("ace/mode/", ""));
      }
    } catch (e) {}

    // 3. Try Monaco language ID
    try {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          const langId = models[0].getLanguageId();
          if (langId) return normalizeLanguage(langId);
        }
      }
    } catch (e) {}

    return "cpp";
  }

  // ── Helper: Extract GFG Tags & Difficulty ──
  function getGfgTags() {
    const tags = [];
    const diffEl = document.querySelector(
      "[class*='difficulty'], [class*='problem-difficulty'], [class*='problems_difficulty'], .problems_difficulty_level"
    );
    if (diffEl && diffEl.innerText) {
      const diffText = diffEl.innerText.trim();
      if (diffText) {
        tags.push({ name: diffText, slug: diffText.toLowerCase().replace(/\s+/g, "-") });
      }
    }

    const tagEls = document.querySelectorAll(
      "[class*='topicTag'], [class*='topic_tag'], .problem-tags a, a[href*='/tag/'], a[href*='/explore?category=']"
    );
    tagEls.forEach((el) => {
      const text = el.innerText.trim();
      if (text && !tags.some((t) => t.name.toLowerCase() === text.toLowerCase())) {
        tags.push({ name: text, slug: text.toLowerCase().replace(/\s+/g, "-") });
      }
    });

    return tags;
  }

  // ── Helper: Capture outgoing GFG submit payload ──
  function captureGfgSubmitRequest(body) {
    try {
      let parsed = body;
      if (typeof body === "string") {
        try {
          parsed = JSON.parse(body);
        } catch {
          const params = new URLSearchParams(body);
          parsed = Object.fromEntries(params.entries());
        }
      }
      if (parsed && typeof parsed === "object") {
        const code = parsed.source || parsed.code || parsed.user_code || parsed.solution || parsed.user_solution;
        const language = parsed.language || parsed.lang || parsed.lang_name || parsed.language_name;
        const slug = parsed.problem_name || parsed.slug || parsed.problem_slug || getGfgSlug();

        if (code || language || slug) {
          lastGfgSubmission = {
            code: code || lastGfgSubmission.code || "",
            language: language || lastGfgSubmission.language || "",
            slug: slug || getGfgSlug(),
            timestamp: Date.now()
          };
          console.log("[CodeStreak] Captured GFG submit payload →", {
            hasCode: !!lastGfgSubmission.code,
            language: lastGfgSubmission.language,
            slug: lastGfgSubmission.slug
          });
        }
      }
    } catch (e) {
      console.log("[CodeStreak] GFG submit body parse error →", e);
    }
  }

  // ── Helper: Process GFG Submission Result ──
  function handleGfgResult(data) {
    try {
      console.log("[CodeStreak] GFG result response received →", data);
      const isAccepted =
        data?.sub_status === 1 ||
        (data?.status === "SUCCESS" && (data?.view_mode === "correct" || data?.sub_status === 1));

      if (!isAccepted) {
        console.log(
          "[CodeStreak] GFG submission not marked accepted (sub_status:",
          data?.sub_status,
          ", view_mode:",
          data?.view_mode,
          ")"
        );
        return;
      }

      const slug = getGfgSlug() || lastGfgSubmission.slug || "gfg-problem";
      const title = getGfgTitle(slug);
      const language = getGfgLanguage();
      const code = getGfgCode();

      // Format execution time
      const execTime =
        data.time !== undefined
          ? `${data.time}s`
          : data.message?.execution_time !== undefined
          ? `${data.message.execution_time}s`
          : "N/A";

      // Format test case / memory info
      let memory = "N/A";
      if (data.test_cases_processed !== undefined && data.total_test_cases !== undefined) {
        memory = `${data.test_cases_processed}/${data.total_test_cases} Test Cases`;
      } else if (data.message?.accuracy !== undefined) {
        memory = `Accuracy: ${data.message.accuracy}%`;
      }

      const tags = getGfgTags();

      console.log("[CodeStreak] ✅ GFG accepted submission →", {
        slug,
        title,
        language,
        runtime: execTime,
        memory,
        tagsCount: tags.length
      });

      const detectedDiff = tags.find((t) =>
        ["easy", "medium", "hard", "school", "basic"].includes(t.name?.toLowerCase())
      )?.name;

      window.dispatchEvent(
        new CustomEvent("codestreak:submission", {
          detail: {
            slug,
            title,
            language,
            code,
            runtime: execTime,
            memory,
            tags,
            difficulty: detectedDiff || undefined,
            platform: "GeeksforGeeks"
          }
        })
      );
    } catch (err) {
      console.error("[CodeStreak] Error processing GFG result →", err);
    }
  }

  // ── Code360 Cache ──
  let lastCode360Submission = {
    code: "",
    language: "",
    language_token: "",
    slug: "",
    problem_id: null,
    timestamp: 0
  };

  // ── Code360 Helper: Check URL ──
  function isCode360SubmissionListUrl(url) {
    if (!url || typeof url !== "string") return false;
    return (
      url.includes("public_section/submission/list") ||
      url.includes("submission/list")
    );
  }

  // ── Code360 Helper: Extract Slug ──
  function getCode360Slug() {
    const match = window.location.pathname.match(/\/problems\/([^\/\?#]+)/i);
    if (match && match[1]) {
      return match[1].replace(/_\d+$/, "").trim();
    }
    return lastCode360Submission.slug || "";
  }

  // ── Code360 Helper: Extract Title ──
  function getCode360Title(slug) {
    const titleEl = document.querySelector(
      "[data-testid*='problem'], [class*='problemName'], [class*='problem-name'], [class*='problemTitle'], [class*='problem-title'], h1, h2"
    );
    if (titleEl && titleEl.innerText && titleEl.innerText.trim()) {
      return titleEl.innerText.trim();
    }
    if (document.title) {
      const cleaned = document.title
        .replace(/\s*[-|]\s*(Practice|Coding Ninjas|Code360|Naukri).*/gi, "")
        .trim();
      if (cleaned) return cleaned;
    }
    if (slug) {
      return slug
        .replace(/^problem-/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return "Code360 Problem";
  }

  // ── Code360 Helper: Extract Code from Monaco / Memory / DOM ──
  function getCode360Code() {
    if (lastCode360Submission && lastCode360Submission.code && lastCode360Submission.code.trim()) {
      return lastCode360Submission.code;
    }

    // 1. Monaco Editor (Code360 uses Monaco Editor)
    try {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          for (let i = models.length - 1; i >= 0; i--) {
            const uri = models[i].uri ? models[i].uri.toString() : "";
            if (uri.endsWith(".d.ts")) continue;
            const val = models[i].getValue();
            if (val && val.trim().length > 5) return val;
          }
          const val = models[0].getValue();
          if (val && val.trim()) return val;
        }
      }
    } catch (e) {}

    // 2. DOM Monaco view lines fallback
    try {
      const codeLines = document.querySelectorAll(".view-lines .view-line");
      if (codeLines && codeLines.length > 0) {
        const linesText = Array.from(codeLines).map(l => l.innerText || "").join("\n");
        if (linesText && linesText.trim().length > 5) return linesText;
      }
    } catch (e) {}

    // 3. Ace Editor / CodeMirror / Textarea fallback
    try {
      const aceEl = document.querySelector(".ace_editor");
      if (aceEl && window.ace) {
        const val = window.ace.edit(aceEl).getValue();
        if (val && val.trim()) return val;
      }
    } catch (e) {}

    const textarea = document.querySelector("textarea#editor, textarea.code-editor, textarea[name='code'], textarea");
    if (textarea && textarea.value && textarea.value.trim()) {
      return textarea.value;
    }

    return "";
  }

  // ── Code360 Helper: Extract Tags & Difficulty ──
  function getCode360TagsAndDifficulty() {
    const tags = [];
    let detectedDiff = undefined;

    const diffEl = document.querySelector(
      "[class*='difficulty'], [class*='difficulty-level'], [class*='badge-difficulty']"
    );
    if (diffEl && diffEl.innerText) {
      const text = diffEl.innerText.trim();
      if (/easy/i.test(text)) detectedDiff = "Easy";
      else if (/moderate|medium/i.test(text)) detectedDiff = "Medium";
      else if (/hard|ninja/i.test(text)) detectedDiff = "Hard";
      if (detectedDiff) {
        tags.push({ name: detectedDiff, slug: detectedDiff.toLowerCase() });
      }
    }

    const tagEls = document.querySelectorAll(
      "[class*='topicTag'], [class*='topic-tag'], [class*='tag-item'], .chip, a[href*='/tag/']"
    );
    tagEls.forEach((el) => {
      const text = el.innerText.trim();
      if (text && !tags.some((t) => t.name.toLowerCase() === text.toLowerCase())) {
        tags.push({ name: text, slug: text.toLowerCase().replace(/\s+/g, "-") });
      }
    });

    return { tags, difficulty: detectedDiff };
  }

  // ── Code360 Helper: Capture outgoing submit payload ──
  function captureCode360SubmitRequest(url, body) {
    try {
      let parsed = body;
      if (typeof body === "string") {
        try {
          parsed = JSON.parse(body);
        } catch {
          const params = new URLSearchParams(body);
          parsed = Object.fromEntries(params.entries());
        }
      }
      if (parsed && typeof parsed === "object") {
        const code = parsed.source || parsed.code || parsed.user_code || parsed.solution || parsed.user_solution;
        const language = parsed.language || parsed.lang || parsed.lang_name || parsed.language_name;
        const language_token = parsed.language_token || parsed.lang_token;
        const slug = parsed.problem_name || parsed.slug || parsed.problem_slug || getCode360Slug();
        const problem_id = parsed.problem_id || null;

        if (code || language || slug) {
          lastCode360Submission = {
            code: code || lastCode360Submission.code || "",
            language: language || lastCode360Submission.language || "",
            language_token: language_token || lastCode360Submission.language_token || "",
            slug: slug || getCode360Slug(),
            problem_id: problem_id || lastCode360Submission.problem_id,
            timestamp: Date.now()
          };
          console.log("[CodeStreak] Captured Code360 submit payload →", {
            hasCode: !!lastCode360Submission.code,
            language: lastCode360Submission.language,
            slug: lastCode360Submission.slug
          });
        }
      }
    } catch (e) {
      console.log("[CodeStreak] Code360 submit body parse error →", e);
    }
  }

  // ── Code360 Helper: Process Submission Result ──
  function handleCode360Result(responseData, requestUrl) {
    try {
      console.log("[CodeStreak] Code360 result response received →", responseData);
      if (!responseData || typeof responseData !== "object") return;

      const submissions = responseData?.data?.submissions || responseData?.submissions;
      if (!Array.isArray(submissions) || submissions.length === 0) {
        console.log("[CodeStreak] Code360 no submissions found in response");
        return;
      }

      const parser = window.Code360Parser;
      const selected = parser
        ? parser.selectSubmission(submissions)
        : submissions[0];

      if (!selected) return;

      const { tags, difficulty } = getCode360TagsAndDifficulty();
      const slug = getCode360Slug() || (selected.problem_id ? `code360-problem-${selected.problem_id}` : "code360-problem");
      const title = getCode360Title(slug);
      const code = getCode360Code() || selected.code || selected.submission?.code_submission?.code || "";

      let normalized;
      if (parser) {
        normalized = parser.normalizeSubmission(selected, {
          slug,
          title,
          code,
          tags,
          difficulty
        });
      } else {
        const codeSub = selected.submission?.code_submission || selected.code_submission || {};
        let resultJson = codeSub.result_json || {};
        if (typeof resultJson === "string") {
          try { resultJson = JSON.parse(resultJson); } catch { resultJson = {}; }
        }
        const score = Number(selected.percentage_score ?? selected.percentage_score_without_penalty ?? 0);
        const compiled = resultJson.compiled !== undefined ? Boolean(resultJson.compiled) : true;
        const total = Number(resultJson.count?.total ?? 0);
        const passed = Number(resultJson.count?.passed ?? 0);
        const isAccepted = score >= 100 || (compiled && passed === total && total > 0);

        normalized = {
          slug,
          title,
          language: normalizeLanguage(codeSub.language, codeSub.language_token),
          code,
          runtime: codeSub.total_time ? `${codeSub.total_time}s` : "N/A",
          memory: total > 0 ? `${passed}/${total} Test Cases` : "N/A",
          tags,
          difficulty: difficulty || "Medium",
          platform: "Coding Ninjas",
          status: isAccepted ? "accepted" : "wrong_answer"
        };
      }

      if (!normalized || normalized.status !== "accepted") {
        const parser = window.Code360Parser;
        const isPerfect = parser ? parser.isPerfectScore(selected) : (selected && (selected.percentage_score >= 100 || selected.percentage_score_without_penalty >= 100 || selected.is_best || selected.status_message === "Correct Answer"));
        const domAccepted = !!document.querySelector("[class*='accepted'], [class*='Accepted']");
        if (isPerfect || domAccepted) {
          if (normalized) normalized.status = "accepted";
        }
      }

      if (!normalized || normalized.status !== "accepted") {
        console.log("[CodeStreak] Code360 submission not accepted (status:", normalized?.status, ", score:", normalized?.percentage_score, ")");
        return;
      }

      // Ensure code is populated
      if (!normalized.code) {
        normalized.code = getCode360Code() || selected?.code || selected?.submission?.code_submission?.code || "";
      }

      console.log("[CodeStreak] ✅ Code360 accepted submission →", {
        slug: normalized.slug,
        title: normalized.title,
        language: normalized.language,
        runtime: normalized.runtime,
        memory: normalized.memory,
        hasCode: !!normalized.code
      });

      window.dispatchEvent(
        new CustomEvent("codestreak:submission", {
          detail: {
            slug: normalized.slug,
            title: normalized.title,
            language: normalized.language,
            code: normalized.code,
            runtime: normalized.runtime,
            memory: normalized.memory,
            tags: normalized.tags,
            difficulty: normalized.difficulty,
            platform: "Coding Ninjas"
          }
        })
      );
    } catch (err) {
      console.error("[CodeStreak] Error processing Code360 result →", err);
    }
  }

  // ── 1. Intercept fetch ──
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    console.log("[CodeStreak] fetch →", url.substring(0, 120));

    // Capture GFG submit payload if this is a submission request
    if (
      url.includes("problems/submission/submit") &&
      !url.includes("result") &&
      args[1] &&
      args[1].body
    ) {
      captureGfgSubmitRequest(args[1].body);
    }

    // Capture Code360 submit payload if this is a submission request
    if (
      (url.includes("code360") || url.includes("naukri.com") || url.includes("codingninjas")) &&
      (url.includes("submit") || url.includes("run") || url.includes("submission")) &&
      !url.includes("submission/list") &&
      args[1] &&
      args[1].body
    ) {
      captureCode360SubmitRequest(url, args[1].body);
    }

    const response = await originalFetch.apply(this, args);

    // Case A: LeetCode submission
    if (url.includes("/graphql")) {
      try {
        const options = args[1] || {};
        const body = JSON.parse(options.body || "{}");

        if (body.operationName === "submissionDetails") {
          const clone = response.clone();
          const data = await clone.json();
          const details = data?.data?.submissionDetails;

          if (details?.statusCode === 10) {
            console.log("[CodeStreak] ✅ LeetCode accepted →", details.question.titleSlug);
            window.dispatchEvent(
              new CustomEvent("codestreak:submission", {
                detail: {
                  slug: details.question.titleSlug,
                  title: details.question.title,
                  language: details.lang.name,
                  code: details.code,
                  runtime: details.runtimeDisplay,
                  memory: details.memoryDisplay,
                  tags: details.topicTags,
                  difficulty: details.question?.difficulty || undefined,
                  platform: "LeetCode"
                }
              })
            );
          }
        }
      } catch (e) {
        console.log("[CodeStreak] LeetCode fetch parse error →", e);
      }
    }

    // Case B: GeeksforGeeks submission result
    if (url.includes("problems/submission/submit/result") || url.includes("submission/submit/result")) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        handleGfgResult(data);
      } catch (e) {
        console.log("[CodeStreak] GFG fetch result parse error →", e);
      }
    }

    // Case C: Coding Ninjas Code360 submission list result
    if (isCode360SubmissionListUrl(url)) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        handleCode360Result(data, url);
      } catch (e) {
        console.log("[CodeStreak] Code360 fetch result parse error →", e);
      }
    }

    return response;
  };

  // ── 2. Intercept XMLHttpRequest ──
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._codestreakUrl = url;
    this._codestreakMethod = method;
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const url = this._codestreakUrl || "";
    console.log("[CodeStreak] XHR →", this._codestreakMethod, url.substring(0, 120));

    // Capture GFG submit payload
    if (
      url.includes("problems/submission/submit") &&
      !url.includes("result") &&
      body
    ) {
      captureGfgSubmitRequest(body);
    }

    // Capture Code360 submit payload
    if (
      (url.includes("code360") || url.includes("naukri.com") || url.includes("codingninjas")) &&
      (url.includes("submit") || url.includes("run") || url.includes("submission")) &&
      !url.includes("submission/list") &&
      body
    ) {
      captureCode360SubmitRequest(url, body);
    }

    // Case A: LeetCode GraphQL
    if (url.includes("/graphql")) {
      try {
        const parsed = JSON.parse(body || "{}");

        if (parsed.operationName === "submissionDetails") {
          this.addEventListener("load", async () => {
            try {
              let text;
              if (this.responseType === "blob") {
                text = await this.response.text();
              } else {
                text = this.responseText;
              }
              const data = JSON.parse(text);
              const details = data?.data?.submissionDetails;

              if (details?.statusCode === 10) {
                console.log("[CodeStreak] ✅ LeetCode accepted (XHR) →", details.question.titleSlug);
                window.dispatchEvent(
                  new CustomEvent("codestreak:submission", {
                    detail: {
                      slug: details.question.titleSlug,
                      title: details.question.title,
                      language: details.lang.name,
                      code: details.code,
                      runtime: details.runtimeDisplay,
                      memory: details.memoryDisplay,
                      tags: details.topicTags,
                      difficulty: details.question?.difficulty || undefined,
                      platform: "LeetCode"
                    }
                  })
                );
              }
            } catch (e) {
              console.log("[CodeStreak] LeetCode XHR response parse error →", e);
            }
          });
        }
      } catch (e) {}
    }

    // Case B: GeeksforGeeks result
    if (url.includes("problems/submission/submit/result") || url.includes("submission/submit/result")) {
      this.addEventListener("load", async () => {
        try {
          let text;
          if (this.responseType === "blob") {
            text = await this.response.text();
          } else {
            text = this.responseText;
          }
          const data = JSON.parse(text);
          handleGfgResult(data);
        } catch (e) {
          console.log("[CodeStreak] GFG XHR result parse error →", e);
        }
      });
    }

    // Case C: Coding Ninjas Code360 result
    if (isCode360SubmissionListUrl(url)) {
      this.addEventListener("load", async () => {
        try {
          let text;
          if (this.responseType === "blob") {
            text = await this.response.text();
          } else {
            text = this.responseText;
          }
          const data = JSON.parse(text);
          handleCode360Result(data, url);
        } catch (e) {
          console.log("[CodeStreak] Code360 XHR result parse error →", e);
        }
      });
    }

    return originalSend.call(this, body);
  };

  console.log("[CodeStreak] fetch + XHR interceptors installed for LeetCode, GeeksforGeeks & Coding Ninjas Code360");
})();