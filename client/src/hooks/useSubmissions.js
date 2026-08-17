import { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../utils/constants';

// ── Submissions & Repo Hook ─────────────────────────────────────

export function useSubmissions(token, handleLogout, updateUser) {
  const [submissions, setSubmissions] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Repo creation / management state
  const [repoName, setRepoName] = useState('codestreak');
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState('');
  const [repoSuccess, setRepoSuccess] = useState('');
  const [repoStatus, setRepoStatus] = useState(null);
  const [repoStatusLoading, setRepoStatusLoading] = useState(false);
  const [repoPrompt, setRepoPrompt] = useState({
    isOpen: false,
    existingRepoName: '',
    message: '',
  });

  // Fetch submissions and heatmap data
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [subsRes, heatRes] = await Promise.all([
        fetch(API_ENDPOINTS.SUBMISSIONS, { headers }),
        fetch(API_ENDPOINTS.HEATMAP, { headers }),
      ]);

      if (subsRes.status === 401 || heatRes.status === 401) {
        handleLogout();
        return;
      }

      const subsData = await subsRes.json();
      const heatData = await heatRes.json();
      if (subsData.success) setSubmissions(subsData.data || []);
      if (heatData.success) setHeatmapData(heatData.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [token, handleLogout]);

  // Fetch live repo status from GitHub
  const fetchRepoStatus = useCallback(async () => {
    if (!token) return;
    setRepoStatusLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.REPO_STATUS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRepoStatus(data);
      }
    } catch (err) {
      console.error("Error checking repo status:", err);
    } finally {
      setRepoStatusLoading(false);
    }
  }, [token]);

  // Fetch data when token changes
  useEffect(() => {
    if (!token) return;
    fetchData();
    fetchRepoStatus();
  }, [token, fetchData, fetchRepoStatus]);

  // ── Create or Switch / Link Repository ─────────────────────────
  const handleCreateRepo = async (e, forceUseExisting = false, customTargetName = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawTarget = customTargetName || (forceUseExisting ? (repoPrompt.existingRepoName || repoName) : repoName);
    const targetName = (rawTarget || '').trim();

    if (!targetName) {
      setRepoError("Repository name cannot be empty.");
      return;
    }

    setRepoLoading(true);
    setRepoError('');
    setRepoSuccess('');

    try {
      const res = await fetch(API_ENDPOINTS.CREATE_REPO, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoName: targetName,
          useExisting: forceUseExisting,
        }),
      });

      const data = await res.json();

      // Case 1: Repo already exists on GitHub account
      if (res.status === 409 || data.repoExists) {
        setRepoPrompt({
          isOpen: true,
          existingRepoName: data.repoName || targetName,
          message: data.message || `A repository named "${targetName}" already exists on your GitHub account.`,
        });
        setRepoError('');
        return;
      }

      // Case 2: Success
      if (res.ok && data.success) {
        setRepoPrompt({ isOpen: false, existingRepoName: '', message: '' });
        setRepoSuccess(data.message || `Successfully linked repository "${targetName}".`);
        updateUser(data.user);
        fetchData();
        fetchRepoStatus();
      } else {
        setRepoError(data.message || "Failed to configure repository.");
      }
    } catch (err) {
      setRepoError("Network error. Please try again.");
    } finally {
      setRepoLoading(false);
    }
  };

  // ── Unlink Repository ──────────────────────────────────────────
  const handleUnlinkRepo = async () => {
    setRepoLoading(true);
    setRepoError('');
    setRepoSuccess('');
    try {
      const res = await fetch(API_ENDPOINTS.UNLINK_REPO, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRepoPrompt({ isOpen: false, existingRepoName: '', message: '' });
        setRepoSuccess(data.message || "Repository unlinked successfully.");
        setRepoName('codestreak');
        updateUser(data.user);
        fetchData();
        fetchRepoStatus();
      } else {
        setRepoError(data.message || "Failed to unlink repository.");
      }
    } catch (err) {
      setRepoError("Network error while unlinking repository.");
    } finally {
      setRepoLoading(false);
    }
  };

  const confirmUseExistingRepo = () => {
    handleCreateRepo(null, true);
  };

  const cancelUseExistingRepo = () => {
    setRepoPrompt({ isOpen: false, existingRepoName: '', message: '' });
    setRepoName('');
  };

  const resetData = () => {
    setSubmissions([]);
    setHeatmapData([]);
    setRepoStatus(null);
  };

  return {
    submissions,
    heatmapData,
    dataLoading,
    repoName,
    setRepoName,
    repoLoading,
    repoError,
    setRepoError,
    repoSuccess,
    setRepoSuccess,
    repoStatus,
    repoStatusLoading,
    repoPrompt,
    confirmUseExistingRepo,
    cancelUseExistingRepo,
    handleCreateRepo,
    handleUnlinkRepo,
    fetchRepoStatus,
    fetchData,
    resetData,
  };
}
