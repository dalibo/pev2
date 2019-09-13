# Contributing to PEV2

## Project setup

### Example Application

The library comes with a standalone application.

You can either install and run the application using `npm` or use `docker`.

#### Run the application locally

```
npm install
npm run serve
```

This runs the example application in development mode.

You can also run `vue ui`.

#### Run the application with docker

- Install [Docker](https://www.docker.com/) if needed.
- Build docker image

```
docker build . -t pev2
```

- Run docker container

```
docker run -d -p 8080:80 pev2
```

After few seconds, open `http://localhost:8080` to enjoy pev2.

### Build library

To build the library (VueJS component and dependencies) use the following
command:

```
npm run build
```
