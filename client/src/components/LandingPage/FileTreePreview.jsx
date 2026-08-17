import { useState } from 'react';
import { FolderIcon, FileCodeIcon, GithubIcon, SparklesIcon, ChevronDownIcon } from '../icons/index.jsx';

const SAMPLE_FILES = {
  'graphs/number-of-islands-LC200.md': {
    title: '200. Number of Islands',
    platform: 'LeetCode #200',
    category: 'graphs',
    time: 'O(M × N)',
    space: 'O(M × N)',
    codeSnippet: (
      <code>
        <span className="syn-kw">def</span> <span className="syn-fn">numIslands</span>(<span className="syn-self">self</span>, <span className="syn-var">grid</span>: <span className="syn-type">List</span>[<span className="syn-type">List</span>[<span className="syn-type">str</span>]]) -&gt; <span className="syn-type">int</span>:<br />
        {"    "}<span className="syn-comm"># In-place DFS to sink visited islands</span><br />
        {"    "}<span className="syn-var">islands</span> = <span className="syn-num">0</span><br />
        {"    "}<span className="syn-kw">for</span> <span className="syn-var">r</span> <span className="syn-kw">in</span> <span className="syn-builtin">range</span>(<span className="syn-builtin">len</span>(<span className="syn-var">grid</span>)):<br />
        {"        "}<span className="syn-kw">for</span> <span className="syn-var">c</span> <span className="syn-kw">in</span> <span className="syn-builtin">range</span>(<span className="syn-builtin">len</span>(<span className="syn-var">grid</span>[<span className="syn-num">0</span>])):<br />
        {"            "}<span className="syn-kw">if</span> <span className="syn-var">grid</span>[<span className="syn-var">r</span>][<span className="syn-var">c</span>] == <span className="syn-str">'1'</span>:<br />
        {"                "}<span className="syn-self">self</span>.<span className="syn-fn">dfs</span>(<span className="syn-var">grid</span>, <span className="syn-var">r</span>, <span className="syn-var">c</span>)<br />
        {"                "}<span className="syn-var">islands</span> += <span className="syn-num">1</span><br />
        {"    "}<span className="syn-kw">return</span> <span className="syn-var">islands</span>
      </code>
    ),
    notes: 'Classic connected-components DFS on a 2D matrix. In-place modification avoids extra visited set.'
  },
  'arrays/two-sum-LC1.md': {
    title: '1. Two Sum',
    platform: 'LeetCode #1',
    category: 'arrays',
    time: 'O(N)',
    space: 'O(N)',
    codeSnippet: (
      <code>
        <span className="syn-kw">def</span> <span className="syn-fn">twoSum</span>(<span className="syn-self">self</span>, <span className="syn-var">nums</span>: <span className="syn-type">List</span>[<span className="syn-type">int</span>], <span className="syn-var">target</span>: <span className="syn-type">int</span>) -&gt; <span className="syn-type">List</span>[<span className="syn-type">int</span>]:<br />
        {"    "}<span className="syn-var">seen</span> = {}<br />
        {"    "}<span className="syn-kw">for</span> <span className="syn-var">i</span>, <span className="syn-var">num</span> <span className="syn-kw">in</span> <span className="syn-builtin">enumerate</span>(<span className="syn-var">nums</span>):<br />
        {"        "}<span className="syn-var">complement</span> = <span className="syn-var">target</span> - <span className="syn-var">num</span><br />
        {"        "}<span className="syn-kw">if</span> <span className="syn-var">complement</span> <span className="syn-kw">in</span> <span className="syn-var">seen</span>:<br />
        {"            "}<span className="syn-kw">return</span> [<span className="syn-var">seen</span>[<span className="syn-var">complement</span>], <span className="syn-var">i</span>]<br />
        {"        "}<span className="syn-var">seen</span>[<span className="syn-var">num</span>] = <span className="syn-var">i</span><br />
        {"    "}<span className="syn-kw">return</span> []
      </code>
    ),
    notes: 'Single-pass hash table mapping complement values to indices for instant O(1) lookup.'
  },
  'dp/climbing-stairs-LC70.md': {
    title: '70. Climbing Stairs',
    platform: 'LeetCode #70',
    category: 'dp',
    time: 'O(N)',
    space: 'O(1)',
    codeSnippet: (
      <code>
        <span className="syn-kw">def</span> <span className="syn-fn">climbStairs</span>(<span className="syn-self">self</span>, <span className="syn-var">n</span>: <span className="syn-type">int</span>) -&gt; <span className="syn-type">int</span>:<br />
        {"    "}<span className="syn-kw">if</span> <span className="syn-var">n</span> &lt;= <span className="syn-num">2</span>: <span className="syn-kw">return</span> <span className="syn-var">n</span><br />
        {"    "}<span className="syn-var">a</span>, <span className="syn-var">b</span> = <span className="syn-num">1</span>, <span className="syn-num">2</span><br />
        {"    "}<span className="syn-kw">for</span> <span className="syn-var">_</span> <span className="syn-kw">in</span> <span className="syn-builtin">range</span>(<span className="syn-num">3</span>, <span className="syn-var">n</span> + <span className="syn-num">1</span>):<br />
        {"        "}<span className="syn-var">a</span>, <span className="syn-var">b</span> = <span className="syn-var">b</span>, <span className="syn-var">a</span> + <span className="syn-var">b</span><br />
        {"    "}<span className="syn-kw">return</span> <span className="syn-var">b</span>
      </code>
    ),
    notes: 'Fibonacci state transition dp[i] = dp[i-1] + dp[i-2] optimized with two rolling variables.'
  },
  'sliding-window/min-window-substring-LC76.md': {
    title: '76. Minimum Window Substring',
    platform: 'LeetCode #76',
    category: 'sliding-window',
    time: 'O(N)',
    space: 'O(K)',
    codeSnippet: (
      <code>
        <span className="syn-kw">def</span> <span className="syn-fn">minWindow</span>(<span className="syn-self">self</span>, <span className="syn-var">s</span>: <span className="syn-type">str</span>, <span className="syn-var">t</span>: <span className="syn-type">str</span>) -&gt; <span className="syn-type">str</span>:<br />
        {"    "}<span className="syn-comm"># Two-pointer sliding window with match count</span><br />
        {"    "}<span className="syn-var">need</span> = <span className="syn-class">Counter</span>(<span className="syn-var">t</span>)<br />
        {"    "}<span className="syn-var">missing</span> = <span className="syn-builtin">len</span>(<span className="syn-var">t</span>)<br />
        {"    "}<span className="syn-var">left</span> = <span className="syn-var">start</span> = <span className="syn-var">end</span> = <span className="syn-num">0</span><br />
        {"    "}<span className="syn-comm"># dynamically expand &amp; shrink window</span>
      </code>
    ),
    notes: 'Dynamic window expansion until all target characters satisfied, then contract left boundary.'
  },
};

