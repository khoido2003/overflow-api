# Overflow API - README

<div align="center">
  <img src="https://code-overflow-vn.vercel.app/assets/logo.svg" alt="Code Overflow Icon" width="100">
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Code-Node.js-informational?style=flat&color=informational&logo=node.js">
  <img src="https://img.shields.io/badge/Code-Next.js-informational?style=flat&color=informational&logo=next.js">
  <img src="https://img.shields.io/badge/Code-React-informational?style=flat&color=informational&logo=react">
  <img src="https://img.shields.io/badge/Style-Tailwind%20CSS-informational?style=flat&color=informational&logo=tailwind-css">
  <img src="https://img.shields.io/badge/ORM-Prisma-informational?style=flat&color=success&logo=prisma">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-informational?style=flat&color=success&logo=postgresql">
  <img src="https://img.shields.io/badge/Authentication-Auth.js-informational?style=flat&color=success&logo=auth0">
  <img src="https://img.shields.io/badge/Language-TypeScript-informational?style=flat&color=blue&logo=typescript">
</div>

=====================

This repository contains the source code for Overflow API. Below are instructions on how to clone the repository, work on the development branch, and submit changes via pull requests.

## Frontend Setup

The Frontend setup instructions can be found in the [frontend repository](https://github.com/khoido2003/overflow-web).

## Cloning the Repository

To get started with the project, follow these steps to clone the repository to your local machine:

### Step 1: Clone the Repository

To get started with the project, follow these steps to clone the repository to your local machine:

1. Open a terminal or command prompt.
2. Use `git clone` command to clone the repository:

```bash
  git clone https://github.com/khoido2003/overflow-api.git
```

## Switching to the Development Branch

Once the repository is cloned, switch to the development branch to start working on your changes:

### Step 0: Navigate into the Project Directory

```bash
  cd overflow-api
```

### Step 1: Fetch the new branch

```bash
  git fetch origin

```

### Step 2: Checkout the Development Branch

```bash
  git checkout development
```

### Step 3: Create a `.env` file in the root of the backend directory and add the necessary environment variables:

```env
PORT=
NODE_ENV=
CORS_ORIGIN=
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_COOKIES_EXPIRES_IN=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
DATABASE_URL=
```

## Making Changes and Committing

Now you can make your changes to the codebase. After making changes, follow these steps to commit them:

### Step 1: Stage Your Changes for Commit

```bash
  git add -A
```

### Step 2: Commit Your Changes with a Descriptive Message

```bash
  git commit -m "Your descriptive commit message here"
```

## Pushing Changes and Creating a Pull Request

Once you are ready to submit your changes for review and inclusion in the main branch, follow these steps:

### Step 1: Push Your Changes to Your Fork of the Repository

```bash
git push origin development
```

### Step 2: Create a Pull Request on GitHub

1. Visit the repository on GitHub.
2. Click on the "Pull requests" tab.
3. Click the green "New pull request" button.
4. Select main branch as the base branch and development branch as the compare branch.
5. Review your changes and provide a descriptive title and comment for your pull request.
6. Click on the "Create pull request" button to submit your changes.

## Review and Merge

After submitting your pull request, it will be reviewed by the project maintainers. Make sure to respond to any feedback or comments provided. Once approved, your changes will be merged into the main branch.
