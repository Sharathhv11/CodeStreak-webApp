import User from "../../model/userModel.js";
import { generateToken } from "../../utils/jwt.js";

export const githubLogin = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId) {
        console.log("Client Id is not defined in .env file");
        process.exit(1);
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email%20public_repo`;
    res.redirect(githubAuthUrl);
};

export const githubCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "No authorization code provided" });
    }

    try {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        
        // Exchange code for access token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;


        if (!accessToken) {
            console.error("Token exchange failed:", tokenData);
            return res.status(400).json({ error: "Failed to retrieve access token from GitHub" });
        }

        // Fetch user profile data from GitHub
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const userData = await userResponse.json();

        // Check if user already exists
        let user = await User.findOne({ github_id: userData.id });

        if (!user) {
            
            // Optionally fetch user emails to save
            const emailResponse = await fetch("https://api.github.com/user/emails", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const emailData = await emailResponse.json();
            const primaryEmail = Array.isArray(emailData) ? emailData.find((email) => email.primary)?.email : null;
            
            const email = primaryEmail || userData.email;

            // Create new user in DB
            user = new User({
                github_id: userData.id,
                github_username: userData.login,
                email: email,
                name: userData.name,
                avatar_url: userData.avatar_url,
                github_access_token: accessToken,
                github_repo_name: null,
                github_repo_url: null,
                is_repo_ready: false,
            });

            await user.save();
        } else {
            user.github_access_token = accessToken;
            user.avatar_url = userData.avatar_url;
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Send response with token
        res.status(200).json({
            message: "GitHub OAuth successful! The user data has been saved.",
            token,
            user
        });

    } catch (error) {
        console.error("Error during GitHub OAuth callback:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
