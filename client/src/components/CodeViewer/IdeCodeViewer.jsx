import { useState, useMemo } from 'react';
import './IdeCodeViewer.css';

/**
 * High-performance regex-based IDE syntax highlighter for Python, JS/TS, C++, Java, and Go.
 */
function highlightCode(code, language = '') {
  if (!code) return [];

  const lang = (language || '').toLowerCase();
  const lines = code.split('\n');

  // Regex patterns for tokens
  const pythonKeywords = /\b(def|class|if|elif|else|while|for|in|return|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|yield|is|not|and|or|global|nonlocal|assert|del|async|await)\b/g;
  const jsCppJavaKeywords = /\b(function|class|if|else|while|for|in|of|return|import|from|export|default|const|let|var|try|catch|finally|throw|new|typeof|instanceof|void|public|private|protected|static|final|abstract|interface|implements|extends|override|switch|case|break|continue|struct|typedef|template|typename|auto|namespace|using)\b/g;

  const keywordRegex = lang.includes('python') || lang.includes('py') ? pythonKeywords : jsCppJavaKeywords;
  const builtinsRegex = /\b(self|this|cls|super|len|range|enumerate|zip|min|max|sum|abs|sorted|map|filter|print|console|Math|Array|Object|String|Number|Boolean|vector|unordered_map|unordered_set|queue|stack|priority_queue|pair|cin|cout)\b/g;
  const typeRegex = /\b(Solution|List|Dict|Set|Tuple|Optional|Union|TreeNode|ListNode|Node|int|float|str|bool|char|double|long|short|void|string|boolean|Integer|Double|Character|ArrayList|HashMap|HashSet)\b/g;
  const constantRegex = /\b(True|False|None|true|false|null|nullptr|undefined|NaN|Infinity)\b/g;
  const numberRegex = /\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g;
  const commentRegex = /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/;

  return lines.map((line, lineIdx) => {
    // Check if line contains a comment
    const commentMatch = line.match(commentRegex);
    let codePart = line;
    let commentPart = '';

    if (commentMatch) {
      const idx = commentMatch.index;
      codePart = line.slice(0, idx);
      commentPart = line.slice(idx);
    }

    // Tokenize strings inside codePart first
    // Splitting by strings while preserving them
    const stringSplitRegex = /(".*?"|'.*?'|`.*?`)/g;
    const parts = codePart.split(stringSplitRegex);

    const tokens = [];

    parts.forEach((part, partIdx) => {
      if (!part) return;

      // If this part is a string literal
      if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
        tokens.push(<span key={`str-${lineIdx}-${partIdx}`} className="token-string">{part}</span>);
        return;
      }

      // Tokenize words, numbers, and symbols in code segment
      const wordTokenRegex = /([a-zA-Z_]\w*|-?\d+(?:\.\d+)?|[()\[\]{}:.,;+\-*\/%=<>!&|^~]+|\s+)/g;
      let match;
      let tokenIdx = 0;

      while ((match = wordTokenRegex.exec(part)) !== null) {
        const text = match[0];
        const key = `tok-${lineIdx}-${partIdx}-${tokenIdx++}`;

        if (text.match(keywordRegex)) {
          tokens.push(<span key={key} className="token-keyword">{text}</span>);
        } else if (text.match(constantRegex)) {
          tokens.push(<span key={key} className="token-constant">{text}</span>);
        } else if (text.match(builtinsRegex)) {
          tokens.push(<span key={key} className="token-builtin">{text}</span>);
        } else if (text.match(typeRegex)) {
          tokens.push(<span key={key} className="token-type">{text}</span>);
        } else if (text.match(numberRegex)) {
          tokens.push(<span key={key} className="token-number">{text}</span>);
        } else if (/^[a-zA-Z_]\w*$/.test(text)) {
          // Check if function name (followed by '(')
          const nextChars = part.slice(match.index + text.length).trim();
          if (nextChars.startsWith('(')) {
            tokens.push(<span key={key} className="token-function">{text}</span>);
          } else {
            tokens.push(<span key={key} className="token-variable">{text}</span>);
          }
        } else if (/^[()\[\]{}:.,;+\-*\/%=<>!&|^~]+$/.test(text)) {
          tokens.push(<span key={key} className="token-operator">{text}</span>);
        } else {
          tokens.push(<span key={key}>{text}</span>);
        }
      }
    });

    if (commentPart) {
      tokens.push(<span key={`com-${lineIdx}`} className="token-comment">{commentPart}</span>);
    }

    return tokens;
  });
}

export default function IdeCodeViewer({
  code = '',
  language = 'python3',
  fileName = 'Solution.py',
}) {
  const [copied, setCopied] = useState(false);

  const highlightedLines = useMemo(() => {
    return highlightCode(code, language);
  }, [code, language]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = highlightedLines.length || 1;

  // Determine file extension
  const displayFileName = useMemo(() => {
    if (fileName) return fileName;
    const l = (language || '').toLowerCase();
    if (l.includes('py')) return 'Solution.py';
    if (l.includes('cpp') || l.includes('c++')) return 'Solution.cpp';
    if (l.includes('java')) return 'Solution.java';
    if (l.includes('js') || l.includes('javascript')) return 'Solution.js';
    if (l.includes('ts') || l.includes('typescript')) return 'Solution.ts';
    return 'Solution.code';
  }, [fileName, language]);

  return (
    <div className="ide-code-viewer-container">
      {/* ── IDE Top Bar (macOS / VS Code Window Style) ─────────── */}
      <div className="ide-toolbar">
        <div className="ide-window-dots">
          <span className="window-dot red" />
          <span className="window-dot yellow" />
          <span className="window-dot green" />
        </div>

        <div className="ide-tab-active">
          <span className="ide-file-icon">⚡</span>
          <span className="ide-file-name">{displayFileName}</span>
          <span className="ide-lang-chip">{language || 'code'}</span>
        </div>

        <div className="ide-toolbar-right">
          <span className="ide-lines-count">{lineCount} lines</span>
          <button className="ide-copy-btn" onClick={handleCopy} title="Copy solution code">
            {copied ? (
              <span className="copied-text">✓ Copied</span>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Code Editor Body with Line Numbers Gutter ─────────── */}
      <div className="ide-editor-body">
        {/* Line Numbers Gutter */}
        <div className="ide-gutter" aria-hidden="true">
          {highlightedLines.map((_, idx) => (
            <div key={idx} className="gutter-number">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Highlighted Code Lines */}
        <pre className="ide-code-content">
          <code>
            {highlightedLines.map((tokens, idx) => (
              <div key={idx} className="ide-code-line">
                {tokens.length > 0 ? tokens : ' '}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
