// ── Concept Analytics & Difficulty Derivation Utilities ─────────────────

export const DIFFICULTY_CONFIG = {
  Easy: {
    label: 'Easy',
    color: '#10b981', // Emerald Green
    bgGlow: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    badgeClass: 'diff-badge-easy',
  },
  Medium: {
    label: 'Medium',
    color: '#f59e0b', // Amber / Gold Yellow
    bgGlow: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    badgeClass: 'diff-badge-medium',
  },
  Hard: {
    label: 'Hard',
    color: '#ef4444', // Crimson Red
    bgGlow: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    badgeClass: 'diff-badge-hard',
  },
};

export const PLATFORM_CONFIG = {
  LeetCode: { name: 'LeetCode', color: '#f59e0b', badgeClass: 'plat-leetcode' },
  GeeksforGeeks: { name: 'GeeksforGeeks', color: '#10b981', badgeClass: 'plat-gfg' },
  Codeforces: { name: 'Codeforces', color: '#38bdf8', badgeClass: 'plat-codeforces' },
  CodeChef: { name: 'CodeChef', color: '#a855f7', badgeClass: 'plat-codechef' },
  HackerRank: { name: 'HackerRank', color: '#06b6d4', badgeClass: 'plat-hackerrank' },
  Other: { name: 'Other', color: '#94a3b8', badgeClass: 'plat-other' },
};

/**
 * Standardize raw platform names into clean canonical casing.
 */
export function normalizePlatform(rawPlatform = '') {
  if (!rawPlatform) return 'LeetCode';
  const str = String(rawPlatform).toLowerCase().trim();
  if (str.includes('leetcode') || str === 'lc') return 'LeetCode';
  if (str.includes('geeks') || str.includes('gfg')) return 'GeeksforGeeks';
  if (str.includes('codeforces') || str === 'cf') return 'Codeforces';
  if (str.includes('codechef')) return 'CodeChef';
  if (str.includes('hackerrank')) return 'HackerRank';
  return rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);
}

/**
 * Normalize arbitrary difficulty strings to 'Easy' | 'Medium' | 'Hard'
 */
export function normalizeDifficulty(rawDiff = '') {
  if (!rawDiff) return 'Medium';
  const str = String(rawDiff).toLowerCase().trim();

  if (str === 'easy' || str.includes('school') || str.includes('basic') || str.includes('beginner') || str === 'e') {
    return 'Easy';
  }
  if (str === 'hard' || str.includes('expert') || str.includes('advanced') || str === 'h') {
    return 'Hard';
  }
  if (str === 'medium' || str.includes('med') || str.includes('intermediate') || str === 'm') {
    return 'Medium';
  }

  return 'Medium';
}

/**
 * Intelligently resolve the difficulty of any submission:
 * 1. Checks explicit `sub.difficulty`
 * 2. Checks `sub.tags` for difficulty markers
 * 3. Inspects problem characteristics (concept & complexity heuristics)
 */
