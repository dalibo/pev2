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

### Installation

```
npm install
```

### Application

#### Run the application locally

```
npm run serve
```

This runs the example application in development mode.

You can also run `vue ui`

#### Build the application

```
npm run build
```

Application is built in the `dist-app` directory. This application is standalone
and doesn't require a backend.

You can run this simple web app using any web server.

#### Build docker container

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

## Plan Vue Component

As opposed to [PEV][pev], PEV2 can be used as a component in a third-party
library.

### Compile and minify Plan component as a library

The graphical visualizer component (Plan.vue) can be built as a library to be
used in an other application.

```
npm run build-lib
```

Library is built in the `dist` directory.

### Usage

Once built, you can load the library in your application.

PEV2 requires `VueJS`, `Bootstrap (CSS)` and `FontAwesome` to work.

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Vue.js -->
    <script type="text/javascript" src="https://unpkg.com/vue"></script>
    <!-- Bootstrap and FontAwesome -->
    <link
      href="https://unpkg.com/bootstrap@4.3.1/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://unpkg.com/font-awesome@4.7.0/css/font-awesome.css"
      rel="stylesheet"
    />

    <!-- PEV2 -->
    <script src="pev2.umd.js"></script>
    <link href="pev2.css" rel="stylesheet" />
    <style>
      html,
      body {
        height: 100%;
      }
      #app {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="app">
      <pev2 :plan-source="plan" :plan-query="query"></pev2>
    </div>

    <script>
      var plan = `
                                                           QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------------
 Nested Loop  (cost=4.33..118.25 rows=10 width=488) (actual time=0.370..1.126 rows=10 loops=1)
   ->  Bitmap Heap Scan on tenk1 t1  (cost=4.33..39.44 rows=10 width=244) (actual time=0.254..0.380 rows=10 loops=1)
         Recheck Cond: (unique1 < 10)
         ->  Bitmap Index Scan on tenk1_unique1  (cost=0.00..4.33 rows=10 width=0) (actual time=0.164..0.164 rows=10 loops=1)
               Index Cond: (unique1 < 10)
   ->  Index Scan using tenk2_unique2 on tenk2 t2  (cost=0.00..7.87 rows=1 width=244) (actual time=0.041..0.048 rows=1 loops=10)
         Index Cond: (unique2 = t1.unique2)
 Total runtime: 2.414 ms`;

      var query = `
SELECT *
FROM tenk1 t1, tenk2 t2
WHERE t1.unique1 < 10 AND t1.unique2 = t2.unique2;`;

      new Vue({
        el: "#app",
        data: function() {
          return {
            plan: plan,
            query: query
          };
        },
        components: {
          pev2: pev2
        }
      });
    </script>
  </body>
</html>
```

[pev]: https://github.com/AlexTatiyants/pev
[atatiyan]: https://github.com/AlexTatiyants
