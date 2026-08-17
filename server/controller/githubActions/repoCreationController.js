import { asyncController } from "../../utils/asyncController.js";
import AppError from "../../utils/AppError.js";

// ── 1. Create or Link / Switch Repository ───────────────────────
export const createRepo = asyncController(async (req, res, next) => {
    // Extract repoName and useExisting flag from body
    const { repoName, useExisting } = req.body;

    // Ensure that the repo name is provided
    if (!repoName || typeof repoName !== 'string' || !repoName.trim()) {
        return next(new AppError("Please provide a valid repository name.", 400));
    }

    const cleanRepoName = repoName.trim();

    // Check if the repo name conforms to GitHub naming conventions
    const validNameRegex = /^[a-zA-Z0-9-_.]+$/;
    if (!validNameRegex.test(cleanRepoName)) {
        return next(new AppError("Invalid repository name. Use letters, numbers, hyphens, underscores, or periods.", 400));
    }

    const { github_access_token, github_username } = req.user;

    // ── Option A: User explicitly confirmed to use their existing repository ──
    if (useExisting === true) {
        const checkExistingRes = await fetch(`https://api.github.com/repos/${github_username}/${cleanRepoName}`, {
            headers: {
                Authorization: `Bearer ${github_access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!checkExistingRes.ok) {
            return res.status(404).json({
                success: false,
                message: `Repository "${cleanRepoName}" could not be found on your GitHub account.`,
            });
        }

        const existingRepoJson = await checkExistingRes.json();

        // Push CodeStreak banner README if repo is empty / needed
        const readmeContent = `# ${cleanRepoName}\n\nAutomated DSA Solutions synced by [CodeStreak](https://codestreak.dev).\n\nOrganized by concept and searchable by meaning.`;
        try {
            await fetch(`https://api.github.com/repos/${existingRepoJson.full_name}/contents/README.md`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${github_access_token}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: "Sync: CodeStreak repository setup",
                    content: Buffer.from(readmeContent).toString("base64"),
                }),
            });
        } catch (rErr) {
            console.log("Existing README exists or could not be overwritten, preserving user files:", rErr.message);
        }

        // Link repository to user in MongoDB
        req.user.github_repo_name = cleanRepoName;
        req.user.github_repo_url = existingRepoJson.html_url || `https://github.com/${github_username}/${cleanRepoName}`;
        req.user.is_repo_ready = true;
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: `Successfully linked repository "${cleanRepoName}" to your CodeStreak account.`,
            user: {
                installation_id: req.user.installation_id,
                github_repo_name: req.user.github_repo_name,
                github_repo_url: req.user.github_repo_url,
                is_repo_ready: req.user.is_repo_ready,
                tier: req.user.tier,
                github_id: req.user.github_id,
                github_username: req.user.github_username,
                email: req.user.email,
                name: req.user.name,
                avatar_url: req.user.avatar_url,
            },
        });
    }

    // ── Option B: Check if repo already exists on user's GitHub before creating ──
    const preCheckRes = await fetch(`https://api.github.com/repos/${github_username}/${cleanRepoName}`, {
        headers: {
            Authorization: `Bearer ${github_access_token}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (preCheckRes.ok) {
        // Repo already exists on GitHub -> Prompt user to confirm linking or pick unique name
        return res.status(409).json({
            success: false,
            repoExists: true,
            repoName: cleanRepoName,
            message: `A repository named "${cleanRepoName}" already exists on your GitHub account. Would you like to use this existing repository or choose a unique name?`,
        });
    }

    // ── Step 1: Create the new repository on GitHub ──
    const githubResponse = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${github_access_token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: cleanRepoName,
            private: false,
            description: "DSA Solutions automatically tracked and synced by CodeStreak",
        }),
    });

    const githubResponseJson = await githubResponse.json();

    // Check if GitHub returned an "already exists" error on creation
    const alreadyExistsError = githubResponseJson.errors?.some(
        (e) => e.message?.toLowerCase().includes("already exists") || e.code === "custom"
    );

    if (githubResponse.status === 422 && alreadyExistsError) {
        return res.status(409).json({
            success: false,
            repoExists: true,
            repoName: cleanRepoName,
            message: `A repository named "${cleanRepoName}" already exists on your GitHub account. Would you like to use this existing repository or choose a unique name?`,
        });
    }

    if (!githubResponse.ok) {
        return res.status(githubResponse.status || 422).json({
            success: false,
            message: githubResponseJson.message || "Repository creation failed on GitHub.",
            errors: githubResponseJson.errors || [],
        });
    }

    // ── Step 2: Initialize README.md on GitHub ──
    const readmeContent = `# ${cleanRepoName}\n\nAutomated problem tracking across LeetCode & Codeforces with instant GitHub commits and AI complexity breakdown.\n\n_Generated by [CodeStreak](https://codestreak.dev)_`;

    try {
        await fetch(`https://api.github.com/repos/${githubResponseJson.full_name}/contents/README.md`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${github_access_token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Initial commit: CodeStreak setup",
                content: Buffer.from(readmeContent).toString("base64"),
            }),
        });
    } catch (readmeErr) {
        console.error("Error creating initial README:", readmeErr);
    }

    // ── Step 3: Update user with new repository information ──
    req.user.github_repo_name = cleanRepoName;
    req.user.github_repo_url = githubResponseJson.html_url;
    req.user.is_repo_ready = true;
    await req.user.save();

    return res.status(201).json({
        success: true,
        message: "Repository created and linked successfully.",
        user: {
            installation_id: req.user.installation_id,
            github_repo_name: req.user.github_repo_name,
            github_repo_url: req.user.github_repo_url,
            is_repo_ready: req.user.is_repo_ready,
            tier: req.user.tier,
            github_id: req.user.github_id,
            github_username: req.user.github_username,
            email: req.user.email,
            name: req.user.name,
            avatar_url: req.user.avatar_url,
        },
    });
});

