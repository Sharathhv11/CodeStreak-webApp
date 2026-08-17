import { useState } from 'react';
import './LandingPage.css';
import logoImg from '../../assets/codestreak.png';
import HeroMockup from './HeroMockup';
import FileTreePreview from './FileTreePreview';
import {
  GithubIcon,
  ChromeIcon,
  SearchIcon,
  BrainIcon,
  HeatmapIcon,
  FolderTreeIcon,
  FolderIcon,
  CodeIcon,
  ScatteredChartsIcon,
  ConfusedRevisionIcon,
  DisappearingFileIcon,
  CheckIcon,
  ArrowRightIcon,
  TerminalIcon,
} from '../icons/index.jsx';

export default function LandingPage({ onLogin, onGoToDashboard, user }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-wrapper">
      {/* ── Background Grid & Lighting ────────────────────────── */}
      <div className="landing-ambient-glow" />
      <div className="landing-grid-bg" />

      {/* ── Sticky Top Navbar ─────────────────────────────────── */}
      <header className="landing-navbar">
        <div className="nav-container">
          <div className="landing-logo-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoImg} alt="CodeStreak" className="landing-nav-logo" />
          </div>

          <nav className="landing-nav-links">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How it Works</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#github-first" onClick={(e) => { e.preventDefault(); scrollToSection('github-first'); }}>GitHub First</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
          </nav>

          <div className="landing-nav-actions">
            {user ? (
              <button className="nav-dashboard-btn" onClick={onGoToDashboard}>
                <span>Go to Dashboard</span>
                <ArrowRightIcon size={14} />
              </button>
            ) : (
              <>
                <button className="nav-signin-btn" onClick={onLogin}>
                  <span>Sign In</span>
                </button>
                <button className="nav-cta-btn" onClick={onLogin}>
                  <ChromeIcon size={16} />
                  <span>Add to Chrome</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 1. HERO SECTION ───────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-headline">
            Your DSA practice.<br />
            One place. Your <span className="blue-accent-text">GitHub.</span>
          </h1>

          <p className="hero-subheadline">
            CodeStreak automatically captures your accepted solutions from LeetCode and Codeforces, generates AI notes, and pushes everything to your own GitHub — organized by concept, searchable by meaning.
          </p>

          <div className="hero-cta-group">
            <button className="hero-primary-btn" onClick={onLogin}>
              <ChromeIcon size={18} />
              <span>Add to Chrome</span>
            </button>
            <button className="hero-secondary-btn" onClick={() => scrollToSection('demo-preview')}>
              <TerminalIcon size={16} />
              <span>View Demo</span>
            </button>
          </div>

          <div className="hero-social-proof">
            <span>Works on LeetCode + Codeforces</span>
            <span className="proof-sep">·</span>
            <span>Stores in your GitHub</span>
            <span className="proof-sep">·</span>
            <span>Free to start</span>
          </div>

          {/* Hero Visual Mockup */}
          <div id="demo-preview" className="hero-visual-wrapper">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM STATEMENT (3 CARDS) ────────────────────── */}
      <section className="problems-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-tag">The Problem</span>
            <h2 className="section-title">Sound familiar?</h2>
            <p className="section-subtitle">
              Practicing data structures across multiple platforms leaves your knowledge fragmented and forgotten.
            </p>
          </div>

          <div className="problems-grid">
            {/* Card 1 */}
            <div className="problem-card">
              <div className="problem-icon-wrap red">
                <ScatteredChartsIcon size={24} />
              </div>
              <h3 className="problem-card-title">Your streak is scattered</h3>
              <p className="problem-card-desc">
                You solve problems on 3 platforms but can't see your overall progress in one place.
              </p>
            </div>

            {/* Card 2 */}
            <div className="problem-card">
              <div className="problem-icon-wrap amber">
                <ConfusedRevisionIcon size={24} />
              </div>
              <h3 className="problem-card-title">Revision is painful</h3>
              <p className="problem-card-desc">
                When you want to revise 'sliding window', you manually check each platform one by one.
              </p>
            </div>

            {/* Card 3 */}
            <div className="problem-card">
              <div className="problem-icon-wrap neutral">
                <DisappearingFileIcon size={24} />
              </div>
              <h3 className="problem-card-title">Your solutions disappear</h3>
              <p className="problem-card-desc">
                No notes, no explanations, no record of your thinking when you solved it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS (HORIZONTAL STEP FLOW) ────────────── */}
      <section id="how-it-works" className="steps-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-tag">Workflow</span>
            <h2 className="section-title">Set it up once. It works forever.</h2>
            <p className="section-subtitle">
              Zero manual logging or copy-pasting. CodeStreak operates invisibly in the background.
            </p>
          </div>

          <div className="steps-flow-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number-badge">01</div>
              <div className="step-icon-wrap">
                <ChromeIcon size={22} />
              </div>
              <h3 className="step-title">Install the extension</h3>
              <p className="step-desc">
                One click install. Sign in with GitHub. Done.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number-badge">02</div>
              <div className="step-icon-wrap">
                <CodeIcon size={22} />
              </div>
              <h3 className="step-title">Solve problems normally</h3>
              <p className="step-desc">
                CodeStreak silently watches. The moment you hit Accepted, it captures everything.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number-badge">03</div>
              <div className="step-icon-wrap">
                <GithubIcon size={22} />
              </div>
              <h3 className="step-title">Auto-pushed to GitHub</h3>
              <p className="step-desc">
                Your solution + AI notes land in your own GitHub repo, organized by concept tag.
              </p>
            </div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-number-badge">04</div>
              <div className="step-icon-wrap">
                <SearchIcon size={22} />
              </div>
              <h3 className="step-title">Revise with semantic search</h3>
              <p className="step-desc">
                Ask 'show me all graph problems I solved' and get instant, meaningful results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES (2x2 GRID) ────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-tag">Core Features</span>
            <h2 className="section-title">Everything in one place</h2>
            <p className="section-subtitle">
              Engineered specifically for engineering interview prep and algorithmic mastery.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-header-row">
                <div className="feature-icon-box">
                  <HeatmapIcon size={20} />
                </div>
                <span className="feature-pill">Consolidated</span>
              </div>
              <h3 className="feature-title">Unified Streak Dashboard</h3>
              <p className="feature-desc">
                A 365-day heatmap calendar aggregating all your coding sessions across LeetCode and Codeforces in one synchronized timeline.
              </p>
              <div className="feature-mini-preview heatmap-preview">
                <div className="mini-heat-row">
                  {[4,2,3,0,1,4,3,2,1,0,3,4,2,1,4,3,2,4].map((lvl, i) => (
                    <span key={i} className={`mini-hm-cell lvl-${lvl}`} />
                  ))}
                </div>
                <span className="mini-heat-caption">100% synchronized streaks</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-header-row">
                <div className="feature-icon-box">
                  <FolderTreeIcon size={20} />
                </div>
                <span className="feature-pill">Intuitive</span>
              </div>
              <h3 className="feature-title">Concept-based Organization</h3>
              <p className="feature-desc">
                Solutions filed under algorithmic paradigms like <code>sliding-window</code>, <code>graphs</code>, and <code>dp</code> — not isolated by website.
              </p>
              <div className="feature-mini-preview tags-preview">
                <span className="concept-chip"><FolderIcon size={12} /> graphs/</span>
                <span className="concept-chip"><FolderIcon size={12} /> sliding-window/</span>
                <span className="concept-chip"><FolderIcon size={12} /> dynamic-programming/</span>
                <span className="concept-chip"><FolderIcon size={12} /> binary-search/</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-header-row">
                <div className="feature-icon-box">
                  <BrainIcon size={20} />
                </div>
                <span className="feature-pill">Automated</span>
              </div>
              <h3 className="feature-title">AI-generated Notes</h3>
              <p className="feature-desc">
                Instant explanations and calculated Big-O Time & Space complexity breakdown generated and committed alongside your code.
              </p>
              <div className="feature-mini-preview ai-preview">
                <div className="mini-bigo-row">
                  <span className="mini-bigo">Time: O(N log N)</span>
                  <span className="mini-bigo">Space: O(1)</span>
                </div>
                <p className="mini-ai-snippet">"Optimal two-pointer approach leveraging sorted invariant..."</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-header-row">
                <div className="feature-icon-box">
                  <SearchIcon size={20} />
                </div>
                <span className="feature-pill">Semantic</span>
              </div>
              <h3 className="feature-title">Semantic Search</h3>
              <p className="feature-desc">
                Query your solved problem history with natural human language rather than guessing exact problem titles or keywords.
              </p>
              <div className="feature-mini-preview search-preview">
                <div className="mini-search-bar">
                  <SearchIcon size={13} />
                  <span>"problems using monotonic stack"</span>
                </div>
                <span className="mini-search-results">3 matching solutions found in &lt;12ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. GITHUB-FIRST SECTION (FULL WIDTH) ──────────────── */}
      <section id="github-first" className="github-first-section">
        <div className="section-container">
          <div className="github-first-grid">
            <div className="github-first-text">
              <div className="github-brand-badge">
                <GithubIcon size={15} />
                <span>Zero Lock-In Guarantee</span>
              </div>
              <h2 className="github-first-title">
                Your data.<br />
                Your GitHub.<br />
                <span className="blue-accent-text">Always.</span>
              </h2>
              <p className="github-first-body">
                CodeStreak never locks your data in our database. Every solution lives as a clean Markdown file in your own GitHub repository. We just help you get it there — organized, explained, and searchable.
              </p>
              <div className="github-checkmarks">
                <div className="gh-check-item">
                  <CheckIcon size={15} />
                  <span>Standard GitHub Markdown formatted notes</span>
                </div>
                <div className="gh-check-item">
                  <CheckIcon size={15} />
                  <span>Full ownership of your commit history & code</span>
                </div>
                <div className="gh-check-item">
                  <CheckIcon size={15} />
                  <span>Clone or export anytime without dependencies</span>
                </div>
              </div>
            </div>

            {/* Interactive File Tree visual */}
            <div className="github-first-visual">
              <FileTreePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. PRICING SECTION (2 CARDS) ──────────────────────── */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-tag">Pricing</span>
            <h2 className="section-title">Transparent & Developer First</h2>
            <p className="section-subtitle">
              Start building your centralized DSA knowledge repository today for free.
            </p>
          </div>

          <div className="pricing-cards-grid">
            {/* Free Tier */}
            <div className="pricing-card free-card">
              <div className="pricing-card-header">
                <span className="plan-label">Community</span>
                <h3 className="plan-name">Free Tier</h3>
                <p className="plan-desc">For individual developers building their personal DSA revision library.</p>
              </div>

              <div className="plan-features-list">
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Chrome Extension for LeetCode & Codeforces</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Automated GitHub repository sync</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Basic AI explanation & complexity tags</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Unified 365-day streak dashboard</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Concept & tag-based folders</span>
                </div>
              </div>

              <button className="plan-action-btn primary" onClick={onLogin}>
                <span>Get Started Free</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>

            {/* Premium Tier */}
            <div className="pricing-card premium-card">
              <div className="pricing-card-header">
                <div className="plan-badge-row">
                  <span className="plan-label">Pro</span>
                  <span className="coming-soon-pill">In Active Development</span>
                </div>
                <h3 className="plan-name">Premium Tier</h3>
                <p className="plan-desc">For serious interview prep requiring deep AI reasoning and instant RAG search.</p>
              </div>

              <div className="plan-features-list">
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Everything in Free</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Deep AI explanations with trade-off analysis</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Full mathematical Big-O step breakdown</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Semantic RAG search across entire revision history</span>
                </div>
                <div className="plan-feature-row">
                  <CheckIcon size={15} />
                  <span>Priority sync & dedicated GitHub webhooks</span>
                </div>
              </div>

              <button className="plan-action-btn disabled" disabled>
                <span>Coming soon</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER ─────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="section-container">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="footer-logo-row">
                <img src={logoImg} alt="CodeStreak" className="footer-logo" />
              </div>
              <p className="footer-tagline">
                Built for developers who take revision seriously.
              </p>
            </div>

            <div className="footer-links-col">
              <span className="footer-col-title">Resources</span>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-link">
                <GithubIcon size={14} />
                <span>GitHub Repo</span>
              </a>
              <a href="#demo-preview" onClick={(e) => { e.preventDefault(); scrollToSection('demo-preview'); }} className="footer-link">
                <span>Documentation</span>
              </a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="footer-link">
                <span>Chrome Extension</span>
              </a>
            </div>
          </div>

          <div className="footer-bottom-row">
            <span className="footer-credit">Built by Sharath</span>
            <span className="footer-copyright">© {new Date().getFullYear()} CodeStreak. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