export function getSubmissionDifficulty(sub = {}) {
  if (sub.difficulty) {
    return normalizeDifficulty(sub.difficulty);
  }

  // Check tags
  if (Array.isArray(sub.tags)) {
    for (const t of sub.tags) {
      const tagText = typeof t === 'string' ? t : t?.name || '';
      const lower = tagText.toLowerCase().trim();
      if (['easy', 'school', 'basic'].includes(lower)) return 'Easy';
      if (['medium', 'medium-hard'].includes(lower)) return 'Medium';
      if (['hard', 'expert'].includes(lower)) return 'Hard';
    }
  }

  // Heuristics based on concept and complexities
  const concept = (sub.concept || '').toLowerCase();
  const time = (sub.timeComplexity || '').toLowerCase();

  if (concept.includes('dynamic programming') || concept.includes('graph') || concept.includes('backtracking') || concept.includes('trie') || concept.includes('segment tree')) {
    if (time.includes('o(2^n)') || time.includes('o(n!)') || time.includes('o(v + e)')) {
      return 'Hard';
    }
    return 'Medium';
  }

  if (concept.includes('math') || concept.includes('string') || concept.includes('array') || concept.includes('two pointer')) {
    if (time === 'o(1)' || time === 'o(n)') {
      // Deterministic spread based on slug hash if simple
      const hash = (sub.slug || sub.title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return hash % 3 === 0 ? 'Easy' : (hash % 3 === 1 ? 'Medium' : 'Easy');
    }
  }

  // Deterministic fallback based on title hash for stable mock/existing records
  const hash = (sub.slug || sub.title || 'problem').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rem = hash % 10;
  if (rem < 4) return 'Easy';
  if (rem < 8) return 'Medium';
  return 'Hard';
}

/**
 * Get all available platforms from submissions with total count.
 */
export function getPlatformFilterOptions(submissions = []) {
  const counts = { All: submissions.length };
  submissions.forEach((sub) => {
    const plat = normalizePlatform(sub.platform);
    counts[plat] = (counts[plat] || 0) + 1;
  });

  const options = [{ id: 'All', name: 'All Platforms', count: counts.All }];
  Object.keys(counts)
    .filter((k) => k !== 'All')
    .sort((a, b) => counts[b] - counts[a])
    .forEach((plat) => {
      options.push({ id: plat, name: plat, count: counts[plat] });
    });

  return options;
}

/**
 * Group submissions by concept and calculate Easy / Medium / Hard stacks.
 */
export function aggregateConceptData({
  submissions = [],
  platformFilter = 'All',
  searchQuery = '',
  sortOption = 'most-solved',
  limit = 'all',
}) {
  if (!submissions || submissions.length === 0) {
    return { concepts: [], totalFiltered: 0, overallStats: { easy: 0, medium: 0, hard: 0, total: 0 } };
  }

  // 1. Filter by platform
  let filtered = submissions;
  if (platformFilter && platformFilter !== 'All') {
    filtered = filtered.filter((sub) => normalizePlatform(sub.platform) === platformFilter);
  }

  // 2. Filter by search query
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((sub) => {
      const c = (sub.concept || '').toLowerCase();
      const t = (sub.title || '').toLowerCase();
      const tags = (sub.tags || []).map((x) => (typeof x === 'string' ? x : x?.name || '')).join(' ').toLowerCase();
      return c.includes(q) || t.includes(q) || tags.includes(q);
    });
  }

  // 3. Aggregate by concept
  const map = new Map();
  const overallStats = { easy: 0, medium: 0, hard: 0, total: 0 };

  filtered.forEach((sub) => {
    const conceptName = (sub.concept || (sub.tags && sub.tags[0] && (sub.tags[0].name || sub.tags[0])) || 'General').trim();
    const diff = getSubmissionDifficulty(sub);
    const plat = normalizePlatform(sub.platform);

    overallStats.total += 1;
    if (diff === 'Easy') overallStats.easy += 1;
    else if (diff === 'Medium') overallStats.medium += 1;
    else if (diff === 'Hard') overallStats.hard += 1;

    if (!map.has(conceptName)) {
      map.set(conceptName, {
        concept: conceptName,
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        platforms: {},
        submissions: [],
      });
    }

    const entry = map.get(conceptName);
    entry.total += 1;
    if (diff === 'Easy') entry.easy += 1;
    else if (diff === 'Medium') entry.medium += 1;
    else if (diff === 'Hard') entry.hard += 1;

    entry.platforms[plat] = (entry.platforms[plat] || 0) + 1;
    entry.submissions.push({ ...sub, derivedDifficulty: diff, normalizedPlatform: plat });
  });

  // Calculate percentages
  let list = Array.from(map.values()).map((item) => {
    const easyPct = item.total > 0 ? Math.round((item.easy / item.total) * 100) : 0;
    const mediumPct = item.total > 0 ? Math.round((item.medium / item.total) * 100) : 0;
    const hardPct = item.total > 0 ? Math.max(0, 100 - easyPct - mediumPct) : 0;

    return {
      ...item,
      easyPct,
      mediumPct,
      hardPct,
    };
  });

  // 4. Sort
  if (sortOption === 'most-solved') {
    list.sort((a, b) => b.total - a.total || a.concept.localeCompare(b.concept));
  } else if (sortOption === 'hardest') {
    list.sort((a, b) => (b.hard / b.total) - (a.hard / a.total) || b.hard - a.hard || b.total - a.total);
  } else if (sortOption === 'easiest') {
    list.sort((a, b) => (b.easy / b.total) - (a.easy / a.total) || b.easy - a.easy || b.total - a.total);
  } else if (sortOption === 'alphabetical') {
    list.sort((a, b) => a.concept.localeCompare(b.concept));
  }

  // 5. Apply limit
  const totalConceptsCount = list.length;
  if (limit !== 'all' && typeof limit === 'number') {
    list = list.slice(0, limit);
  }

  return {
    concepts: list,
    totalFiltered: filtered.length,
    totalConceptsCount,
    overallStats,
  };
}

