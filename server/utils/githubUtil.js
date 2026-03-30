import axios from 'axios';

const REPO_NAME = 'codestreak';

const generateReadme = (username) => {
  return `# 🔥 CodeStreak

**Track your daily coding streaks across platforms.**

> _Consistency beats intensity. Code every day, build your streak._

---

## 📌 About

**CodeStreak** is a Chrome Extension that monitors your coding activity across platforms and helps you maintain an unbroken daily coding streak — just like GitHub's contribution graph, but smarter.

## ✨ Features

- 🔗 **GitHub Integration** — Connect your GitHub account via OAuth
- 📊 **Activity Tracking** — Monitor your daily coding contributions
- 🏆 **Streak Counter** — Track your longest coding streak
- 🔔 **Reminders** — Never break your streak

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Extension (Manifest V3) |
| Frontend | Vanilla JavaScript, HTML, CSS |
| Backend | Node.js, Express |
| Auth | GitHub OAuth 2.0 |

## 🚀 Getting Started

1. Install the **CodeStreak** Chrome Extension
2. Click **"Connect GitHub"** to link your account
3. Start coding daily and watch your streak grow!

## 👤 Connected As

- **@${username}**

---

Built with 💚 by [${username}](https://github.com/${username})
`;
};

const generateFolderReadme = (folder) => {
  return `# ${folder}
This folder contains your solutions for ${folder}.
`;
};

const createFile = async (headers, username, path, content, message) => {
  const encodedContent = Buffer.from(content).toString('base64');
  try {
    const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${path}`;
    await axios.put(
      url,
      {
        message,
        content: encodedContent,
      },
      { headers }
    );
    console.log(`✓ successfully created ${path}`);
  } catch (error) {
    if (error.response && error.response.status === 422) {
      console.log(`- ${path} already exists, skipping.`);
    } else {
      console.error(`Error creating ${path}:`, error.response?.data?.message || error.message);
    }
  }
};

export const setupCodeStreakRepo = async (accessToken) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch user profile to get username
    const userResponse = await axios.get('https://api.github.com/user', { headers });
    const username = userResponse.data.login;
    
    // 2. Create the repo
    console.log('Creating codestreak repo...');
    try {
      await axios.post(
        'https://api.github.com/user/repos',
        {
          name: REPO_NAME,
          description: '🔥 Track your daily coding streaks across platforms — powered by CodeStreak',
          private: false,
          auto_init: false,
        },
        { headers }
      );
      console.log('Repo "codestreak" created successfully!');
    } catch (createError) {
      if (createError.response && createError.response.status === 422) {
        console.log('Repo "codestreak" already exists, skipping creation.');
      } else {
        throw createError;
      }
    }

    // 3. Create Root README
    await createFile(
      headers,
      username,
      'README.md',
      generateReadme(username),
      '🚀 Initial commit: Add README.md'
    );

    // 4. Create platform folders with a README.md in each
    const platforms = ['leetcode', 'geekforgeeks', 'codingninja', 'codecheaf', 'takeyoufarward'];
    for (const platform of platforms) {
      await createFile(
        headers,
        username,
        `${platform}/README.md`,
        generateFolderReadme(platform),
        `🚀 Create folder for ${platform}`
      );
    }

  } catch (err) {
    console.error('Repo setup failed:', err.response?.data?.message || err.message);
  }
};
