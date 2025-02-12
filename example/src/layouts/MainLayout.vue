<script lang="ts" setup>
import VLink from "../components/VLink.vue"
import Papa from 'papaparse'
import { ref, computed } from 'vue'


interface ImportedItem {
  name: string
  query: string
  explain: string
  selected?: boolean
}

interface Props {
  title?: string
}

const props = defineProps<Props>()
const showModal = ref(false)
const importedData = ref<ImportedItem[]>([])

// 添加预览相关的状态
const previewContent = ref('')
const previewPosition = ref({ x: 0, y: 0 })
const showPreview = ref(false)

const searchQuery = ref('')

const filteredData = computed(() => {
  if (!searchQuery.value) return importedData.value
  return importedData.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const handleFileImport = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  Papa.parse(file, {
    complete: (results) => {
      // 跳过标题行，并添加 selected 属性
      importedData.value = results.data.slice(1).map((row: any) => ({
        name: row[0]?.trim(),
        query: row[1]?.trim(),
        explain: row[2]?.trim(),
        selected: false
      }))
      showModal.value = true
    },
    header: false,
    skipEmptyLines: true
  })
}

const handleBatchSubmit = () => {
  const selectedItems = importedData.value.filter(item => item.selected).map(item => ({
    queryName: item.name,
    queryInput: item.query,
    planInput: item.explain
  }))
  
  // 修复事件参数传递
  window.dispatchEvent(new CustomEvent('plan-submit', {
    detail: structuredClone(selectedItems) // 使用深拷贝避免引用问题
  }))
  
  showModal.value = false
  importedData.value = []
}

const handleImportCancel = () => {
  showModal.value = false
  // 强制清空选择状态
  importedData.value.forEach(item => item.selected = false)
  importedData.value = []
}

const handleBatchClean = () => {
  window.dispatchEvent(new CustomEvent('plans-clean', {
      detail: null
    }))
}

const toggleAll = (checked: boolean) => {
  importedData.value.forEach(item => item.selected = checked)
}

// 添加预览处理函数
const handleMouseEnter = (content: string, event: MouseEvent) => {
  if (!content) return
  previewContent.value = content
  
  // 计算预览窗口位置，避免超出屏幕
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = event.clientX + 10 // 鼠标右侧10px
  const y = event.clientY + 10 // 鼠标下方10px
  
  previewPosition.value = { x, y }
  showPreview.value = true
}

const handleMouseLeave = () => {
  showPreview.value = false
}
</script>

<template>
  <div class="d-flex flex-column vh-100">
    <div class="navbar container">
      <div v-if="props?.title" class="text-center ms-auto">
        {{ props?.title }}
      </div>
      <input
        type="file"
        accept=".csv"
        class="d-none"
        id="csvFileInput"
        @change="handleFileImport"
      >
      <label for="csvFileInput" class="btn btn-primary me-2">
        Import CSV
      </label>
      <v-link class="btn btn-secondary" to="/">New Plan</v-link>
      <button type="button" class="btn btn-primary" @click="handleBatchClean">清空历史记录</button>
      <v-link class="btn btn-link" to="/about">About</v-link>
    </div>
    <slot></slot>

    <!-- 导入预览模态框 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal fade show" 
           style="display: block;" 
           tabindex="-1"
           aria-modal="true"
           role="dialog">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">导入预览</h5>
              <input type="text" v-model="searchQuery" placeholder="搜索名称" class="form-control ms-3" style="width: 200px;">
              <button type="button" class="btn-close" @click="showModal = false"></button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th style="width: 40px">
                        <input type="checkbox" 
                          @change="e => toggleAll((e.target as HTMLInputElement).checked)"
                        >
                      </th>
                      <th style="width: 20%">Name</th>
                      <th style="width: 40%">Query</th>
                      <th style="width: 40%">Explain</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in filteredData" :key="index">
                      <td>
                        <input type="checkbox" v-model="item.selected">
                      </td>
                      <td class="text-truncate hoverable-cell" 
                          @mouseenter="e => handleMouseEnter(item.name, e)"
                          @mouseleave="handleMouseLeave">
                        {{ item.name }}
                      </td>
                      <td class="text-truncate hoverable-cell" 
                          @mouseenter="e => handleMouseEnter(item.query, e)"
                          @mouseleave="handleMouseLeave">
                        {{ item.query }}
                      </td>
                      <td class="text-truncate hoverable-cell" 
                          @mouseenter="e => handleMouseEnter(item.explain, e)"
                          @mouseleave="handleMouseLeave">
                        {{ item.explain }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="handleImportCancel">取消</button>
              <button type="button" class="btn btn-primary" @click="handleBatchSubmit">批量提交</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showModal" class="modal-backdrop fade show"></div>
      
      <!-- 悬浮预览窗口 -->
      <div v-if="showPreview" 
           class="preview-window" 
           :style="{
             left: previewPosition.x + 'px',
             top: previewPosition.y + 'px'
           }">
        {{ previewContent }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.table-responsive {
  max-height: 60vh;
  overflow: auto;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.hoverable-cell {
  cursor: pointer;
}

.preview-window {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  max-width: 25vw;
  max-height: 25vh;
  overflow: auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  z-index: 9999;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.modal-backdrop) {
  z-index: 1040;
}

:deep(.modal) {
  z-index: 1045;
}

/* 自定义滚动条样式 */
.preview-window::-webkit-scrollbar,
.table-responsive::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-window::-webkit-scrollbar-track,
.table-responsive::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-window::-webkit-scrollbar-thumb,
.table-responsive::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.preview-window::-webkit-scrollbar-thumb:hover,
.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
