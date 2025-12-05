const core = require("@actions/core");
const exec = require("@actions/exec");
const io = require("@actions/io");
const fs = require("fs-extra");
const path = require("path");

async function run() {
  try {
    // Get inputs
    const serverUrl = core.getInput("server-url", { required: true });
    const apiKey = core.getInput("api-key", { required: true });
    const patterns = core.getInput("patterns", { required: true });
    const configDir = core.getInput("config-dir") || "roc-config";
    const outputDir = core.getInput("output-dir") || "roc-output";
    const dockerImage =
      core.getInput("docker-image") || "public.ecr.aws/f9o7b7m0/roc";
    const additionalArgs = core.getInput("additional-args") || "";
    const sslLibPath = core.getInput("ssl-lib-path") || "/lib/x86_64-linux-gnu";
    const sslLibVersion = core.getInput("ssl-lib-version") || "3";

    core.info("ROC GitHub Action started");
    core.info(`Server URL: ${serverUrl}`);
    core.info(`Config directory: ${configDir}`);
    core.info(`Pattern file: ${patterns}`);
    core.info(`Output directory: ${outputDir}`);

    // Validate pattern file exists
    const patternFilePath = path.join(
      process.env.GITHUB_WORKSPACE || ".",
      configDir,
      patterns,
    );
    if (!fs.existsSync(patternFilePath)) {
      throw new Error(`Pattern file does not exist: ${patternFilePath}`);
    }

    core.info(`Pattern file found: ${patternFilePath}`);
    const patternContent = fs.readFileSync(patternFilePath, "utf8");
    core.info(
      `Pattern file content preview: ${patternContent.substring(0, 200)}...`,
    );

    // Check SSL libraries exist
    const sslLibExists = await checkSslLibraries(sslLibPath, sslLibVersion);
    if (!sslLibExists) {
      core.warning(
        `SSL libraries not found at ${sslLibPath}. ROC may fail to start.`,
      );
    } else {
      core.info(`SSL libraries found at: ${sslLibPath}`);
    }

    // Create directories
    await fs.ensureDir(outputDir);
    await fs.ensureDir(configDir);

    // Build SSL arguments
    let sslArgs = [];
    if (sslLibExists) {
      sslArgs = [
        `-v`,
        `${sslLibPath}/libssl.so.${sslLibVersion}:/usr/lib64/libssl.so.${sslLibVersion}`,
        `-v`,
        `${sslLibPath}/libcrypto.so.${sslLibVersion}:/usr/lib64/libcrypto.so.${sslLibVersion}`,
      ];
    }

    // Build docker run command
    const dockerRunCmd = [
      "run",
      "-d",
      "--name",
      "roc-test",
      "--privileged",
      "--pid=host",
      "--network=host",
      "-v",
      "/proc:/proc",
      "-v",
      "/sys:/sys",
      ...sslArgs,
      "-v",
      `${process.env.GITHUB_WORKSPACE || "."}/${outputDir}:/tmp/roc-output`,
      "-v",
      `${process.env.GITHUB_WORKSPACE || "."}/${configDir}:/tmp/roc-config:ro`,
      dockerImage,
      "--server-url",
      serverUrl,
      "--api-key",
      apiKey,
      "--patterns",
      `/tmp/roc-config/${patterns}`,
      "--watch",
      "/tmp/roc-output",
    ];

    core.info(`Running Docker command: ${dockerRunCmd.join(" ")}`);
    const dockerRunExitCode = await exec.exec(
      dockerRunCmd[0],
      dockerRunCmd.slice(1),
    );
    if (dockerRunExitCode !== 0) {
      core.setFailed(`Docker run failed with exit code ${dockerRunExitCode}`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 20000));

    core.setOutput("container_name", containerName);
    core.info(
      `Container '${containerName}' started and ready for external interaction.`,
    );
  } catch (error) {
    core.setFailed(error.message);
    core.error(error.stack);
  }
}

run();
