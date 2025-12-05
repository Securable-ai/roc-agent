const core = require("@actions/core");
const exec = require("@actions/exec");
const fs = require("fs-extra");
const path = require("path");

async function run() {
  try {
    const patternsYamlContent = core.getInput("patterns_yaml", {
      required: true,
    });
    const dockerImage = "hanshal785/roc:v5";
    const serverUrl = core.getInput("server_url", { required: true });
    const apiKey = core.getInput("api_key", { required: true });
    const projectName = core.getInput("project_name", { required: true });

    const patternsFileInsideContainer = "/tmp/roc-config/pattern.yaml";
    const watchDirInsideContainer = "/tmp/roc-output";
    const libsslContainerPath = "/usr/lib64/libssl.so.3";
    const libcryptoContainerPath = "/usr/lib64/libcrypto.so.3";

    const libsslHostPath =
      core.getInput("libssl_host_path", { required: false }) ||
      "/lib/x86_64-linux-gnu/libssl.so.3";
    const libcryptoHostPath =
      core.getInput("libcrypto_host_path", { required: false }) ||
      "/lib/x86_64-linux-gnu/libcrypto.so.3";

    const containerName =
      core.getInput("container_name", { required: false }) ||
      "roc-action-container";
    const outputDirHostPath =
      core.getInput("output_dir", { required: false }) || "./roc-action-output";
    const extraDockerArgs = core.getInput("args", { required: false }) || "";

    const workspace = process.env.GITHUB_WORKSPACE;

    const hostConfigDir = path.join(workspace, "roc-config-action");
    const hostOutputDir = path.join(
      workspace,
      outputDirHostPath.replace("./", ""),
    );

    await fs.ensureDir(hostConfigDir);
    await fs.ensureDir(hostOutputDir);

    core.info(`Host Config Dir: ${hostConfigDir}`);
    core.info(`Host Output Dir: ${hostOutputDir}`);

    const hostPatternFilePath = path.join(hostConfigDir, "pattern.yaml");
    await fs.writeFile(hostPatternFilePath, patternsYamlContent);
    core.info(`User-provided patterns file written to: ${hostPatternFilePath}`);

    const dockerRunCmd = [
      "docker",
      "run",
      "-d",
      "--name",
      containerName,
      "--privileged",
      "--pid=host",
      "--network=host",
      "-v",
      "/proc:/proc",
      "-v",
      "/sys:/sys",
      "-v",
      `${libsslHostPath}:${libsslContainerPath}`,
      "-v",
      `${libcryptoHostPath}:${libcryptoContainerPath}`,
      "-v",
      `${hostOutputDir}:/tmp/roc-output`,
      "-v",
      `${hostConfigDir}:/tmp/roc-config:ro`,
      ...extraDockerArgs.split(" "),
      dockerImage,
      "--server-url",
      serverUrl,
      "--api-key",
      apiKey,
      "--project-name",
      projectName,
      "--patterns",
      patternsFileInsideContainer,
      "--watch",
      watchDirInsideContainer,
    ].filter((arg) => arg !== "");

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
  }
}

run();