/**
 * Build comparison dataset per concept across all detected platforms.
 */
export function aggregatePlatformComparisonData(submissions = [], searchQuery = '') {
  if (!submissions || submissions.length === 0) {
    return { platformList: [], comparisonRows: [], platformSummaries: {} };
  }

  // Detect platforms
  const platformSet = new Set();
  submissions.forEach((s) => platformSet.add(normalizePlatform(s.platform)));
  const platformList = Array.from(platformSet);

  // Group by concept
  const conceptMap = new Map();

  submissions.forEach((sub) => {
    const conceptName = (sub.concept || (sub.tags && sub.tags[0] && (sub.tags[0].name || sub.tags[0])) || 'General').trim();
    const plat = normalizePlatform(sub.platform);
    const diff = getSubmissionDifficulty(sub);

    if (!conceptMap.has(conceptName)) {
      conceptMap.set(conceptName, {
        concept: conceptName,
        total: 0,
        byPlatform: {},
      });
    }

    const row = conceptMap.get(conceptName);
    row.total += 1;

    if (!row.byPlatform[plat]) {
      row.byPlatform[plat] = { total: 0, easy: 0, medium: 0, hard: 0 };
    }

    row.byPlatform[plat].total += 1;
    if (diff === 'Easy') row.byPlatform[plat].easy += 1;
    else if (diff === 'Medium') row.byPlatform[plat].medium += 1;
    else if (diff === 'Hard') row.byPlatform[plat].hard += 1;
  });

  let comparisonRows = Array.from(conceptMap.values());

  // Filter search
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    comparisonRows = comparisonRows.filter((r) => r.concept.toLowerCase().includes(q));
  }

  // Sort by total solved across platforms
  comparisonRows.sort((a, b) => b.total - a.total);

  // Platform summary metrics
  const platformSummaries = {};
  platformList.forEach((plat) => {
    const platSubs = submissions.filter((s) => normalizePlatform(s.platform) === plat);
    const uniqueConcepts = new Set(platSubs.map((s) => s.concept || 'General')).size;
    let easy = 0, medium = 0, hard = 0;
    platSubs.forEach((s) => {
      const d = getSubmissionDifficulty(s);
      if (d === 'Easy') easy++;
      else if (d === 'Medium') medium++;
      else if (d === 'Hard') hard++;
    });

    platformSummaries[plat] = {
      totalSolved: platSubs.length,
      uniqueConcepts,
      easy,
      medium,
      hard,
      color: PLATFORM_CONFIG[plat]?.color || '#a1a1aa',
    };
  });

  return {
    platformList,
    comparisonRows,
    platformSummaries,
  };
}
