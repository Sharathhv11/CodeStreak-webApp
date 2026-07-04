import { asyncController } from "../../utils/asyncController.js";
import AppError from "../../utils/AppError.js";

const createRepo = asyncController(async (req, res, next) => {
    //^ Check if repository is already configured
    if (req.user.is_repo_ready) {
        return next(new AppError("You already have a repository linked to your account.", 400));
    }

    //^ extracting the repo name from the body
    const { repoName } = req.body;

    //^ ensure that the repo name is provided and valid
    if (!repoName) {
        return next(new AppError("Please provide a repo name", 400));
    }

    //^ checking if the repo name is valid
    const validNameRegex = /^[a-zA-Z0-9-_.]+$/;

    if (!validNameRegex.test(repoName)) {
        return next(new AppError("Invalid repo name", 400));
    }


    const { github_access_token } = req.user;

    // step 1 — create the repo
    const githubResponse = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: { Authorization: `Bearer ${req.user.github_access_token}` },
        body: JSON.stringify({ name: repoName, private: false, description: "DSA Solutions pushed by CodeStreak" })
    });
    const githubResponseJson = await githubResponse.json();

    // step 2 — push your README content
    const readmeContent = `# Welcome to your CodeStreak repo
Your DSA solutions will be automatically synced here by CodeStreak.`;

    await fetch(`https://api.github.com/repos/${githubResponseJson.full_name}/contents/README.md`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${github_access_token}` },
        body: JSON.stringify({
            message: "Initial README",
            content: Buffer.from(readmeContent).toString("base64")
        })
    });
    console.log("GitHub Response:", githubResponseJson);

    //^ Check if repository creation failed
    if (!githubResponse.ok) {
        // Reset the user's repo-related fields in the DB as requested
        req.user.installation_id = null;
        req.user.github_repo_name = null;
        req.user.github_repo_url = null;
        req.user.is_repo_ready = false;
        req.user.tier = "free";
        await req.user.save();

        return res.status(githubResponse.status || 422).json({
            success: false,
            message: githubResponseJson.message || "Repository creation failed.",
            errors: githubResponseJson.errors || [],
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
            }
        });
    }

    //^ If successful, update user with new repository information
    req.user.github_repo_name = repoName;
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
        }
    });
});

export default createRepo;