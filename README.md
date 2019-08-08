# pev2

[![Greenkeeper badge](https://badges.greenkeeper.io/dalibo/pev2.svg)](https://greenkeeper.io/)

A VueJS app to show a graphical vizualization of a PostgreSQL execution plan.

## Disclaimer

This project is a rewrite of the excellent [Postgres Explain Visualizer
(pev)][pev]. Kudos go to [Alex Tatiyants][atatiyan].

The [pev][pev] project was initialy written in early 2016 but seem to be
abandonned since then. There was no activity at all for more than 3 years and
counting though there are several issues open and relevant pull requests
pending.

The current project has several goals:

- isolate the plan view component and its dependencies in order to use it in
  any web app with for example the ability to load a plan without requiring
  any copy-paste from the user,
- make it work with recent version of JS frameworks,
- upgrade Bootstrap to a more recent version,
- use VueJS just for a matter of taste,
- maintain the project to match upgrades in PostgreSQL.

## Project setup

```
npm install
```

## Run the application locally

```
npm run serve
```

You can also run `vue ui`

## Build the application

```
npm run build
```

Application is built in the `dist` directory. This application is standalone
and doesn't require a backend.

## Compile and minify Plan component as a library

The graphical visualizer component (Plan.vue) can be built as a library to be
used in an other application.

```
npm run build-lib
```

Library is built in the `dist-lib` directory.

[pev]: https://github.com/AlexTatiyants/pev
[atatiyan]: https://github.com/AlexTatiyants
