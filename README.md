# pgexplain

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
 - make it work with recent version of frameworks. The project doesn't seem to
     build anymore,
 - upgrade Bootstrap to a more recent version,
 - use VueJS just for a matter of taste.

## Project setup
```
npm install
```

### Compiles and minifies library for production
```
npm run build-bundle
```

[pev]: https://github.com/AlexTatiyants/pev
[atatiyan]: https://github.com/AlexTatiyants
