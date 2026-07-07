<script lang="ts" setup>
import { ref, onMounted, watch, computed } from "vue"
import { hashString, parseMarkdown } from "@/services/ai-service"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faKey,
  faLock,
  faRobot,
  faPlay,
  faCircleNotch,
  faCopy,
  faTrash,
  faExclamationCircle,
  faCheck,
  faSlidersH,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons"

interface Props {
  planSource: string
  planQuery?: string
}
const props = defineProps<Props>()

type Provider = "gemini" | "openai" | "ollama" | "anthropic"

const provider = ref<Provider>("gemini")
const apiKey = ref<string>("")
const endpointUrl = ref<string>("")
const selectedModel = ref<string>("")
const customModel = ref<string>("")
const savedConfigExists = ref<boolean>(false)
const isAnalyzing = ref<boolean>(false)
const analysisResult = ref<string>("")
const errorMsg = ref<string>("")
const showKey = ref<boolean>(false)
const copySuccess = ref<boolean>(false)

interface HistoryEntry {
  id: string
  timestamp: string
  planHash: string
  provider: string
  model: string
  result: string
}

const historyList = ref<HistoryEntry[]>([])
const activeHistoryId = ref<string>("")

const currentPlanHash = computed(() => hashString(props.planSource))
const filteredHistory = computed(() => {
  return historyList.value.filter(entry => entry.planHash === currentPlanHash.value)
})

watch(filteredHistory, (newHistory) => {
  if (newHistory.length > 0 && !newHistory.some(h => h.id === activeHistoryId.value)) {
    activeHistoryId.value = newHistory[0].id
    analysisResult.value = newHistory[0].result
  }
}, { immediate: true })

function selectHistoryEntry(id: string) {
  activeHistoryId.value = id
  const found = historyList.value.find(h => h.id === id)
  if (found) {
    analysisResult.value = found.result
  }
}

function deleteHistoryEntry(id: string) {
  historyList.value = historyList.value.filter(h => h.id !== id)
  localStorage.setItem("pev2_ai_history", JSON.stringify(historyList.value))
  if (activeHistoryId.value === id) {
    const remaining = filteredHistory.value
    if (remaining.length > 0) {
      selectHistoryEntry(remaining[0].id)
    } else {
      activeHistoryId.value = ""
      analysisResult.value = ""
    }
  }
}

const needsApiKey = computed(() => {
  if (provider.value === "ollama") return false
  if (endpointUrl.value.trim()) return false
  return true
})

