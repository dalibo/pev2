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


## Run E2E tests

```sh
npm run test:docker:build
npm run test:docker
```

E2E tests are executed inside a Docker container using Playwright, ensuring consistent results between local and CI environments. The Docker image only needs to be built once before running the tests, unless dependencies change.

### Update snapshots

```sh
npm run test:docker:update
```

Visual testing via snapshots is supported by Playwright. To update or create new snapshots, run this command.