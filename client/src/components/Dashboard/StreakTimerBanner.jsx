import { useState, useEffect } from 'react';
import './StreakTimerBanner.css';
import {
  FireIcon,
  ClockIcon,
  ShieldCheckIcon,
  PlayIcon,
  ExternalLinkIcon,
  ZapIcon,
} from '../icons/index.jsx';

export default function StreakTimerBanner({ stats = {} }) {
  const { currentStreak = 0, todaySolved = 0 } = stats;

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    // Midnight tonight (23:59:59.999 local time)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const diff = Math.max(0, endOfDay.getTime() - now.getTime());

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      totalMs: diff,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isStreakSafe = todaySolved > 0;
  const hasStreakAtRisk = currentStreak > 0 && !isStreakSafe;

  return (
    <div className={`streak-timer-banner ${isStreakSafe ? 'streak-safe' : hasStreakAtRisk ? 'streak-at-risk' : 'streak-initial'}`}>
      <div className="streak-timer-left">
        {/* Animated Status Icon Badge */}
        <div className={`streak-status-icon-box ${isStreakSafe ? 'safe' : hasStreakAtRisk ? 'at-risk' : 'initial'}`}>
          {isStreakSafe ? (
            <ShieldCheckIcon size={20} />
          ) : hasStreakAtRisk ? (
            <FireIcon size={20} />
          ) : (
            <ZapIcon size={18} />
          )}
          {hasStreakAtRisk && <span className="streak-pulse-ring" />}
        </div>

        {/* Status Message Info */}
        <div className="streak-status-info">
          <div className="streak-status-title-row">
            <h3 className="streak-status-title">
              {isStreakSafe ? (
                <>Streak Protected for Today <span className="streak-title-flame">🔥</span></>
              ) : hasStreakAtRisk ? (
                <>Your {currentStreak}-Day Streak is Breaking Soon!</>
              ) : (
                <>Start Your Coding Streak Today!</>
              )}
            </h3>
            <span className={`streak-status-pill ${isStreakSafe ? 'pill-safe' : hasStreakAtRisk ? 'pill-risk' : 'pill-neutral'}`}>
              {isStreakSafe ? 'Protected' : hasStreakAtRisk ? 'At Risk' : 'Ready'}
            </span>
          </div>

          <p className="streak-status-desc">
            {isStreakSafe ? (
              <>
                You've solved <strong>{todaySolved} problem{todaySolved > 1 ? 's' : ''}</strong> today! Your streak is safe until tomorrow's cycle.
              </>
            ) : hasStreakAtRisk ? (
              <>
                You haven't solved a problem today. Solve <strong>at least 1 problem</strong> before midnight to keep your <strong>{currentStreak}-day streak</strong> alive!
              </>
            ) : (
              <>
                Solve your first problem on LeetCode or GeeksforGeeks before midnight to start your streak.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right: Digital Countdown Timer Display & Action */}
      <div className="streak-timer-right">
        <div className="countdown-block">
          <div className="countdown-header">
            <ClockIcon size={12} />
            <span className="countdown-label">
              {isStreakSafe ? 'Next cycle starts in:' : 'Streak breaks in:'}
            </span>
          </div>

          <div className="digital-clock-grid">
            <div className="digit-card">
              <span className="digit-value">{timeLeft.hours}</span>
              <span className="digit-unit">HRS</span>
            </div>
            <span className="digit-colon">:</span>
            <div className="digit-card">
              <span className="digit-value">{timeLeft.minutes}</span>
              <span className="digit-unit">MINS</span>
            </div>
            <span className="digit-colon">:</span>
            <div className="digit-card">
              <span className="digit-value">{timeLeft.seconds}</span>
              <span className="digit-unit">SECS</span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <a
          href="https://leetcode.com/problemset/"
          target="_blank"
          rel="noreferrer"
          className={`streak-solve-btn ${isStreakSafe ? 'safe-btn' : 'urgent-btn'}`}
          title="Open problem set to practice and maintain streak"
        >
          <PlayIcon size={12} />
          <span>{isStreakSafe ? 'Practice More' : 'Solve Problem'}</span>
          <ExternalLinkIcon size={11} />
        </a>
      </div>
    </div>
  );
}
