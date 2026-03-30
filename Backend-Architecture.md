# CodeStreak Backend Architecture

## Overview
The backend for CodeStreak is a Node.js and Express application. Its primary responsibilities include handling the GitHub OAuth token exchange and managing the initial repository setup for the user on GitHub.

## API Structure

### Auth Routes (`/auth`)
- `POST /auth/github/token`: Accepts an authorization code from the frontend/extension, exchanges it for a token from GitHub, and triggers the `codestreak` repository setup for the user. Protected by global error handling using `asyncController` and `AppError`.

## Architecture Layers
- **Controllers** (`server/controllers/`): Handles incoming HTTP requests and structures the outgoing JSON responses. (e.g., `authController.js`)
- **Utilities / Services** (`server/utils/`): Business logic, error handling classes, and wrapper functions.
  - `githubUtil.js`: Logic to interact with the GitHub API (repository creation, folder initialization).
  - `AppError.js`: Global configuration for standardized application errors.
  - `asyncController.js`: Wrapper to handle async route errors smoothly.

## Error Handling
The application uses a standardized approach to errors:
1. Expected and unexpected errors are wrapped in `AppError`.
2. The `asyncController` automatically passes thrown errors to the Express `next()` function, passing them to the global error handler middleware.
3. The global error handler sends structured error JSON responses to the client.
