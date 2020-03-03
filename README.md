# pev2

A VueJS component to show a graphical vizualization of a PostgreSQL execution plan.

[![Greenkeeper badge](https://badges.greenkeeper.io/dalibo/pev2.svg)](https://greenkeeper.io/)

See [Demo][demo].

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

## Usage

PEV2 is intended to be used as VueJS component.

Install it:

```
npm install pev2
```

Declare the `PEV2` component and use it:

```javascript
import pev2 from "pev2";

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
  href="https://unpkg.com/bootstrap@4.3.1/dist/css/bootstrap.min.css"
  rel="stylesheet"
/>
<link
  href="https://unpkg.com/font-awesome@4.7.0/css/font-awesome.css"
  rel="stylesheet"
/>
```

For a complete example, see [this codesandbox][codesandbox].

[pev]: https://github.com/AlexTatiyants/pev
[atatiyan]: https://github.com/AlexTatiyants
[codesandbox]: https://codesandbox.io/s/pev2-ry2dd
[demo]: https://dalibo.github.io/pev2
