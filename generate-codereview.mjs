import fs from "fs-extra";
import path from "path";
import simpleGit from "simple-git";
import { execSync } from "child_process";
import { Octokit } from "@octokit/rest"; // GitHub API client
import { OpenAI } from "openai";

// Initialize OpenAI with the API key from the environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN,
});

// Initialize Octokit with GitHub token
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

// Get the list of changed files from the source and destination branches
const getChangedFiles = () => {
    console.log("Getting list of changed files between the source and destination branches...");

    try {
        // Ensure all remote branches are fetched
        console.log("Fetching all remote branches...");
        execSync("git fetch --all", { stdio: "inherit" });

        // Get the name of the current source branch
        const sourceBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();

        // Define the destination branch (update 'main' if your default branch is different)
        const destinationBranch = "main";

        console.log(`Comparing changes from source branch: ${sourceBranch} to destination branch: ${destinationBranch}`);

        // Ensure the destination branch is fetched
        execSync(`git fetch origin ${destinationBranch}`, { stdio: "inherit" });

        // Get the list of changed files between the two branches
        const changedFiles = execSync(`git diff --name-only origin/${destinationBranch}..${sourceBranch}`, { encoding: "utf-8" });

        return changedFiles.split("\n").filter((file) => file.trim().length > 0);
    } catch (error) {
        console.error("Error fetching changed files:", error.message);
        return [];
    }
};

// Generate review comments with OpenAI
const generateReviewComment = async (filePath) => {
    const fileContent = await fs.readFile(filePath, "utf-8");
    console.log(`Generating review comment for file: ${filePath}`);

    const prompt = `
        Review the following TypeScript/JavaScript code for potential issues or areas where unit tests are missing.
        Provide clear and actionable suggestions for improvement. Focus on code logic, error handling, and edge cases.
        Include examples of unit tests that could be added.
        ${fileContent}
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
        ],
        max_tokens: 1500,
    });

    const reviewComment = response.choices[0]?.message?.content?.trim();
    if (!reviewComment) {
        throw new Error("Failed to generate review comment.");
    }

    return reviewComment;
};

// Post review comments on the PR using GitHub API
const postReviewComment = async (repoOwner, repoName, pullNumber, filePath, comment) => {
    try {
        const diffResponse = await octokit.rest.pulls.listFiles({
            owner: repoOwner,
            repo: repoName,
            pull_number: pullNumber,
        });

        // Find the file in the pull request
        const fileDiff = diffResponse.data.find((file) => file.filename === filePath);

        if (!fileDiff) {
            console.error(`File ${filePath} not found in the pull request.`);
            return;
        }

        // Use the first line of the diff as the target line for the comment
        const line = fileDiff.changes > 0 ? fileDiff.patch.split("\n")[0] : 1;

        await octokit.rest.pulls.createReviewComment({
            owner: repoOwner,
            repo: repoName,
            pull_number: pullNumber,
            body: comment,
            path: filePath,
            line: line,
        });

        console.log(`Review comment added for file: ${filePath}`);
    } catch (error) {
        console.error(`Failed to post review comment for file ${filePath}:`, error.message);
    }
};

// Main function
const main = async () => {
    try {
        // Get the list of changed files in the pull request
        const changedFiles = getChangedFiles();

        // Filter for TypeScript or JavaScript files, excluding .spec files
        const sourceFiles = changedFiles.filter(
            (file) => /\.(ts|js)$/.test(file) && !/\.spec\.(ts|js)$/.test(file)
        );

        if (sourceFiles.length === 0) {
            console.log("No source files changed. Nothing to process.");
            return;
        }

        // Get repository information
        const repoOwner = process.env.REPO_OWNER;
        const repoName = process.env.REPO_NAME;
        const pullNumber = parseInt(github.event.number, 10);

        console.console.log(`pullNumber ${pullNumber}:`, pullNumber);

        if (!repoOwner || !repoName || !pullNumber) {
            throw new Error("Repository owner, name, or pull request number is missing.");
        }

        for (const filePath of sourceFiles) {
            try {
                const absolutePath = path.resolve(filePath);

                // Generate review comment
                const reviewComment = await generateReviewComment(absolutePath);

                // Post the review comment to the PR
                await postReviewComment(repoOwner, repoName, pullNumber, filePath, reviewComment);
            } catch (error) {
                console.error(`Failed to process file ${filePath}:`, error.message);
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
};

// Run the script
main().catch((error) => console.error("Unhandled Error:", error.message));
