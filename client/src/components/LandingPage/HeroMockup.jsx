import { useState } from 'react';
import { GitBranchIcon, SparklesIcon, ZapIcon, DatabaseIcon, TagIcon, CheckIcon } from '../icons/index.jsx';

export default function HeroMockup() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hero-mockup-window">
      {/* Window Titlebar */}
      <div className="mockup-titlebar">
        <div className="mockup-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="mockup-file-tab">
          <GitBranchIcon size={13} />
          <span className="mockup-branch">main</span>
          <span className="mockup-slash">/</span>
          <span className="mockup-filename">graphs/number-of-islands-LC200.md</span>
        </div>
        <div className="mockup-status-badge">
          <span className="status-pulse" />
          <span>Synced to GitHub</span>
        </div>
      </div>

      {/* Code Editor / Markdown View */}
      <div className="mockup-editor-body">
        {/* Markdown Document Header */}
        <div className="mockup-md-header">
          <div className="mockup-md-title-row">
            <span className="md-hash">#</span>
            <h2 className="mockup-problem-title">200. Number of Islands</h2>
            <span className="platform-tag leetcode">LeetCode</span>
            <span className="diff-tag medium">Medium</span>
          </div>

          <div className="mockup-meta-pills">
            <span className="meta-pill">
              <ZapIcon size={12} />
              <span>Runtime: <strong>248ms (top 92%)</strong></span>
            </span>
            <span className="meta-pill">
              <DatabaseIcon size={12} />
              <span>Memory: <strong>19.2 MB</strong></span>
            </span>
            <span className="meta-pill">
              <TagIcon size={11} />
              <span>#graphs</span>
            </span>
            <span className="meta-pill">
              <TagIcon size={11} />
              <span>#dfs-bfs</span>
            </span>
            <span className="meta-pill">
              <TagIcon size={11} />
              <span>#matrix</span>
            </span>
          </div>
        </div>

        {/* Code Snippet Block with Rich IDE Syntax Highlighting */}
        <div className="mockup-code-container">
          <div className="mockup-code-header">
            <div className="code-lang-indicator">
              <span className="lang-circle" />
              <span>solution.py</span>
            </div>
            <button className="code-copy-btn" onClick={handleCopy}>
              {copied ? <CheckIcon size={12} /> : null}
              <span>{copied ? 'Copied' : 'Copy markdown'}</span>
            </button>
          </div>
          <pre className="mockup-code-content">
            <code>
              <span className="syn-kw">class</span> <span className="syn-class">Solution</span>:<br />
              {"    "}<span className="syn-kw">def</span> <span className="syn-fn">numIslands</span>(<span className="syn-self">self</span>, <span className="syn-var">grid</span>: <span className="syn-type">List</span>[<span className="syn-type">List</span>[<span className="syn-type">str</span>]]) -&gt; <span className="syn-type">int</span>:<br />
              {"        "}<span className="syn-kw">if not</span> <span className="syn-var">grid</span>:<br />
              {"            "}<span className="syn-kw">return</span> <span className="syn-num">0</span><br /><br />
              {"        "}<span className="syn-var">rows</span>, <span className="syn-var">cols</span> = <span className="syn-builtin">len</span>(<span className="syn-var">grid</span>), <span className="syn-builtin">len</span>(<span className="syn-var">grid</span>[<span className="syn-num">0</span>])<br />
              {"        "}<span className="syn-var">islands</span> = <span className="syn-num">0</span><br /><br />
              {"        "}<span className="syn-kw">def</span> <span className="syn-fn">dfs</span>(<span className="syn-var">r</span>, <span className="syn-var">c</span>):<br />
              {"            "}<span className="syn-kw">if</span> <span className="syn-var">r</span> &lt; <span className="syn-num">0</span> <span className="syn-kw">or</span> <span className="syn-var">r</span> &gt;= <span className="syn-var">rows</span> <span className="syn-kw">or</span> <span className="syn-var">c</span> &lt; <span className="syn-num">0</span> <span className="syn-kw">or</span> <span className="syn-var">c</span> &gt;= <span className="syn-var">cols</span> <span className="syn-kw">or</span> <span className="syn-var">grid</span>[<span className="syn-var">r</span>][<span className="syn-var">c</span>] != <span className="syn-str">'1'</span>:<br />
              {"                "}<span className="syn-kw">return</span><br />
              {"            "}<span className="syn-var">grid</span>[<span className="syn-var">r</span>][<span className="syn-var">c</span>] = <span className="syn-str">'#'</span>  <span className="syn-comm"># mark visited sink island</span><br />
              {"            "}<span className="syn-kw">for</span> <span className="syn-var">dr</span>, <span className="syn-var">dc</span> <span className="syn-kw">in</span> [(<span className="syn-num">1</span>,<span className="syn-num">0</span>), (-<span className="syn-num">1</span>,<span className="syn-num">0</span>), (<span className="syn-num">0</span>,<span className="syn-num">1</span>), (<span className="syn-num">0</span>,-<span className="syn-num">1</span>)]:<br />
              {"                "}<span className="syn-fn">dfs</span>(<span className="syn-var">r</span> + <span className="syn-var">dr</span>, <span className="syn-var">c</span> + <span className="syn-var">dc</span>)<br /><br />
              {"        "}<span className="syn-kw">for</span> <span className="syn-var">r</span> <span className="syn-kw">in</span> <span className="syn-builtin">range</span>(<span className="syn-var">rows</span>):<br />
              {"            "}<span className="syn-kw">for</span> <span className="syn-var">c</span> <span className="syn-kw">in</span> <span className="syn-builtin">range</span>(<span className="syn-var">cols</span>):<br />
              {"                "}<span className="syn-kw">if</span> <span className="syn-var">grid</span>[<span className="syn-var">r</span>][<span className="syn-var">c</span>] == <span className="syn-str">'1'</span>:<br />
              {"                    "}<span className="syn-fn">dfs</span>(<span className="syn-var">r</span>, <span className="syn-var">c</span>)<br />
              {"                    "}<span className="syn-var">islands</span> += <span className="syn-num">1</span><br />
              {"        "}<span className="syn-kw">return</span> <span className="syn-var">islands</span>
            </code>
          </pre>
        </div>

        {/* AI Complexity & Notes Section */}
        <div className="mockup-ai-card">
          <div className="ai-card-top">
            <div className="ai-card-title">
              <SparklesIcon size={14} />
              <span>AI Complexity Breakdown & Intuition</span>
            </div>
            <div className="ai-bigo-badges">
              <span className="bigo-chip">Time: <strong>O(M × N)</strong></span>
              <span className="bigo-chip">Space: <strong>O(M × N)</strong></span>
            </div>
          </div>
          <p className="ai-summary-text">
            <strong>Key Pattern:</strong> Connected component traversal via in-place mutation. Modifying visited land <code className="inline-code">'1' → '#'</code> saves an extra <em>O(M×N)</em> boolean visited matrix. Traversal visits each cell at most 4 times.
          </p>
        </div>

        {/* Git Action Footer */}
        <div className="mockup-git-bar">
          <div className="git-commit-info">
            <span className="git-sha">8a4f19c</span>
            <span className="git-msg">commit: auto-sync 200. Number of Islands [graphs/dfs]</span>
          </div>
          <span className="git-time">Pushed to your repo just now</span>
        </div>
      </div>
    </div>
  );
}
