# pev2

A VueJS component to show a graphical vizualization of a PostgreSQL execution plan.

## Usage

To use the explain vizualizer you can choose one of the following options:

### Local installation using release archive

You can download `pev2.tar.gz` for the [latest released
version](https://github.com/dalibo/pev2/releases/latest) of PEV2.
Simply extract the archive and launch `index.html` in your browser.

_This should also work offline._

### Local installation using docker

See [CONTRIBUTING](https://github.com/dalibo/pev2/blob/master/CONTRIBUTING.md).

### Dalibo service

[explain.dalibo.com][explain.dali.bo]

This service is provided by `Dalibo` and can help you share your plans with
colleagues or customers. The plans are stored in a Database but the links are
not published.

It is updated after each release.

### Integrated

PEV2 can be integrated in a web application.

Install it:

```
npm install pev2
```

Declare the `PEV2` component and use it:

```javascript
import pev2 from "pev2";

new Vue({
  el: "#app",
  data: function () {
    return {
      plan: plan,
      query: query,
    };
  },
  components: {
    pev2: pev2,
  },
});
```

Then add the `PEV2` component to your template:

```html
<div id="app">
  <pev2 :plan-source="plan" :plan-query="query"></pev2>
</div>
```

`PEV2` requires `Bootstrap (CSS)` and `FontAwesome` to work so don't forget to
add the following in you header (or load them with your favorite bundler).

```html
<link
  href="https://unpkg.com/bootstrap@4.5.0/dist/css/bootstrap.min.css"
  rel="stylesheet"
/>
<link
  href="https://unpkg.com/@fortawesome/fontawesome-free@5.13.0/css/all.css"
  rel="stylesheet"
/>
```

For a complete example, see [this codesandbox][codesandbox].

[pev]: https://github.com/AlexTatiyants/pev
[atatiyan]: https://github.com/AlexTatiyants
[codesandbox]: https://codesandbox.io/s/pev2-ry2dd
[demo]: https://dalibo.github.io/pev2
[explain.dali.bo]: https://explain.dalibo.com

## Disclaimer

This project is a rewrite of the excellent [Postgres Explain Visualizer
(pev)][pev]. Kudos go to [Alex Tatiyants][atatiyan].

The [pev][pev] project was initialy written in early 2016 but seems to be
abandoned since then. There was no activity at all for more than 3 years and
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
