

# Usage

## Without Building Tools

Download the `pev2.umd.js` file and use it in a simple HTML file:

``` HTML
<div id="app">
    <plan plan-source="source of the plan" plan-query="the query" />
</div>
<script src="//unpkg.com/vue"></script>
<script src="pev2.umd.js"></script>
<script type="module">
    const { Plan } = pev2
    const app = Vue.createApp({
        components: { Plan },
    }).mount('#app')
</script>
```
