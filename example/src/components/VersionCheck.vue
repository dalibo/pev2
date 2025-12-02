<script setup lang="ts">
import { onMounted, ref } from "vue"
const localVersion = ref(__APP_VERSION__)
const remoteVersion = ref()
const updateRequired = ref(false)

async function checkForUpdate() {
  function compareVersions(a, b) {
    const pa = a.split(".").map(Number)
    const pb = b.split(".").map(Number)

    const len = Math.max(pa.length, pb.length)

    for (let i = 0; i < len; i++) {
      const na = pa[i] ?? 0
      const nb = pb[i] ?? 0

      if (na > nb) return 1
      if (na < nb) return -1
    }
    return 0
  }

  try {
    const resp = await fetch(
      "https://api.github.com/repos/dalibo/pev2/releases/latest",
    )

    if (!resp.ok) {
      console.warn("Could not check for updates:", resp.status)
      return
    }

    const data = await resp.json()
    remoteVersion.value = data.tag_name.replace(/^v/i, "")

    if (compareVersions(localVersion.value, remoteVersion.value) < 0) {
      updateRequired.value = true
    } else {
      console.log("pev2 is up to date.")
    }
  } catch (err) {
    console.error("Update check failed:", err)
  }
}

onMounted(() => {
  checkForUpdate()
})
</script>

<template>
  <div class="alert alert-danger d-inline-block" v-if="updateRequired">
    <p class="fw-bold">A new version of pev2 is available!</p>
    <p>
      Local version: <b>{{ localVersion }}</b>
      <br />
      Latest version: <b>{{ remoteVersion }}</b>
    </p>
    <p class="mb-0">
      You can download
      <a
        href="https://www.github.com/dalibo/pev2/releases/latest/download/pev2.html"
        >the latest version</a
      >.
    </p>
  </div>
</template>
