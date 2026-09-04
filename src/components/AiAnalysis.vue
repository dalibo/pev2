<script lang="ts" setup>
import {
  faArrowLeft,
  faCheck,
  faCircleNotch,
  faCopy,
  faExclamationCircle,
  faFileAlt,
  faFileCode,
  faGlobe,
  faKey,
  faLock,
  faPaperclip,
  faPlay,
  faRobot,
  faSlidersH,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { computed, onMounted, ref, watch } from "vue"

import {
  type AttachedFile,
  buildAnalysisPrompt,
  buildProviderRequest,
  formatFileSize,
  hashString,
  limitHistoryEntries,
  parseMarkdown,
  parseProviderResponse,
  type Provider,
  validateFileAttachment,
} from "@/services/ai-service"

interface Props {
  planSource: string
  planQuery?: string
}
const props = defineProps<Props>()

const provider = ref<Provider>("gemini")
const apiKey = ref<string>("")
const endpointUrl = ref<string>("")
const selectedModel = ref<string>("")
const customModel = ref<string>("")
const savedConfigExists = ref<boolean>(false)
const isEditingConfig = ref<boolean>(false)
const isAnalyzing = ref<boolean>(false)
const analysisResult = ref<string>("")
const errorMsg = ref<string>("")
const showKey = ref<boolean>(false)
const copySuccess = ref<boolean>(false)

const attachedFiles = ref<AttachedFile[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref<boolean>(false)
const showFilesPanel = ref<boolean>(false)

const totalAttachedSize = computed(() => {
  return attachedFiles.value.reduce((sum, file) => sum + file.size, 0)
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFiles(files: FileList | File[]) {
  for (const file of Array.from(files)) {
    const validation = validateFileAttachment(file, attachedFiles.value)
    if (validation.isDuplicate) {
      continue
    }
    if (!validation.valid) {
      errorMsg.value = validation.error || "File attachment validation failed."
      continue
    }

    try {
      const content = await file.text()
      attachedFiles.value.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        content,
      })
    } catch {
      errorMsg.value = `Could not read file "${file.name}". Please ensure it is a valid text file.`
    }
  }

  if (attachedFiles.value.length > 0) {
    showFilesPanel.value = true
  }
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFiles(target.files)
  }
  target.value = ""
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    handleFiles(event.dataTransfer.files)
  }
}

function removeFile(id: string) {
  attachedFiles.value = attachedFiles.value.filter((f) => f.id !== id)
  if (attachedFiles.value.length === 0) {
    showFilesPanel.value = false
  }
}

function clearAllFiles() {
  attachedFiles.value = []
  showFilesPanel.value = false
}

interface HistoryEntry {
  id: string
  timestamp: string
  planHash: string
  provider: string
  model: string
  result: string
  attachedFilesCount?: number
  attachedFileNames?: string[]
}

const historyList = ref<HistoryEntry[]>([])
const activeHistoryId = ref<string>("")

const currentPlanHash = computed(() => hashString(props.planSource))
const filteredHistory = computed(() => {
  return historyList.value.filter(
    (entry) => entry.planHash === currentPlanHash.value,
  )
})

watch(
  filteredHistory,
  (newHistory) => {
    if (
      newHistory.length > 0 &&
      !newHistory.some((h) => h.id === activeHistoryId.value)
    ) {
      activeHistoryId.value = newHistory[0].id
      analysisResult.value = newHistory[0].result
    }
  },
  { immediate: true },
)

function selectHistoryEntry(id: string) {
  activeHistoryId.value = id
  const found = historyList.value.find((h) => h.id === id)
  if (found) {
    analysisResult.value = found.result
  }
}

