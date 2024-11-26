import fs from "fs-extra";
import path from "path";
import simpleGit from "simple-git";
import { OpenAI } from "openai";
import { execSync } from "child_process";

// Initialize OpenAI
const openai = new OpenAI({
});

// Fetch pull request and get changed files
const getChangedFiles = (git, pullRequestBranch) => {
    console.log(`Fetching pull request branch: ${pullRequestBranch}`);
    git.fetch(`origin`, pullRequestBranch);
    console.log("Pull request branch fetched.");

    console.log("Getting list of changed files in the pull request...");
    const changedFiles = execSync(`git diff --name-only origin/${pullRequestBranch}`, { encoding: "utf-8" });
    return changedFiles.split("\n").filter((file) => file.trim().length > 0);
};

// Check if a corresponding .spec file exists
const getSpecFilePath = (filePath) => {
    const specFilePath = filePath.replace(/\.(ts|js)$/, ".spec.$1");
    return specFilePath;
};

const specFileExists = (specFilePath) => fs.existsSync(specFilePath);

// Generate or update unit tests with OpenAI
const generateOrUpdateUnitTests = async (filePath, specFilePath) => {
    const fileContent = await fs.readFile(filePath, "utf-8");
    console.log(`Generating or updating unit tests for file: ${filePath}`);

    const prompt = `
        Generate valid unit tests in TypeScript using Jest framework for the following code:
        - If unit tests already exist, improve and add edge case coverage.
        - If no unit tests exist, create new ones.
        - Do not include any setup instructions, external library imports, or boilerplate code.
        Only provide the Jest test code in TypeScript, without markdown or code block delimiters.
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
        throw new Error("Failed to generate or update unit tests.");
    }

    // Update or create the test file
    if (specFileExists(specFilePath)) {
        console.log(`Updating existing test file: ${specFilePath}`);
        await fs.appendFile(specFilePath, `\n\n// New tests:\n\n${testCode}`);
    } else {
        console.log(`Creating new test file: ${specFilePath}`);
        await fs.writeFile(specFilePath, testCode);
    }

    console.log(`Unit tests generated/updated for: ${filePath}`);
};

// Main function
const main = async () => {
    const repoUrl = "https://github.com/nodejs/examples.git"; // Replace with your repository URL
    const pullRequestBranch = "feature/my-pull-request"; // Replace with the branch name of the PR
    const cloneDir = path.resolve(process.cwd(), "cloned-repo");

    // Step 1: Clone the repository
    console.log(`Cloning repository: ${repoUrl}`);
    const git = simpleGit();
    await git.clone(repoUrl, cloneDir);
    console.log(`Repository cloned to: ${cloneDir}`);

    // Change working directory to cloned repo
    process.chdir(cloneDir);

    // Step 2: Fetch the pull request and get the changed files
    const changedFiles = getChangedFiles(git, pullRequestBranch);

    if (changedFiles.length === 0) {
        console.log("No files changed in this pull request.");
        return;
    }

    console.log(`Changed files in the pull request:\n${changedFiles.join("\n")}`);

    // Step 3: Process each changed file
    for (const filePath of changedFiles) {
        // Check if the file is a source code file
        if (!filePath.match(/\.(ts|js)$/)) {
            console.log(`Skipping non-code file: ${filePath}`);
            continue;
        }

        try {
            const specFilePath = getSpecFilePath(filePath);

            // Generate or update unit tests
            await generateOrUpdateUnitTests(filePath, specFilePath);
        } catch (error) {
            console.error(`Failed to process file ${filePath}:`, error);
        }
    }

    console.log("All changed files have been processed.");
};

// Run the script
main().catch((error) => console.error("Error:", error));
