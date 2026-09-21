import { useState, useRef, useEffect, useCallback } from 'react';
import './ChatWindow.css';
import { API_ENDPOINTS } from '../../utils/constants';
import { SparklesIcon, SendIcon } from '../icons/index.jsx';

// ── Minimal Markdown Renderer ──────────────────────────────────────
// Converts markdown-ish text to safe HTML for chat bubbles.
// Handles: bold, inline code, code blocks, headings, lists, line breaks.

// Helper to clean messy or noisy titles that might contain code snippets
function cleanTitle(raw) {
  if (!raw) return 'Untitled';
  let cleaned = raw.split(/\r?\n/)[0];
  cleaned = cleaned.replace(/class\s+Solution.*$/i, '');
  cleaned = cleaned.replace(/[{};()=].*$/, '');
  cleaned = cleaned.trim();
  if (!cleaned) cleaned = raw.trim().slice(0, 35);
  if (cleaned.length > 35) {
    return cleaned.slice(0, 32) + '...';
  }
  return cleaned;
}

// ── Enhanced Markdown Renderer ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><div class="code-header">${lang || 'code'}</div><code>${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold (**...**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (*...*)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Difficulty & Platform Badges in markdown: `[Hard]`, `[Medium]`, `[Easy]`, `[LeetCode]`, etc.
  html = html.replace(/\[(Hard)\]/gi, '<span class="badge-tag hard">$1</span>');
  html = html.replace(/\[(Medium)\]/gi, '<span class="badge-tag medium">$1</span>');
  html = html.replace(/\[(Easy)\]/gi, '<span class="badge-tag easy">$1</span>');
  html = html.replace(/\[(LeetCode|GeeksforGeeks|HackerRank|CodeForces)\]/gi, '<span class="badge-tag platform">$1</span>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');

  // Blockquotes (> ...)
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Numbered lists (1. item)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>');

  // Unordered lists (- item or * item)
  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');

  // Group consecutive <li> elements into <ul>
  html = html.replace(/((?:<li(?: class="numbered")?>.*?<\/li>\s*)+)/g, (match) => {
    return `<ul>${match}</ul>`;
  });

  // Split double-newlines into paragraphs
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote)/i.test(p)) {
        return p.replace(/\n/g, '<br/>');
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return html;
}

// ── Suggested Questions ────────────────────────────────────────────

const SUGGESTIONS = [
  "What patterns have I practiced the most?",
  "Show me my hardest problems",
  "Which concepts should I revise?",
  "Summarize my dynamic programming solutions",
];

// ── Chat Window Component ──────────────────────────────────────────

export default function ChatWindow({ token, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Send Message ──────────────────────────────────────────────
  const sendMessage = useCallback(async (question) => {
    const trimmed = (question || input).trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API_ENDPOINTS.RAG_ASK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Request failed (${res.status})`);
      }

      const data = await res.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.data?.answer || 'No response generated.',
        references: data.data?.references || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, token]);

  // ── Keyboard Handler ──────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ── Auto-resize Textarea ──────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  // ── Format Timestamp ──────────────────────────────────────────
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-icon">
            <SparklesIcon size={18} />
          </div>
          <div className="chat-header-info">
            <h3>AI Coding Assistant</h3>
            <p>Ask questions about your coding practice</p>
          </div>
        </div>
        <div className="chat-status-badge">
          <span className="chat-status-dot" />
          Online
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="chat-error">
          <span>⚠ {error}</span>
          <button
            className="chat-error-dismiss"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !loading ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <SparklesIcon size={26} />
            </div>
            <h4>Ask about your coding journey</h4>
            <p>
              I can help you explore your solved problems, find patterns in your
              practice, and suggest areas for improvement — all grounded in your
              own data.
            </p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chat-suggestion-btn"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div className="chat-message-avatar">
                  {msg.role === 'user' ? (
                    <img
                      src={user?.avatar_url || 'https://github.com/ghost.png'}
                      alt={user?.github_username || 'You'}
                    />
                  ) : (
                    <SparklesIcon size={14} />
                  )}
                </div>
                <div className="chat-message-content">
                  <div
                    className="chat-bubble"
                    dangerouslySetInnerHTML={{
                      __html:
                        msg.role === 'assistant'
                          ? renderMarkdown(msg.content)
                          : msg.content
                              .replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;'),
                    }}
                  />
                  {/* References for assistant messages */}
                  {msg.role === 'assistant' &&
                    msg.references?.length > 0 && (
                      <div className="chat-references">
                        <div className="chat-references-label">
                          Referenced Problems ({Array.from(new Map(msg.references.map(r => [cleanTitle(r.title), r])).values()).length})
                        </div>
                        <div className="chat-references-list">
                          {Array.from(
                            new Map(
                              msg.references.map((r) => [cleanTitle(r.title), r])
                            ).values()
                          ).map((ref, i) => (
                            <span
                              key={i}
                              className="chat-ref-chip"
                              title={ref.title}
                            >
                              <span className="chat-ref-name">
                                {cleanTitle(ref.title)}
                              </span>
                              <span className="chat-ref-platform">
                                {ref.platform}
                              </span>
                              {ref.difficulty && (
                                <span
                                  className={`chat-ref-difficulty ${ref.difficulty.toLowerCase()}`}
                                >
                                  {ref.difficulty}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  <div className="chat-message-time">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-message-avatar">
                  <SparklesIcon size={14} />
                </div>
                <div className="chat-message-content">
                  <div className="chat-bubble">
                    <div className="chat-typing">
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your coding problems..."
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            title="Send message"
            aria-label="Send message"
          >
            <SendIcon size={16} />
          </button>
        </div>
        <div className="chat-input-hint">
          Answers are grounded in your saved problems · Press Enter to send
        </div>
      </div>
    </div>
  );
}