function deleteHistoryEntry(id: string) {
  historyList.value = historyList.value.filter((h) => h.id !== id)
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
    { name: "Gemini 3.7 Flash (Recommended)", value: "gemini-3.7-flash" },
    { name: "Gemini 3.1 Pro", value: "gemini-3.1-pro" },
    { name: "Gemini 3.5 Flash", value: "gemini-3.5-flash" },
    { name: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { name: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    { name: "Gemini 2.5 Flash-Lite", value: "gemini-2.5-flash-lite" },
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
      selectedModel.value = "gemini-3.7-flash"
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

function loadStoredConfig() {
  const storedProvider = localStorage.getItem(
    "pev2_ai_provider",
  ) as Provider | null
  const storedKey = localStorage.getItem("pev2_ai_key")
  const storedEndpoint = localStorage.getItem("pev2_ai_endpoint")
  const storedModel = localStorage.getItem("pev2_ai_model")

  if (storedProvider) {
    provider.value = storedProvider
    apiKey.value = storedKey || ""
    endpointUrl.value = storedEndpoint || ""

    // Check if the stored model is a default model or custom
    const defaults = providerModels[storedProvider]?.map((m) => m.value) || []
    if (storedModel && defaults.includes(storedModel)) {
      selectedModel.value = storedModel
      customModel.value = ""
    } else if (storedModel) {
      selectedModel.value = "custom"
      customModel.value = storedModel
    }

    savedConfigExists.value = true
  } else {
    // Default values
    provider.value = "gemini"
    apiKey.value = ""
    endpointUrl.value = ""
    selectedModel.value = "gemini-3.7-flash"
    customModel.value = ""
    savedConfigExists.value = false
  }
}

onMounted(() => {
  const storedHistory = localStorage.getItem("pev2_ai_history")

  if (storedHistory) {
    try {
      historyList.value = JSON.parse(storedHistory)
    } catch {
      historyList.value = []
    }
  }

  loadStoredConfig()
  localStorage.setItem("aiIsNotNew", "true")
})

function openConfig() {
  loadStoredConfig()
  isEditingConfig.value = true
  errorMsg.value = ""
}

function cancelEditConfig() {
  loadStoredConfig()
  isEditingConfig.value = false
  errorMsg.value = ""
}

function saveConfig() {
  localStorage.setItem("pev2_ai_provider", provider.value)
  localStorage.setItem("pev2_ai_key", apiKey.value.trim())
  localStorage.setItem("pev2_ai_endpoint", endpointUrl.value.trim())

  const modelToSave =
    selectedModel.value === "custom"
      ? customModel.value.trim()
      : selectedModel.value
  localStorage.setItem("pev2_ai_model", modelToSave)

  savedConfigExists.value = true
  isEditingConfig.value = false
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
  selectedModel.value = "gemini-3.7-flash"
  customModel.value = ""
  savedConfigExists.value = false
  isEditingConfig.value = false
  analysisResult.value = ""
}

async function runAnalysis() {
  const modelName =
    selectedModel.value === "custom"
      ? customModel.value.trim()
      : selectedModel.value
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
    const prompt = buildAnalysisPrompt(
      props.planQuery,
      props.planSource,
      attachedFiles.value,
    )

    const requestConfig = buildProviderRequest(
      provider.value,
      modelName,
      apiKey.value,
      endpointUrl.value,
      prompt,
    )

    const response = await fetch(requestConfig.url, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      body: requestConfig.body,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const msg =
        errData.error?.message ||
        errData.error ||
        `HTTP error! Status: ${response.status}`
      throw new Error(msg)
    }

    const data = await response.json()
    const text = parseProviderResponse(provider.value, data)

    if (text) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        planHash: currentPlanHash.value,
        provider: provider.value,
        model: modelName,
        result: text,
        attachedFilesCount: attachedFiles.value.length,
        attachedFileNames: attachedFiles.value.map((f) => f.name),
      }
      historyList.value = limitHistoryEntries(
        [newEntry, ...historyList.value],
        30,
      )
      localStorage.setItem("pev2_ai_history", JSON.stringify(historyList.value))
      activeHistoryId.value = newEntry.id
      analysisResult.value = text
    } else {
      throw new Error("No analysis response returned from the AI model.")
    }
  } catch (err) {
    errorMsg.value =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred during analysis."
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
  <div
    class="ai-analysis-container d-flex flex-column h-100 w-100 p-3 overflow-auto"
  >
    <!-- Configuration Screen -->
    <div
      v-if="!savedConfigExists || isEditingConfig"
      class="row justify-content-center my-auto"
    >
      <div class="col-md-6 col-lg-5">
        <div
          class="card shadow-lg border-0 rounded-4 ai-setup-card overflow-hidden"
        >
          <div
            class="card-header bg-gradient-primary text-white p-4 text-center border-0 position-relative"
          >
            <button
              v-if="savedConfigExists"
              type="button"
              class="btn btn-outline-light btn-sm position-absolute start-0 top-0 m-3 d-flex align-items-center gap-1.5"
              @click="cancelEditConfig"
              title="Return to AI Analyzer"
            >
              <FontAwesomeIcon :icon="faArrowLeft" />
              <span class="d-none d-sm-inline">Back</span>
            </button>

            <div class="sparkles-container mb-2">
              <FontAwesomeIcon :icon="faRobot" class="fs-1 animate-pulse" />
            </div>
            <h4 class="mb-0 fw-bold">
              {{
                savedConfigExists
                  ? "AI Settings & Configuration"
                  : "PEV2 - AI Assistant Setup"
              }}
            </h4>
            <p class="mb-0 opacity-75 small mt-1">
              Configure AI Engine & Model
            </p>
          </div>
          <div class="card-body p-4 bg-body">
            <p class="text-body-secondary small mb-4 text-center">
              Analyze Postgres execution plans directly in your browser using
              your preferred AI engine. Configuration is stored locally in your
              browser.
            </p>

            <!-- Provider Selector -->
            <div class="mb-3">
              <label
                for="providerSelect"
                class="form-label small fw-semibold text-body-secondary"
                >AI Provider</label
              >
              <select
                id="providerSelect"
                class="form-select"
                v-model="provider"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="ollama">Ollama (Local LLM)</option>
              </select>
            </div>

            <!-- API Key -->
            <div class="mb-3">
              <label
                for="apiKeyInput"
                class="form-label small fw-semibold text-body-secondary"
              >
                API Key{{ provider === "ollama" ? " (Optional)" : "" }}
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
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  class="text-primary text-decoration-none"
                  >Google AI Studio</a
                >.
              </div>
              <div class="form-text small mt-2" v-if="provider === 'openai'">
                Get your key from the
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  class="text-primary text-decoration-none"
                  >OpenAI Platform</a
                >.
              </div>
              <div class="form-text small mt-2" v-if="provider === 'anthropic'">
                Get your key from the
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  class="text-primary text-decoration-none"
                  >Anthropic Console</a
                >. Note: Browser requests to Anthropic's official API will
                trigger CORS blockages. You should specify a custom proxy /
                gateway endpoint URL below.
              </div>
              <div class="form-text small mt-2" v-if="provider === 'ollama'">
                Optional. Specify if your local Ollama proxy or gateway requires
                an authorization token.
              </div>
            </div>

            <!-- Custom Endpoint (Optional/Required depending on setup) -->
            <div class="mb-3">
              <label
                for="endpointInput"
                class="form-label small fw-semibold text-body-secondary"
              >
                Custom Endpoint URL{{
                  provider === "ollama" ? "" : " (Optional)"
                }}
              </label>
              <div class="input-group">
                <span class="input-group-text bg-body-tertiary border-end-0">
                  <FontAwesomeIcon :icon="faGlobe" class="text-secondary" />
                </span>
                <input
                  type="text"
                  id="endpointInput"
                  class="form-control border-start-0 ps-0"
                  :placeholder="
                    provider === 'ollama'
                      ? 'http://localhost:11434'
                      : provider === 'openai'
                        ? 'https://api.openai.com/v1/chat/completions'
                        : provider === 'anthropic'
                          ? 'https://api.anthropic.com/v1/messages'
                          : 'https://generativelanguage.googleapis.com'
                  "
                  v-model="endpointUrl"
                />
              </div>
              <div class="form-text small mt-2">
                <span v-if="provider === 'ollama'"
                  >Ensure Ollama is running and configured to accept
                  cross-origin requests.</span
                >
                <span v-else
                  >Leave blank to use the official API endpoint, or specify a
                  custom proxy/gateway URL to bypass CORS limits.</span
                >
              </div>
            </div>

            <!-- Model Selector -->
            <div class="mb-3">
              <label
                for="modelSelect"
                class="form-label small fw-semibold text-body-secondary"
                >Model</label
              >
              <select
                id="modelSelect"
                class="form-select"
                v-model="selectedModel"
              >
                <option
                  v-for="m in providerModels[provider]"
                  :key="m.value"
                  :value="m.value"
                >
                  {{ m.name }}
                </option>
              </select>
            </div>

            <!-- Custom Model Input -->
            <div class="mb-4" v-if="selectedModel === 'custom'">
              <label
                for="customModelInput"
                class="form-label small fw-semibold text-body-secondary"
                >Custom Model Name</label
              >
              <input
                type="text"
                id="customModelInput"
                class="form-control"
                placeholder="e.g. llama3:70b"
                v-model="customModel"
              />
            </div>

            <!-- Action buttons -->
            <div class="d-flex gap-2 mt-4">
              <button
                v-if="savedConfigExists"
                type="button"
                class="btn btn-outline-secondary w-50 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-1.5"
                @click="cancelEditConfig"
              >
                <FontAwesomeIcon :icon="faArrowLeft" />
                <span>Cancel</span>
              </button>
              <button
                class="btn btn-primary py-2.5 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-1.5"
                :class="{
                  'w-50': savedConfigExists,
                  'w-100': !savedConfigExists,
                }"
                @click="saveConfig"
                :disabled="needsApiKey && !apiKey.trim()"
              >
                <FontAwesomeIcon :icon="faCheck" />
                <span>{{
                  savedConfigExists ? "Update Settings" : "Save Configuration"
                }}</span>
              </button>
            </div>

            <!-- Clear / Reset Credentials option -->
            <div
              v-if="savedConfigExists"
              class="text-center mt-3 pt-3 border-top"
            >
              <button
                type="button"
                class="btn btn-link btn-sm text-danger text-decoration-none p-0"
                @click="clearConfig"
              >
                <FontAwesomeIcon :icon="faTrash" class="me-1" />
                Reset and clear saved credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analyzer Dashboard Screen -->
    <div v-else class="d-flex flex-column h-100">
      <!-- Top Control Bar -->
      <div class="card shadow-sm border-0 rounded-3 mb-3 bg-body">
        <div
          class="card-body py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3"
        >
          <div class="d-flex align-items-center gap-3">
            <div
              class="bg-primary-subtle p-2.5 rounded-3 text-primary d-none d-sm-block"
            >
              <FontAwesomeIcon :icon="faRobot" class="fs-4" />
            </div>
            <div>
              <h6 class="mb-0 fw-bold">AI Plan Analyzer</h6>
              <span class="text-body-secondary small">
                Using
                {{
                  provider === "gemini"
                    ? "Gemini"
                    : provider === "openai"
                      ? "OpenAI"
                      : provider === "anthropic"
                        ? "Anthropic"
                        : "Ollama"
                }}
                ({{ selectedModel === "custom" ? customModel : selectedModel }})
              </span>
            </div>
          </div>

          <div class="d-flex align-items-center flex-wrap gap-2">
            <!-- Context Files Toggle Button -->
            <button
              class="btn btn-sm px-3 d-flex align-items-center gap-1.5"
              :class="
                showFilesPanel || attachedFiles.length > 0
                  ? 'btn-secondary text-white'
                  : 'btn-outline-secondary'
              "
              @click="showFilesPanel = !showFilesPanel"
              :disabled="isAnalyzing"
              title="Attach context files (DDL schema, postgresql.conf, table stats, etc.)"
            >
              <FontAwesomeIcon :icon="faPaperclip" />
              <span>Context Files</span>
              <span
                v-if="attachedFiles.length > 0"
                class="badge bg-primary text-white rounded-pill ms-1"
                style="font-size: 0.75rem"
              >
                {{ attachedFiles.length }}
              </span>
            </button>

            <button
              class="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1.5"
              @click="runAnalysis"
              :disabled="isAnalyzing"
            >
              <FontAwesomeIcon
                :icon="isAnalyzing ? faCircleNotch : faPlay"
                :spin="isAnalyzing"
              />
              {{ isAnalyzing ? "Analyzing..." : "Analyze Plan" }}
            </button>

            <button
              class="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center gap-1.5"
              @click="openConfig"
              :disabled="isAnalyzing"
              title="Inspect or change configuration"
            >
              <FontAwesomeIcon :icon="faSlidersH" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Supplementary Files Panel / Dropzone -->
      <div
        v-if="showFilesPanel || attachedFiles.length > 0"
        class="card shadow-sm border-0 rounded-3 mb-3 bg-body"
      >
        <div class="card-body p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <FontAwesomeIcon :icon="faPaperclip" class="text-primary small" />
              <span class="fw-bold small">Supplementary Context Files</span>
              <span
                class="text-body-secondary small"
                v-if="attachedFiles.length > 0"
              >
                ({{ attachedFiles.length }} file{{
                  attachedFiles.length === 1 ? "" : "s"
                }}
                • {{ formatFileSize(totalAttachedSize) }})
              </span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button
                class="btn btn-outline-primary btn-sm py-1 px-2.5 d-flex align-items-center gap-1.5"
                @click="triggerFileInput"
                :disabled="isAnalyzing"
              >
                <FontAwesomeIcon :icon="faUpload" />
                <span class="small">Add Files</span>
              </button>
              <button
                v-if="attachedFiles.length > 0"
                class="btn btn-outline-danger btn-sm py-1 px-2 d-flex align-items-center gap-1"
                @click="clearAllFiles"
                :disabled="isAnalyzing"
                title="Remove all attached files"
              >
                <FontAwesomeIcon :icon="faTrash" />
                <span class="small">Clear All</span>
              </button>
            </div>
          </div>

          <!-- Hidden file input -->
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept=".sql,.txt,.json,.csv,.conf,.cnf,.md,.yaml,.yml,.log,text/*"
            style="display: none"
            @change="handleFileInputChange"
          />

          <!-- Drag and drop zone -->
          <div
            class="dropzone-container p-3 rounded-3 text-center border border-2 border-dashed transition"
            :class="{
              'border-primary bg-primary-subtle': isDragging,
              'border-secondary-subtle bg-body-tertiary': !isDragging,
            }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
            style="cursor: pointer"
          >
            <div
              class="d-flex align-items-center justify-content-center gap-2 text-body-secondary small"
            >
              <FontAwesomeIcon :icon="faUpload" class="text-primary" />
              <span>
                Drop schema (<strong>.sql</strong>), config
                (<strong>.conf</strong>), table stats
                (<strong>.json/.txt</strong>) here or
                <strong class="text-primary">browse</strong> (max 4 files,max
                2MB per file)
              </span>
            </div>
          </div>

          <!-- Attached files list / chips -->
          <div
            v-if="attachedFiles.length > 0"
            class="d-flex flex-wrap gap-2 mt-2 pt-1"
          >
            <div
              v-for="file in attachedFiles"
              :key="file.id"
              class="badge bg-body-secondary text-body border d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-pill"
              :title="`${file.name} (${formatFileSize(file.size)})`"
            >
              <FontAwesomeIcon
                :icon="file.name.endsWith('.sql') ? faFileCode : faFileAlt"
                class="text-primary"
              />
              <span class="text-truncate fw-normal" style="max-width: 200px">{{
                file.name
              }}</span>
              <span class="text-body-secondary small font-monospace"
                >({{ formatFileSize(file.size) }})</span
              >
              <button
                type="button"
                class="btn-close btn-close-xs ms-1"
                aria-label="Remove"
                @click.stop="removeFile(file.id)"
                :disabled="isAnalyzing"
                style="font-size: 0.55rem"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="flex-grow-1 overflow-hidden d-flex gap-3 position-relative">
        <!-- Sidebar: History List -->
        <div
          class="border-end flex-shrink-0 bg-body-tertiary d-flex flex-column rounded-3 overflow-hidden shadow-sm"
          style="width: 250px"
          v-if="filteredHistory.length > 0"
        >
          <div
            class="px-3 py-2.5 border-bottom fw-bold small text-body-secondary bg-body"
          >
            Previous Executions ({{ filteredHistory.length }})
          </div>
          <div
            class="flex-grow-1 overflow-auto p-2 list-group list-group-flush"
          >
            <div
              v-for="entry in filteredHistory"
              :key="entry.id"
              class="list-group-item list-group-item-action border rounded-3 mb-2 p-2.5 position-relative history-item"
              :class="{ active: activeHistoryId === entry.id }"
              @click="selectHistoryEntry(entry.id)"
              style="cursor: pointer"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div
                  class="fw-semibold small text-truncate pe-4"
                  style="max-width: 180px"
                >
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
              <div
                class="text-body-secondary small mt-1 font-monospace"
                style="font-size: 0.85em"
              >
                {{ entry.timestamp }}
              </div>
              <div
                v-if="entry.attachedFilesCount"
                class="text-primary small mt-1 d-flex align-items-center gap-1 font-monospace"
                style="font-size: 0.8em"
              >
                <FontAwesomeIcon :icon="faPaperclip" />
                <span
                  >{{ entry.attachedFilesCount }} context file{{
                    entry.attachedFilesCount === 1 ? "" : "s"
                  }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Main Display Column -->
        <div class="flex-grow-1 overflow-hidden d-flex flex-column">
          <!-- Error Alert -->
          <div
            v-if="errorMsg"
            class="alert alert-danger d-flex align-items-center border-0 shadow-sm mb-3"
            role="alert"
          >
            <FontAwesomeIcon :icon="faExclamationCircle" class="fs-4 me-3" />
            <div>
              <h6 class="alert-heading mb-1 fw-bold">Analysis Failed</h6>
              <p class="mb-0 small">{{ errorMsg }}</p>
            </div>
          </div>

          <!-- Result Box / Welcome state -->
          <div
            class="flex-grow-1 card border-0 shadow-sm overflow-hidden bg-body d-flex flex-column"
          >
            <!-- Welcome instructions / No analysis yet -->
            <div
              v-if="!analysisResult && !isAnalyzing"
              class="my-auto text-center p-5"
            >
              <div class="text-primary-subtle mb-4">
                <FontAwesomeIcon :icon="faRobot" class="display-1 opacity-25" />
              </div>
              <h5 class="fw-bold mb-2">Ready to Analyze</h5>
              <p class="text-body-secondary mx-auto" style="max-width: 480px">
                Click the
                <strong class="text-primary">Analyze Plan</strong> button above
                to ask the AI engine to highlight key bottlenecks, suggest
                appropriate indices, and provide performance optimization
                recommendations.
                <span
                  v-if="attachedFiles.length > 0"
                  class="d-block mt-2 text-primary fw-semibold"
                >
                  <FontAwesomeIcon :icon="faPaperclip" class="me-1" />
                  {{ attachedFiles.length }} context file{{
                    attachedFiles.length === 1 ? "" : "s"
                  }}
                  will be included in the analysis.
                </span>
              </p>
            </div>

            <!-- Loading state -->
            <div v-if="isAnalyzing" class="my-auto text-center p-5">
              <div class="spinner-pulse-container mb-4">
                <FontAwesomeIcon
                  :icon="faCircleNotch"
                  class="display-3 text-primary spinner-animation"
                  spin
                />
              </div>
              <h5 class="fw-bold mb-2">Analyzing Execution Plan</h5>
              <p
                class="text-body-secondary mx-auto animate-pulse"
                style="max-width: 320px"
              >
                Requesting AI recommendation, analyzing index layouts and query
                semantics...
              </p>
            </div>

            <!-- Finished state -->
            <div
              v-if="analysisResult && !isAnalyzing"
              class="d-flex flex-column h-100"
            >
              <div
                class="card-header bg-body border-bottom py-2.5 px-4 d-flex align-items-center justify-content-between"
              >
                <div class="d-flex align-items-center gap-2">
                  <div class="status-indicator bg-success"></div>
                  <span class="fw-semibold small text-body-secondary"
                    >Optimization Report</span
                  >
                </div>
                <button
                  class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                  @click="copyToClipboard"
                >
                  <FontAwesomeIcon
                    :icon="copySuccess ? faCheck : faCopy"
                    :class="{ 'text-success': copySuccess }"
                  />
                  {{ copySuccess ? "Copied!" : "Copy Report" }}
                </button>
              </div>
              <div
                class="card-body p-4 overflow-auto markdown-body"
                v-html="parseMarkdown(analysisResult)"
              ></div>
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

.dropzone-container {
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: var(--bs-primary) !important;
    background-color: var(--bs-primary-bg-subtle) !important;
  }
}

@keyframes pulse {
  0%,
  100% {
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

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
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