// ── 2. Unlink Repository ────────────────────────────────────────
export const unlinkRepo = asyncController(async (req, res, next) => {
    const previousRepo = req.user.github_repo_name;

    req.user.github_repo_name = null;
    req.user.github_repo_url = null;
    req.user.is_repo_ready = false;
    await req.user.save();

    return res.status(200).json({
        success: true,
        message: previousRepo ? `Successfully unlinked repository "${previousRepo}".` : "Repository unlinked successfully.",
        user: {
            installation_id: req.user.installation_id,
            github_repo_name: null,
            github_repo_url: null,
            is_repo_ready: false,
            tier: req.user.tier,
            github_id: req.user.github_id,
            github_username: req.user.github_username,
            email: req.user.email,
            name: req.user.name,
            avatar_url: req.user.avatar_url,
        },
    });
});

// ── 3. Check Live Repository Status from GitHub ─────────────────
export const getRepoStatus = asyncController(async (req, res, next) => {
    if (!req.user.github_repo_name || !req.user.is_repo_ready) {
        return res.status(200).json({
            success: true,
            isLinked: false,
            repo: null,
        });
    }

    const { github_access_token, github_username, github_repo_name } = req.user;
    const repoCheck = await fetch(`https://api.github.com/repos/${github_username}/${github_repo_name}`, {
        headers: {
            Authorization: `Bearer ${github_access_token}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!repoCheck.ok) {
        return res.status(200).json({
            success: true,
            isLinked: true,
            isReachableOnGithub: false,
            repoName: github_repo_name,
            repoUrl: req.user.github_repo_url,
            message: "Repository is configured in CodeStreak but could not be reached on GitHub (it may have been renamed, made private, or deleted).",
        });
    }

    const repoData = await repoCheck.json();
    return res.status(200).json({
        success: true,
        isLinked: true,
        isReachableOnGithub: true,
        repoName: repoData.name,
        fullName: repoData.full_name,
        repoUrl: repoData.html_url,
        isPrivate: repoData.private,
        defaultBranch: repoData.default_branch,
        starsCount: repoData.stargazers_count,
        forksCount: repoData.forks_count,
        updatedAt: repoData.updated_at,
    });
});

export default createRepo;