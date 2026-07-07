(function () {
  console.log("inject.js loaded");

  // ── 1. Intercept fetch ──
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    console.log("[CodeStreak] fetch →", url.substring(0, 120));

    const response = await originalFetch.apply(this, args);

    if (url.includes("/graphql")) {
      try {
        const options = args[1] || {};
        const body = JSON.parse(options.body || "{}");
        console.log("[CodeStreak] fetch graphql op →", body.operationName);

        if (body.operationName === "submissionDetails") {
          const clone = response.clone();
          const data = await clone.json();
          const details = data?.data?.submissionDetails;

          if (details?.statusCode === 10) {
            console.log("[CodeStreak] ✅ accepted →", details.question.titleSlug);
            window.dispatchEvent(new CustomEvent("codestreak:submission", {
              detail: {
                slug: details.question.titleSlug,
                language: details.lang.name,
                code: details.code,
                runtime: details.runtimeDisplay,
                memory: details.memoryDisplay,
                tags: details.topicTags,
              }
            }));
          }
        }
      } catch (e) {
        console.log("[CodeStreak] fetch parse error →", e);
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

    if (url.includes("/graphql")) {
      try {
        const parsed = JSON.parse(body || "{}");
        console.log("[CodeStreak] XHR graphql op →", parsed.operationName);

        if (parsed.operationName === "submissionDetails") {
          this.addEventListener("load", async () => {
            try {
              // LeetCode sets responseType='blob', so read response as Blob
              let text;
              if (this.responseType === "blob") {
                text = await this.response.text();
              } else {
                text = this.responseText;
              }
              const data = JSON.parse(text);
              const details = data?.data?.submissionDetails;

              if (details?.statusCode === 10) {
                window.dispatchEvent(new CustomEvent("codestreak:submission", {
                  detail: {
                    slug: details.question.titleSlug,
                    language: details.lang.name,
                    code: details.code,
                    runtime: details.runtimeDisplay,
                    memory: details.memoryDisplay,
                    tags: details.topicTags,
                  }
                }));
              }
            } catch (e) {
              console.log("[CodeStreak] XHR response parse error →", e);
            }
          });
        }
      } catch (e) { }
    }
    return originalSend.call(this, body);
  };

  console.log("[CodeStreak] fetch + XHR interceptors installed");
})();