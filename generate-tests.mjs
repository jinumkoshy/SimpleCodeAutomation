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
        Only provide the Jest test code in TypeScript, without markdown or code block delimiters like \`\`\`.
        The generated code should be ready to run with Jest.
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
    return fs.existsSync(specFilePath) ? specFilePath : null;
};

// Update or overwrite an existing spec file
const updateSpecFile = async (specFilePath, newTestCode) => {
    try {
        console.log(`Updating existing spec file: ${specFilePath}`);
        const existingContent = await fs.readFile(specFilePath, "utf-8");
        
        // Append or merge the new test code with the existing content
        const updatedContent = `${existingContent}\n\n// Newly generated tests\n${newTestCode}`;
        
        await fs.writeFile(specFilePath, updatedContent, "utf-8");
        console.log(`Spec file updated: ${specFilePath}`);
    } catch (error) {
        console.error(`Failed to update spec file: ${specFilePath}`, error.message);
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

        for (const filePath of sourceFiles) {
            try {
                const absolutePath = path.resolve(filePath);

                // Check if a spec file already exists
                const specFilePath = checkSpecFileExists(absolutePath);
                if (specFilePath) {
                    console.log(`Spec file already exists for: ${filePath}. Updating...`);

                    // Generate unit tests
                    const newTestCode = await generateUnitTests(absolutePath);

                    // Update the existing spec file
                    await updateSpecFile(specFilePath, newTestCode);
                } else {
                    console.log(`No spec file found for: ${filePath}. Creating a new one...`);

                    // Generate unit tests
                    const testCode = await generateUnitTests(absolutePath);

                    // Create a new spec file
                    const newSpecFilePath = absolutePath.replace(/\.(ts|js)$/, ".spec.$1");
                    await fs.writeFile(newSpecFilePath, testCode, "utf-8");
                    console.log(`Unit test written to: ${newSpecFilePath}`);
                }
            } catch (error) {
                console.error(`Failed to process file ${filePath}:`, error.message);
            }
        }

        const gitToken = process.env.GITHUB_TOKEN;
        // GitHub repository URL (e.g., 'github.com/username/repo.git')
        const repoUrl = process.env.REPO_URL || 'github.com/jinumkoshy/SimpleCodeAutomation.git';
        // Initialize Git with token authentication
        const git = configureGitWithToken(gitToken, repoUrl);
        await git.add(".");
        await git.commit("Add/Update unit tests for changed files");
        await git.push();
        console.log("Unit tests added/updated and changes pushed to the repository.");
    } catch (error) {
        console.error("Error:", error.message);
    }
};

// Run the script
main().catch((error) => console.error("Unhandled Error:", error.message));
