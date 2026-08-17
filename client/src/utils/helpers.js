// ── Date & Time Helpers ──────────────────────────────────────────

export const formatDateReadable = (dateInput) => {
  if (!dateInput) return '';
  
  // If YYYY-MM-DD string, construct date using local year, month, day to prevent timezone shifts
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateReadable(dateInput);
};

export const getLocalDateKey = (dateInput = new Date()) => {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ── Problem Links & GitHub Helpers ─────────────────────────────────

export const getPracticeUrl = (sub = {}) => {
  const platform = (sub.platform || 'LeetCode').toLowerCase();
  const slug = sub.slug || sub.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '';
  
  if (platform.includes('leetcode') || platform === 'lc') {
    return `https://leetcode.com/problems/${slug}/`;
  }
  
  if (platform.includes('geeks') || platform.includes('gfg')) {
    return `https://www.geeksforgeeks.org/problems/${slug}/1`;
  }
  
  if (platform.includes('codeforces') || platform === 'cf') {
    const cleanSlug = slug.replace(/^problem-/, '');
    const match = cleanSlug.match(/^(\d+)[-_]?([a-zA-Z\d]+)$/);
    if (match) {
      return `https://codeforces.com/problemset/problem/${match[1]}/${match[2].toUpperCase()}`;
    }
    return `https://codeforces.com/problemset?search=${encodeURIComponent(sub.title || slug)}`;
  }
  
  if (platform.includes('codechef')) {
    return `https://www.codechef.com/problems/${slug.toUpperCase()}`;
  }
  
  if (platform.includes('hackerrank')) {
    return `https://www.hackerrank.com/challenges/${slug}/problem`;
  }
  
  return `https://www.google.com/search?q=${encodeURIComponent(`${sub.platform || 'DSA'} ${sub.title || slug} problem`)}`;
};

export const getGithubReadmeUrl = (sub = {}, user = {}) => {
  if (sub.github_readme_url) return sub.github_readme_url;
  
  const platformSlug = (sub.platform || 'leetcode').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const conceptName = sub.concept || (sub.tags && (sub.tags[0]?.name || sub.tags[0])) || 'general';
  const conceptSlug = conceptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const problemSlug = (sub.slug || sub.title || 'problem').toLowerCase().replace(/[^a-z0-9-_.]+/g, '-');
  
  if (user?.is_repo_ready && user?.github_username && user?.github_repo_name) {
    return `https://github.com/${user.github_username}/${user.github_repo_name}/blob/main/${platformSlug}/${conceptSlug}/${problemSlug}/README.md`;
  }
  
  return null;
};

