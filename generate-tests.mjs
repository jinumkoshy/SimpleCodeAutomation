import fs from "fs-extra";
import path from "path";
import simpleGit from "simple-git";
import { execSync } from "child_process";
import { OpenAI } from "openai";

// Initialize OpenAI with the API key from the environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN
});

const configureGitWithToken = (gitToken, repoUrl) => {
    if (!gitToken) {
        throw new Error("GIT_PERSONAL_ACCESS_TOKEN is not set in the environment.");
    }

    const remoteUrl = `https://${gitToken}@${repoUrl.replace('https://', '')}`;

    const git = simpleGit();

    // Configure Git credentials
    git.addConfig('user.name', 'Your Name') // Replace with your name
        .addConfig('user.email', 'your-email@example.com') // Replace with your email
        .addConfig('remote.origin.url', remoteUrl);

    return git;
};

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


// Generate unit tests with OpenAI
const generateUnitTests = async (filePath) => {
    const fileContent = await fs.readFile(filePath, "utf-8");
    console.log(`Generating unit tests for file: ${filePath}`);

    const prompt = `
        Generate valid unit tests in TypeScript using Jest framework for the following code:
        Do not include any setup instructions, external library imports like 'supertest', or other boilerplate code. 
        Ensure the tests are robust and include the following: Validate expected behavior for valid inputs and scenarios, 
        Check error handling, invalid inputs, and unexpected situations, Test edge cases such as minimum, maximum, or empty values.
        Only provide the Jest test code in TypeScript, without markdown or code block delimiters like \`\`\`.
        The generated code should be complete, structured, and ready to run with Jest.
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

    const testCode = response.choices[0]?.message?.content?.trim();
    if (!testCode) {
        throw new Error("Failed to generate unit tests.");
    }

    return testCode;
};

// Check if a corresponding .spec file exists
const checkSpecFileExists = (filePath) => {
    const specFilePath = filePath.replace(/\.(js|ts)$/, ".spec.$1");
    return fs.existsSync(specFilePath);
};

// Function to push changes to GitHub
async function pushToGitHub(gitToken, repoUrl) {
    const git = configureGitWithToken(gitToken, repoUrl);
    await git.add(".");
    await git.commit("Add/Update unit tests for changed files");
    await git.push();
    console.log("Unit tests added/updated and changes pushed to the repository.");
}

// Main function
const main = async () => {
    try {
        // Get the list of changed files in the pull request
        const changedFiles = getChangedFiles();

        // Filter for TypeScript or JavaScript files
        const sourceFiles = changedFiles.filter((file) => /\.(ts|js)$/.test(file));

        if (sourceFiles.length === 0) {
            console.log("No source files changed. Nothing to process.");
            return;
        }

        for (const filePath of sourceFiles) {
            try {
                const absolutePath = path.resolve(filePath);

                // Check if a spec file already exists
                if (checkSpecFileExists(absolutePath)) {
                    console.log(`Spec file already exists for: ${filePath}. Updating...`);
                } else {
                    console.log(`No spec file found for: ${filePath}. Creating a new one...`);
                }

                // Generate unit tests
                const testCode = await generateUnitTests(absolutePath);

                // Create or update the spec file
                const specFilePath = absolutePath.replace(/\.(ts|js)$/, ".spec.$1");
                await fs.writeFile(specFilePath, testCode, "utf-8");
                console.log(`Unit test written to: ${specFilePath}`);
            } catch (error) {
                console.error(`Failed to process file ${filePath}:`, error.message);
            }
        }

        const gitToken = process.env.GITHUBKEY_TOKEN;
        // GitHub repository URL (e.g., 'github.com/username/repo.git')
        const repoUrl = process.env.REPO_URL || 'github.com/jinumkoshy/SimpleCodeAutomation.git';
        // Call the function to push changes
        await pushToGitHub(gitToken, repoUrl);
    } catch (error) {
        console.error("Error:", error.message);
    }
};

// Run the script
main().catch((error) => console.error("Unhandled Error:", error.message));
