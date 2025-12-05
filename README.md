# ROC Agent in GitHub Action

A GitHub Action for performing deep packet analysis using the ROC (Runtime Observability and Compliance) engine. This action provides automated security analysis of network traffic and system behavior during CI/CD workflows.

## Overview

The ROC Agent GitHub Action runs the ROC engine in a Docker container to monitor and analyze network activity and system behavior in your repository. It leverages pattern matching to detect potential security issues, compliance violations, and suspicious network traffic patterns.

## Features

- Automated network and runtime analysis during CI/CD
- Pattern-based detection of security vulnerabilities
- Docker containerized execution
- Customizable configuration and output directories
- SSL library integration for secure analysis
- Real-time monitoring and logging
- Automatic cleanup of resources

## Prerequisites

- Docker must be available in the GitHub Actions runner
- Valid API key for the license validation server
- ROC configuration files (patterns, rules, etc.)

## Usage

### Basic Example

```yaml
name: ROC Security Analysis
on: [push, pull_request]

jobs:
  roc-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run ROC Analysis
        uses: secai/roc-agent@v1
        with:
          server-url: ${{ secrets.ROC_SERVER_URL }}
          api-key: ${{ secrets.ROC_API_KEY }}
          patterns: pattern.yaml
```

### Complete Example with All Options

```yaml
name: Comprehensive ROC Analysis
on: [push, pull_request]

jobs:
  roc-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup ROC Configuration
        run: |
          mkdir -p roc-config
          # Add your pattern files to the config directory
          echo '# Your pattern configuration here' > roc-config/pattern.yaml

      - name: Run ROC Analysis
        uses: secai/roc-agent@v1
        with:
          server-url: ${{ secrets.ROC_SERVER_URL }}
          api-key: ${{ secrets.ROC_API_KEY }}
          patterns: pattern.yaml
          config-dir: roc-config
          output-dir: roc-output
          docker-image: public.ecr.aws/f9o7b7m0/roc
          additional-args: "--verbose --timeout 300"
          ssl-lib-path: /lib/x86_64-linux-gnu
          ssl-lib-version: "3"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `server-url` | Yes | `https://api.codexsecurity.io` | License validation server URL |
| `api-key` | Yes | - | API key for authentication |
| `patterns` | Yes | `pattern.yaml` | Path to YAML patterns file (relative to config dir) |
| `config-dir` | No | `roc-config` | Directory containing ROC config files |
| `output-dir` | No | `roc-output` | Directory for ROC output files |
| `docker-image` | No | `public.ecr.aws/f9o7b7m0/roc` | ROC Docker image to use |
| `additional-args` | No | `""` | Additional arguments to pass to ROC |
| `ssl-lib-path` | No | `/lib/x86_64-linux-gnu` | Path to SSL library on host system |
| `ssl-lib-version` | No | `"3"` | SSL library version (3 for libssl.so.3, 1.1 for libssl.so.1.1) |

## Development

### Local Development

To build and test this action locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the action:
   ```bash
   npm run build
   ```

3. Test the action locally (requires Docker):
   ```bash
   npm run dev
   ```

### Building for Production

The GitHub Action is built using Vercel's ncc compiler to create a single JavaScript file in the `dist/` directory:

```bash
npm run build
```

This command compiles the `index.js` file and all its dependencies into a single file in the `dist/` directory that can be used in GitHub Actions.

## Security Considerations

- Store your API key in GitHub Secrets and never commit it to your repository
- Review patterns carefully to ensure they don't cause false positives in your environment
- Monitor the Docker container's behavior and logs during execution
- Ensure SSL libraries are properly configured for secure communication

## Troubleshooting

### Common Issues

1. **Docker not available**: Make sure your GitHub Actions runner has Docker available.
2. **SSL Library Issues**: Verify SSL library paths and versions match your runner's configuration.
3. **API Key Errors**: Double-check that your API key is correctly set in GitHub Secrets.

### Getting Logs

To see detailed logs from the ROC container:
```yaml
- name: Run ROC Analysis
  id: roc
  uses: secai/roc-agent@v1
  with:
    # your configuration
- name: Print ROC Logs
  run: |
    echo "Container Logs:"
    echo "${{ steps.roc.outputs.logs }}"
```

## License

This project is licensed under the terms provided by SecurableAI.

## Maintainers

- SecurableAI

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.
