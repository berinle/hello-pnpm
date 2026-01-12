# Hello World Node.js with pnpm on Cloud Foundry

This is a simple Hello World Node.js application using `pnpm` as the package manager, ready for deployment to Cloud Foundry.

## Deployment

To deploy this application to Cloud Foundry, make sure you have the CF CLI installed and are logged in.

### Important Note for pnpm

Since Cloud Foundry's Node.js buildpack does not natively support `pnpm` (it defaults to `npm` or `yarn`), we must ensure that the local `node_modules` directory is **not** uploaded during deployment.

We achieve this by adding a `.cfignore` file to the root of the project with the following content:

```
node_modules/
.git/
.DS_Store
```

This forces the buildpack to run a fresh install on the server. Although the buildpack will use `npm install` (since it sees `package.json` but no `yarn.lock`), it will successfully install the dependencies listed in `package.json`.

### Steps

1.  **Push the application:**

    ```bash
    cf push
    ```

2.  **Access the application:**
    Once deployed, the CLI will output the route (URL) for your application.

## Local Development

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Start the app:**

    ```bash
    pnpm start
    ```