export default function FileTreePreview() {
  const [selectedFile, setSelectedFile] = useState('graphs/number-of-islands-LC200.md');
  const fileData = SAMPLE_FILES[selectedFile];

  return (
    <div className="filetree-preview-container">
      {/* Sidebar: File Tree */}
      <div className="filetree-sidebar">
        <div className="filetree-header">
          <GithubIcon size={14} />
          <span>your-username / codestreak-dsa</span>
        </div>
        <div className="filetree-list">
          {/* Folders */}
          <div className="tree-folder open">
            <div className="folder-label">
              <ChevronDownIcon size={11} />
              <FolderIcon size={13} />
              <span className="folder-name">arrays/</span>
            </div>
            <div className="folder-items">
              <button
                className={`tree-file ${selectedFile === 'arrays/two-sum-LC1.md' ? 'active' : ''}`}
                onClick={() => setSelectedFile('arrays/two-sum-LC1.md')}
              >
                <FileCodeIcon size={13} />
                <span>two-sum-LC1.md</span>
              </button>
            </div>
          </div>

          <div className="tree-folder open">
            <div className="folder-label">
              <ChevronDownIcon size={11} />
              <FolderIcon size={13} />
              <span className="folder-name">graphs/</span>
            </div>
            <div className="folder-items">
              <button
                className={`tree-file ${selectedFile === 'graphs/number-of-islands-LC200.md' ? 'active' : ''}`}
                onClick={() => setSelectedFile('graphs/number-of-islands-LC200.md')}
              >
                <FileCodeIcon size={13} />
                <span>number-of-islands-LC200.md</span>
              </button>
            </div>
          </div>

          <div className="tree-folder open">
            <div className="folder-label">
              <ChevronDownIcon size={11} />
              <FolderIcon size={13} />
              <span className="folder-name">dp/</span>
            </div>
            <div className="folder-items">
              <button
                className={`tree-file ${selectedFile === 'dp/climbing-stairs-LC70.md' ? 'active' : ''}`}
                onClick={() => setSelectedFile('dp/climbing-stairs-LC70.md')}
              >
                <FileCodeIcon size={13} />
                <span>climbing-stairs-LC70.md</span>
              </button>
            </div>
          </div>

          <div className="tree-folder open">
            <div className="folder-label">
              <ChevronDownIcon size={11} />
              <FolderIcon size={13} />
              <span className="folder-name">sliding-window/</span>
            </div>
            <div className="folder-items">
              <button
                className={`tree-file ${selectedFile === 'sliding-window/min-window-substring-LC76.md' ? 'active' : ''}`}
                onClick={() => setSelectedFile('sliding-window/min-window-substring-LC76.md')}
              >
                <FileCodeIcon size={13} />
                <span>min-window-substring-LC76.md</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="filetree-preview-content">
        <div className="preview-top-bar">
          <div className="preview-file-path">
            <span className="path-repo">codestreak-dsa</span>
            <span className="path-sep">/</span>
            <span className="path-active">{selectedFile}</span>
          </div>
          <span className="preview-badge">Markdown Source</span>
        </div>

        <div className="preview-markdown-view">
          <div className="pmv-header">
            <h3>{fileData.title}</h3>
            <div className="pmv-tags">
              <span className="pmv-pill">{fileData.platform}</span>
              <span className="pmv-pill">category: {fileData.category}</span>
            </div>
          </div>

          <div className="pmv-ai-box">
            <div className="pmv-ai-title">
              <SparklesIcon size={14} />
              <span>AI Summary & Complexity</span>
            </div>
            <div className="pmv-complexity-row">
              <span className="pmv-chip">Time: <strong>{fileData.time}</strong></span>
              <span className="pmv-chip">Space: <strong>{fileData.space}</strong></span>
            </div>
            <p className="pmv-notes">{fileData.notes}</p>
          </div>

          <div className="pmv-code-block">
            <div className="pmv-code-label">solution.py</div>
            <pre className="pmv-syntax-code">{fileData.codeSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
