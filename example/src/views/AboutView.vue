<script lang="ts" setup>
import MainLayout from "../layouts/MainLayout.vue"
</script>

<template>
  <main-layout>
    <div class="container">
      <h2>Disclaimer</h2>
      <p>
        This project is a rewrite of the excellent
        <a href="https://github.com/AlexTatiyants/pev"
          >Postgres Explain Visualizer (pev)</a
        >. Kudos go to Alex Tatiyants.
      </p>

      <p>
        The pev project was initialy written in early 2016 but seem to be
        abandonned since then. There was no activity at all for more than
        <a href="https://github.com/AlexTatiyants/pev/issues/42"
          >3 years and counting</a
        >
        though there are
        <a href="https://github.com/AlexTatiyants/pev/issues"
          >several issues open</a
        >
        and relevant pull requests pending.
      </p>

      <h2>Usage tips</h2>
      <p>
        To get the most out of it, we recommend generating a query plan using
        the following line:
        <code>EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)</code>. It
        is recommend submitting a (decently formatted) SQL query that generated
        the plan.
      </p>
      <p>
        PEV2 can also parse text although the JSON format usually has better
        support.
      </p>

      <h2>Help improve PEV2</h2>
      <p>You can help us.</p>

      <p>
        Report issues or contribute to the code on
        <a href="https://github.com/dalibo/pev2">Github</a>.
      </p>

      <hr />
      <div class="text-center text-muted">
        <b>pev2</b> is brought to you by
        <a href="https://dalibo.com">Dalibo</a>
      </div>
    </div>
  </main-layout>
</template>
