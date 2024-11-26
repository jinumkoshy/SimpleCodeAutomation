import fs from "fs-extra";
import path from "path";
import simpleGit from "simple-git";
import { execSync } from "child_process";
import { OpenAI } from "openai";
import { glob } from "glob";

// Initialize OpenAI with the API key from the environment
const openai = new OpenAI({
    apiKey: "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", // Use environment variable for security
});

// Get the list of changed files from the pull request
const getChangedFiles = () => {
    console.log("Getting list of changed files in the pull request...");
    const changedFiles = execSync("git diff --name-only HEAD^", { encoding: "utf-8" });
    return changedFiles.split("\n").filter((file) => file.trim().length > 0);
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
    return fs.existsSync(specFilePath);
};

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

        // Stage changes
        const git = simpleGit();
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
