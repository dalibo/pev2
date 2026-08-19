# pev2

## Prerequisites

For the develoment of this project you need to have NPM version > 8 installed.

## Project Setup

```sh
npm ci
```

## Compile and Hot-Reload for Development

```sh
npm run dev
```

You'll get the URL to test your modifications (typically <http://localhost:5173/>).

Any change on the code will force a recompilation and update the page.

## Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Run unit and service tests

```sh
npm run test
```

## Run Visual tests

```sh
npm run test:visual:build
npm run test:visual:run
```

Visual tests are executed inside a Docker container using Playwright, ensuring consistent results between local and CI environments. The Docker image only needs to be built once before running the tests, unless dependencies change.

### Display html report

```sh
npm run test:visual:report
```

### Update snapshots

```sh
npm run test:visual:update
```

Visual testing via snapshots is supported by Playwright. To update or create new snapshots, run this command.

## How to release?

### Build library and tag version

```sh
npm version minor
git push origin master
git push --tags
```



Wait for the automatic build to finish.

Edit the release changelog on GitHub.

An index.html file should be added automatically to the release assets by GitHub Action.

### Publish to npm
