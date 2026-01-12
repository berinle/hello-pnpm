# Hello World Node.js with pnpm on Cloud Foundry

This application demonstrates how to deploy a Node.js app using `pnpm` to Cloud Foundry, specifically in "vendored" mode where dependencies are pre-installed locally and uploaded.

## Deployment Strategy: Vendored/Offline

Cloud Foundry's Node.js buildpack natively supports `npm` and `yarn`. To use `pnpm` effectively—especially in environments where the buildpack cannot access the public internet—we "vendor" our dependencies.

We configure `pnpm` to use a flat `node_modules` structure (similar to npm) instead of symlinks. This allows us to upload the `node_modules` folder directly to CF.

### Configuration

1.  **.npmrc**: Contains `node-linker=hoisted`. This tells `pnpm` to install packages physically into `node_modules` without symlinks.
2.  **.cfignore**: **Does NOT** ignore `node_modules/`. This ensures the folder is uploaded during `cf push`.

### Steps to Deploy

1.  **Install Dependencies Locally:**
    Run this command to create the portable `node_modules` folder:
    ```bash
    pnpm install
    ```

2.  **Push the Application:**
    ```bash
    cf push
    ```
    The buildpack will detect the existing `node_modules` folder and skip the installation step (running `npm rebuild` if necessary for native modules).

## Local Development

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Start the app:**
    ```bash
    pnpm start
    ```
