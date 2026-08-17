import { useMemo } from 'react';
import { formatDateReadable } from '../utils/helpers';

// ── Stats & Computed Data Hook ──────────────────────────────────

export function useStats(submissions, heatmapData, activeTab, searchQuery) {
  // ── Computed Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!submissions.length) return { currentStreak: 0, maxStreak: 0, totalSolved: 0, uniqueLanguages: 0, todaySolved: 0 };

    const datesSet = new Set(submissions.map(s => new Date(s.timestamp).toLocaleDateString('en-CA')));
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    const sortedDates = Array.from(datesSet).sort();

    // Max streak
    let maxStreak = 1, tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000;
      if (diff === 1) { tempStreak++; if (tempStreak > maxStreak) maxStreak = tempStreak; }
      else { tempStreak = 1; }
    }

    // Current streak
    let currentStreak = 0;
    if (datesSet.has(todayStr) || datesSet.has(yesterdayStr)) {
      const checkDate = datesSet.has(todayStr) ? new Date() : new Date(Date.now() - 86400000);
      while (datesSet.has(checkDate.toLocaleDateString('en-CA'))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const languages = new Set(submissions.map(s => s.language?.toLowerCase()));
    const todaySolved = submissions.filter(s => new Date(s.timestamp).toLocaleDateString('en-CA') === todayStr).length;

    return { currentStreak, maxStreak, totalSolved: submissions.length, uniqueLanguages: languages.size, todaySolved };
  }, [submissions]);

  // ── Language breakdown ──────────────────────────────────────────
  const languageBreakdown = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      const lang = s.language || 'Other';
      map[lang] = (map[lang] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [submissions]);

  // ── Tag breakdown ───────────────────────────────────────────────
  const tagBreakdown = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      (s.tags || []).forEach(t => {
        const name = t.name || t;
        map[name] = (map[name] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [submissions]);

  // ── Filtered submissions ────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    if (activeTab !== 'all') {
      filtered = filtered.filter(s => (s.language || '').toLowerCase() === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.slug?.toLowerCase().includes(q) ||
        (s.tags || []).some(t => (t.name || '').toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [submissions, activeTab, searchQuery]);

  // ── Heatmap ─────────────────────────────────────────────────────
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      days.push(d.toLocaleDateString('en-CA'));
    }
    return days;
  }, []);

  const heatmapLookup = useMemo(() =>
    heatmapData.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
    [heatmapData]
  );

  const totalContributions = useMemo(() =>
    Object.values(heatmapLookup).reduce((sum, c) => sum + c, 0),
    [heatmapLookup]
  );

  const getHeatLevel = (count) => {
    if (!count) return 'level-0';
    if (count === 1) return 'level-1';
    if (count === 2) return 'level-2';
    if (count <= 4) return 'level-3';
    return 'level-4';
  };

  const monthLabels = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      labels.push(months[(today.getMonth() - i + 12) % 12]);
    }
    return labels;
  }, []);

  return {
    stats, languageBreakdown, tagBreakdown, filteredSubmissions,
    heatmapDays, heatmapLookup, totalContributions, getHeatLevel, monthLabels,
  };
}