const providerModels: Record<Provider, { name: string; value: string }[]> = {
  gemini: [
    { name: "Gemini 3.5 Flash (Recommended)", value: "gemini-3.5-flash" },
    { name: "Gemini 3.1 Pro", value: "gemini-3.1-pro" },
    { name: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { name: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    { name: "Custom...", value: "custom" },
  ],
  openai: [
    { name: "GPT-4o Mini", value: "gpt-4o-mini" },
    { name: "GPT-4o", value: "gpt-4o" },
    { name: "Custom...", value: "custom" },
  ],
  ollama: [
    { name: "Llama 3", value: "llama3" },
    { name: "Mistral", value: "mistral" },
    { name: "Codegemma", value: "codegemma" },
    { name: "Custom...", value: "custom" },
  ],
  anthropic: [
    { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest" },
    { name: "Claude 3.5 Haiku", value: "claude-3-5-haiku-latest" },
    { name: "Custom...", value: "custom" },
  ],
}

// Watch provider to reset default endpoints/models when changed in setup view
watch(provider, (newProvider) => {
  if (!savedConfigExists.value) {
    if (newProvider === "gemini") {
      selectedModel.value = "gemini-3.5-flash"
      endpointUrl.value = ""
    } else if (newProvider === "openai") {
      selectedModel.value = "gpt-4o-mini"
      endpointUrl.value = "https://api.openai.com/v1/chat/completions"
    } else if (newProvider === "ollama") {
      selectedModel.value = "llama3"
      endpointUrl.value = "http://localhost:11434"
    } else if (newProvider === "anthropic") {
      selectedModel.value = "claude-3-5-sonnet-latest"
      endpointUrl.value = "https://api.anthropic.com/v1/messages"
    }
  }
})

onMounted(() => {
  const storedProvider = localStorage.getItem("pev2_ai_provider") as Provider | null
  const storedKey = localStorage.getItem("pev2_ai_key")
  const storedEndpoint = localStorage.getItem("pev2_ai_endpoint")
  const storedModel = localStorage.getItem("pev2_ai_model")
  const storedHistory = localStorage.getItem("pev2_ai_history")

  if (storedHistory) {
    try {
      historyList.value = JSON.parse(storedHistory)
    } catch (e) {
      historyList.value = []
    }
  }

  if (storedProvider) {
    provider.value = storedProvider
    apiKey.value = storedKey || ""
    endpointUrl.value = storedEndpoint || ""
    
    // Check if the stored model is a default model or custom
    const defaults = providerModels[storedProvider].map(m => m.value)
    if (storedModel && defaults.includes(storedModel)) {
      selectedModel.value = storedModel
    } else if (storedModel) {
      selectedModel.value = "custom"
      customModel.value = storedModel
    }
    
    savedConfigExists.value = true
  } else {
    // Default values
    provider.value = "gemini"
    selectedModel.value = "gemini-3.5-flash"
  }
  localStorage.setItem("aiIsNotNew", "true")
})

function saveConfig() {
  localStorage.setItem("pev2_ai_provider", provider.value)
  localStorage.setItem("pev2_ai_key", apiKey.value.trim())
  localStorage.setItem("pev2_ai_endpoint", endpointUrl.value.trim())
  
  const modelToSave = selectedModel.value === "custom" ? customModel.value.trim() : selectedModel.value
  localStorage.setItem("pev2_ai_model", modelToSave)
  
  savedConfigExists.value = true
  errorMsg.value = ""
}

function clearConfig() {
  localStorage.removeItem("pev2_ai_provider")
  localStorage.removeItem("pev2_ai_key")
  localStorage.removeItem("pev2_ai_endpoint")
  localStorage.removeItem("pev2_ai_model")
  
  provider.value = "gemini"
  apiKey.value = ""
  endpointUrl.value = ""
  selectedModel.value = "gemini-3.5-flash"
  customModel.value = ""
  savedConfigExists.value = false
  analysisResult.value = ""
}

async function runAnalysis() {
  const modelName = selectedModel.value === "custom" ? customModel.value.trim() : selectedModel.value
  if (!modelName) {
    errorMsg.value = "Model name is required."
    return
  }

  if (needsApiKey.value && !apiKey.value.trim()) {
    errorMsg.value = "API Key is required."
    return
  }

  isAnalyzing.value = true
  errorMsg.value = ""
  analysisResult.value = ""

  try {
    const prompt = `You are a database performance expert. Analyze the following PostgreSQL EXPLAIN plan and the query (if provided). Identify bottlenecks, expensive operations, and provide actionable optimization recommendations (e.g. index additions, query rewrites, configuration changes). Keep the explanation clear, professional, and concise.

### QUERY
${props.planQuery || "No query SQL provided."}

### EXPLAIN PLAN
${props.planSource}`

    let response: Response
    const activeEndpoint = endpointUrl.value.trim()

    if (provider.value === "gemini") {
      let url = activeEndpoint
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (!url) {
        url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent`
        if (apiKey.value.trim()) {
          url += `?key=${apiKey.value.trim()}`
        }
      } else {
        if (apiKey.value.trim()) {
          headers["x-goog-api-key"] = apiKey.value.trim()
          headers["Authorization"] = `Bearer ${apiKey.value.trim()}`
        }
      }
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })
    } else if (provider.value === "openai") {
      const url = activeEndpoint || "https://api.openai.com/v1/chat/completions"
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.value}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }]
        })
      })
    } else if (provider.value === "ollama") {
      // Ollama
      const baseUrl = activeEndpoint || "http://localhost:11434"
      const url = `${baseUrl}/api/generate`
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (apiKey.value.trim()) {
        headers["Authorization"] = `Bearer ${apiKey.value.trim()}`
      }
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false
        })
      })
    } else if (provider.value === "anthropic") {
      const url = activeEndpoint || "https://api.anthropic.com/v1/messages"
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey.value.trim(),
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true"
      }
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelName,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }]
        })
      })
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const msg = errData.error?.message || errData.error || `HTTP error! Status: ${response.status}`
      throw new Error(msg)
    }

    const data = await response.json()
    let text = ""

    if (provider.value === "gemini") {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    } else if (provider.value === "openai") {
      text = data.choices?.[0]?.message?.content || ""
    } else if (provider.value === "ollama") {
      text = data.response || ""
    } else if (provider.value === "anthropic") {
      text = data.content?.[0]?.text || ""
    }

    if (text) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        planHash: currentPlanHash.value,
        provider: provider.value,
        model: modelName,
        result: text
      }
      historyList.value.unshift(newEntry)
      if (historyList.value.length > 30) {
        historyList.value.pop()
      }
      localStorage.setItem("pev2_ai_history", JSON.stringify(historyList.value))
      activeHistoryId.value = newEntry.id
      analysisResult.value = text
    } else {
      throw new Error("No analysis response returned from the AI model.")
    }
  } catch (err: any) {
    errorMsg.value = err.message || "An unexpected error occurred during analysis."
  } finally {
    isAnalyzing.value = false
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(analysisResult.value).then(() => {
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  })
}
</script>

<template>
  <div class="ai-analysis-container d-flex flex-column h-100 w-100 p-3 overflow-auto">
    <!-- Configuration Screen -->
    <div v-if="!savedConfigExists" class="row justify-content-center my-auto">
      <div class="col-md-6 col-lg-5">
        <div class="card shadow-lg border-0 rounded-4 ai-setup-card overflow-hidden">
          <div class="card-header bg-gradient-primary text-white p-4 text-center border-0 position-relative">
            <div class="sparkles-container mb-2">
              <FontAwesomeIcon :icon="faRobot" class="fs-1 animate-pulse" />
            </div>
            <h4 class="mb-0 fw-bold">AI Assistant Setup</h4>
            <p class="mb-0 opacity-75 small mt-1">Multi-Engine Plan Optimization</p>
          </div>
          <div class="card-body p-4 bg-body">
            <p class="text-body-secondary small mb-4 text-center">
              Analyze Postgres execution plans directly in your browser using your preferred AI engine. Configuration is stored locally in your browser.
            </p>

            <!-- Provider Selector -->
            <div class="mb-3">
              <label for="providerSelect" class="form-label small fw-semibold text-body-secondary">AI Provider</label>
              <select id="providerSelect" class="form-select" v-model="provider">
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="ollama">Ollama (Local LLM)</option>
              </select>
            </div>

            <!-- API Key -->
            <div class="mb-3">
              <label for="apiKeyInput" class="form-label small fw-semibold text-body-secondary">
                API Key{{ provider === 'ollama' ? ' (Optional)' : '' }}
              </label>
              <div class="input-group">
                <span class="input-group-text bg-body-tertiary border-end-0">
                  <FontAwesomeIcon :icon="faKey" class="text-secondary" />
                </span>
                <input
                  :type="showKey ? 'text' : 'password'"
                  id="apiKeyInput"
                  class="form-control border-start-0 ps-0"
                  placeholder="Enter API key"
                  v-model="apiKey"
                  @keyup.enter="saveConfig"
                />
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="showKey = !showKey"
                >
                  <FontAwesomeIcon :icon="showKey ? faLock : faKey" />
                </button>
              </div>
              <div class="form-text small mt-2" v-if="provider === 'gemini'">
                Don't have a key? Get one for free from
                <a href="https://aistudio.google.com/" target="_blank" class="text-primary text-decoration-none">Google AI Studio</a>.
              </div>
              <div class="form-text small mt-2" v-if="provider === 'openai'">
                Get your key from the
                <a href="https://platform.openai.com/api-keys" target="_blank" class="text-primary text-decoration-none">OpenAI Platform</a>.
              </div>
              <div class="form-text small mt-2" v-if="provider === 'anthropic'">
                Get your key from the
                <a href="https://console.anthropic.com/" target="_blank" class="text-primary text-decoration-none">Anthropic Console</a>.
                Note: Browser requests to Anthropic's official API will trigger CORS blockages. You should specify a custom proxy / gateway endpoint URL below.
              </div>
              <div class="form-text small mt-2" v-if="provider === 'ollama'">
                Optional. Specify if your local Ollama proxy or gateway requires an authorization token.
              </div>
            </div>

            <!-- Custom Endpoint (Optional/Required depending on setup) -->
            <div class="mb-3">
              <label for="endpointInput" class="form-label small fw-semibold text-body-secondary">
                Custom Endpoint URL{{ provider === 'ollama' ? '' : ' (Optional)' }}
              </label>
              <div class="input-group">
                <span class="input-group-text bg-body-tertiary border-end-0">
                  <FontAwesomeIcon :icon="faGlobe" class="text-secondary" />
                </span>
                <input
                  type="text"
                  id="endpointInput"
                  class="form-control border-start-0 ps-0"
                  :placeholder="provider === 'ollama' ? 'http://localhost:11434' : provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : provider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' : 'https://generativelanguage.googleapis.com'"
                  v-model="endpointUrl"
                />
              </div>
              <div class="form-text small mt-2">
                <span v-if="provider === 'ollama'">Ensure Ollama is running and configured to accept cross-origin requests.</span>
                <span v-else>Leave blank to use the official API endpoint, or specify a custom proxy/gateway URL to bypass CORS limits.</span>
              </div>
            </div>

            <!-- Model Selector -->
            <div class="mb-3">
              <label for="modelSelect" class="form-label small fw-semibold text-body-secondary">Model</label>
              <select id="modelSelect" class="form-select" v-model="selectedModel">
                <option v-for="m in providerModels[provider]" :key="m.value" :value="m.value">
                  {{ m.name }}
                </option>
              </select>
            </div>

            <!-- Custom Model Input -->
            <div class="mb-4" v-if="selectedModel === 'custom'">
              <label for="customModelInput" class="form-label small fw-semibold text-body-secondary">Custom Model Name</label>
              <input
                type="text"
                id="customModelInput"
                class="form-control"
                placeholder="e.g. llama3:70b"
                v-model="customModel"
              />
            </div>

            <button
              class="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center"
              @click="saveConfig"
              :disabled="needsApiKey && !apiKey.trim()"
            >
              <FontAwesomeIcon :icon="faCheck" class="me-2" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Analyzer Dashboard Screen -->
    <div v-else class="d-flex flex-column h-100">
      <!-- Top Control Bar -->
      <div class="card shadow-sm border-0 rounded-3 mb-3 bg-body">
        <div class="card-body py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary-subtle p-2.5 rounded-3 text-primary d-none d-sm-block">
              <FontAwesomeIcon :icon="faRobot" class="fs-4" />
            </div>
            <div>
              <h6 class="mb-0 fw-bold">AI Plan Analyzer</h6>
              <span class="text-body-secondary small">
                Using {{ provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Ollama' }} ({{ selectedModel === 'custom' ? customModel : selectedModel }})
              </span>
            </div>
          </div>

          <div class="d-flex align-items-center flex-wrap gap-2">
            <button
              class="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1.5"
              @click="runAnalysis"
              :disabled="isAnalyzing"
            >
              <FontAwesomeIcon :icon="isAnalyzing ? faCircleNotch : faPlay" :spin="isAnalyzing" />
              {{ isAnalyzing ? 'Analyzing...' : 'Analyze Plan' }}
            </button>

            <button
              class="btn btn-outline-secondary btn-sm px-3"
              @click="clearConfig"
              :disabled="isAnalyzing"
              title="Change Configuration"
            >
              <FontAwesomeIcon :icon="faSlidersH" />
            </button>
          </div>
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="flex-grow-1 overflow-hidden d-flex gap-3 position-relative">
        <!-- Sidebar: History List -->
        <div class="border-end flex-shrink-0 bg-body-tertiary d-flex flex-column rounded-3 overflow-hidden shadow-sm" style="width: 250px;" v-if="filteredHistory.length > 0">
          <div class="px-3 py-2.5 border-bottom fw-bold small text-body-secondary bg-body">
            Previous Executions ({{ filteredHistory.length }})
          </div>
          <div class="flex-grow-1 overflow-auto p-2 list-group list-group-flush">
            <div 
              v-for="entry in filteredHistory" 
              :key="entry.id"
              class="list-group-item list-group-item-action border rounded-3 mb-2 p-2.5 position-relative history-item"
              :class="{ active: activeHistoryId === entry.id }"
              @click="selectHistoryEntry(entry.id)"
              style="cursor: pointer;"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div class="fw-semibold small text-truncate pe-4" style="max-width: 180px;">
                  {{ entry.model }}
                </div>
                <button 
                  class="btn btn-link btn-xs p-0 text-danger border-0 position-absolute end-0 top-0 mt-2.5 me-2 delete-btn"
                  @click.stop="deleteHistoryEntry(entry.id)"
                  title="Delete this execution"
                >
                  <FontAwesomeIcon :icon="faTrash" class="small" />
                </button>
              </div>
              <div class="text-body-secondary small mt-1 font-monospace" style="font-size: 0.85em;">
                {{ entry.timestamp }}
              </div>
            </div>
          </div>
        </div>

        <!-- Main Display Column -->
        <div class="flex-grow-1 overflow-hidden d-flex flex-column">
          <!-- Error Alert -->
          <div v-if="errorMsg" class="alert alert-danger d-flex align-items-center border-0 shadow-sm mb-3" role="alert">
            <FontAwesomeIcon :icon="faExclamationCircle" class="fs-4 me-3" />
            <div>
              <h6 class="alert-heading mb-1 fw-bold">Analysis Failed</h6>
              <p class="mb-0 small">{{ errorMsg }}</p>
            </div>
          </div>

          <!-- Result Box / Welcome state -->
          <div class="flex-grow-1 card border-0 shadow-sm overflow-hidden bg-body d-flex flex-column">
            <!-- Welcome instructions / No analysis yet -->
            <div v-if="!analysisResult && !isAnalyzing" class="my-auto text-center p-5">
              <div class="text-primary-subtle mb-4">
                <FontAwesomeIcon :icon="faRobot" class="display-1 opacity-25" />
              </div>
              <h5 class="fw-bold mb-2">Ready to Analyze</h5>
              <p class="text-body-secondary mx-auto" style="max-width: 480px;">
                Click the <strong class="text-primary">Analyze Plan</strong> button above to ask the AI engine to highlight key bottlenecks, suggest appropriate indices, and provide performance optimization recommendations.
              </p>
            </div>

            <!-- Loading state -->
            <div v-if="isAnalyzing" class="my-auto text-center p-5">
              <div class="spinner-pulse-container mb-4">
                <FontAwesomeIcon :icon="faCircleNotch" class="display-3 text-primary spinner-animation" spin />
              </div>
              <h5 class="fw-bold mb-2">Analyzing Execution Plan</h5>
              <p class="text-body-secondary mx-auto animate-pulse" style="max-width: 320px;">
                Requesting AI recommendation, analyzing index layouts and query semantics...
              </p>
            </div>

            <!-- Finished state -->
            <div v-if="analysisResult && !isAnalyzing" class="d-flex flex-column h-100">
              <div class="card-header bg-body border-bottom py-2.5 px-4 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2">
                  <div class="status-indicator bg-success"></div>
                  <span class="fw-semibold small text-body-secondary">Optimization Report</span>
                </div>
                <button
                  class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                  @click="copyToClipboard"
                >
                  <FontAwesomeIcon :icon="copySuccess ? faCheck : faCopy" :class="{'text-success': copySuccess}" />
                  {{ copySuccess ? 'Copied!' : 'Copy Report' }}
                </button>
              </div>
              <div class="card-body p-4 overflow-auto markdown-body" v-html="parseMarkdown(analysisResult)">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #00b5e2 0%, #008caf 100%);
}

.ai-setup-card {
  border: 1px solid rgba(0, 181, 226, 0.15);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.08) !important;
}

.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}

.spinner-animation {
  animation: spin 1.2s infinite linear;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.gap-1\.5 {
  gap: 0.375rem;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.8;
  }
}

.markdown-body {
  line-height: 1.6;
  font-size: 13.5px;
  color: var(--bs-body-color);
  
  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    color: var(--bs-body-color);
  }
  
  :deep(p) {
    margin-bottom: 1rem;
  }
  
  :deep(pre) {
    font-size: 12px;
  }
  
  :deep(ul) {
    margin-bottom: 1rem;
  }
  
  :deep(li) {
    margin-bottom: 0.25rem;
  }
}

.history-item {
  transition: all 0.2s ease;
  background-color: var(--bs-body-bg);
  border-color: var(--bs-border-color) !important;
  
  &:hover {
    background-color: var(--bs-tertiary-bg);
    
    .delete-btn {
      opacity: 1;
    }
  }
  
  &.active {
    background-color: var(--bs-primary-bg-subtle) !important;
    border-color: var(--bs-primary-border-subtle) !important;
    color: var(--bs-primary-text-emphasis) !important;
    
    .text-body-secondary {
      color: var(--bs-primary-text-emphasis) !important;
      opacity: 0.8;
    }
  }
}

.delete-btn {
  opacity: 0.3;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1 !important;
  }
}
</style>
