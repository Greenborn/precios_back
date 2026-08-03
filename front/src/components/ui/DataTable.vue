<template>
  <div class="datatable-local">
    <div v-if="$slots.header" class="datatable-header">
      <slot name="header"></slot>
    </div>

    <div class="table-wrap">
      <table class="table table-sm" :class="{ 'table-striped': striped, 'table-bordered': gridLines }">
        <thead>
          <tr>
            <th v-if="selectionMode" style="width:3em"></th>
            <th
              v-for="col in columns"
              :key="col.field"
              :style="col.headerStyle"
              class="dthead"
            >
              <span :class="{ 'sort-click': col.sortable !== false }" @click="sortToggle(col)">
                {{ col.header }}
              </span>
              <Icon
                v-if="sort.field === col.field"
                :name="sort.direction === 'asc' ? 'pi-chevron-up' : 'pi-chevron-down'"
                class="ms-1"
              />
            </th>
          </tr>
          <tr v-if="showFilterRow">
            <th v-if="selectionMode"></th>
            <th v-for="col in columns" :key="'f-' + col.key">
              <input
                v-if="filters[col.field]"
                class="form-control form-control-sm desc-filter"
                :value="filters[col.field].value"
                placeholder=""
                @input="onFilterInput(col.field, $event.target.value)"
              />
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in pagedRows"
            :key="rowKey(row)"
            @click="onRowClick(row)"
            @dblclick="onRowDblClick(row)"
            :class="{ 'row-selected': isSelected(row) }"
          >
            <td v-if="selectionMode" class="text-center">
              <input
                class="form-check-input"
                :type="selectionMode === 'multiple' ? 'checkbox' : 'radio'"
                :checked="isSelected(row)"
                @click.stop
              />
            </td>
            <td v-for="col in columns" :key="col.key">{{ row[col.field] }}</td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="colspanCount" class="text-center text-muted">Sin registros</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="paginator" class="datatable-pager">
      <div class="dtext">{{ pageReport }}</div>
      <div class="controls">
        <input
          v-if="rowsPerPageOptions.length"
          type="number"
          class="form-control form-control-sm rows-input"
          :value="rows"
          @change="changeRows($event)"
        />        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="page <= 1" @click="goTo(1)">&laquo;</button>
        <button
          v-for="p in pageList"
          :key="p"
          type="button"
          class="btn btn-sm"
          :class="p === page ? 'btn-primary' : 'btn-outline-secondary'"
          @click="goTo(p)"
        >{{ p }}</button>
        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="page >= pageCount" @click="goTo(pageCount)">&raquo;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  value: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  striped: { type: Boolean, default: false },
  gridLines: { type: Boolean, default: false },
  showFilterRow: { type: Boolean, default: false },
  filters: { type: Object, default: () => ({}) },
  globalFilterFields: { type: Array, default: () => [] },
  paginator: { type: Boolean, default: false },
  rows: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [] },
  pageReportTemplate: { type: String, default: 'Mostrando {first} a {last} de {totalRecords}' },
  selection: { type: Array, default: () => [] },
  selectionMode: { type: String, default: 'single' },
  emptyMessage: { type: String, default: 'Sin registros' }
})

const emit = defineEmits(['update:selection', 'row-select', 'row-unselect', 'row-dblclick', 'row-click'])

const sort = ref({ field: null, direction: null })
const page = ref(1)

const globalQuery = computed(() => (props.filters['global'] && props.filters['global'].value) || '')

const filtered = computed(() => {
  let rows = [...props.value]
  const gq = String(globalQuery.value).toLowerCase().trim()
  if (gq) {
    const gf = props.globalFilterFields.length ? props.globalFilterFields : props.columns.map(c => c.field)
    rows = rows.filter(r => gf.some(f => r[f] != null && String(r[f]).toLowerCase().includes(gq)))
  }
  for (const col of props.columns) {
    const f = props.filters[col.field]
    if (f && f.value != null && String(f.value) !== '') {
      const q = String(f.value).toLowerCase()
      rows = rows.filter(r => r[col.field] != null && String(r[col.field]).toLowerCase().includes(q))
    }
  }
  if (sort.value.field) {
    const dir = sort.value.direction === 'asc' ? 1 : -1
    const field = sort.value.field
    rows = rows.slice().sort((a, b) => {
      const av = a[field], bv = b[field]
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return -dir
      if (av > bv) return dir
      return 0
    })
  }
  return rows
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / props.rows)))
const offset = computed(() => (page.value - 1) * props.rows)
const first = computed(() => Math.min(offset.value + 1, filtered.value.length))
const last = computed(() => Math.min(offset.value + props.rows, filtered.value.length))
const pagedRows = computed(() => filtered.value.slice(offset.value, last.value))
const totalCount = computed(() => filtered.value.length)
const colspanCount = computed(() => props.columns.length + (props.selectionMode ? 1 : 0))

const pageList = computed(() => {
  const arr = []
  const total = pageCount.value
  const max = Math.min(total, 7)
  const start = Math.max(1, page.value - Math.floor(max / 2))
  for (let p = start; p < start + max && p <= total; p++) arr.push(p)
  return arr.length ? arr : [1]
})

const pageReport = computed(() => {
  if (filtered.value.length === 0) return 'Sin registros'
  return props.pageReportTemplate
    .replace('{first}', first.value)
    .replace('{last}', last.value)
    .replace('{totalRecords}', totalCount.value)
})

watch(() => filtered.value.length, () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})

function rowKey(row, i) {
  return row && row.id != null ? row.id : i
}
function sortToggle(col) {
  if (sort.value.field === col.field) {
    sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value.field = col.field
    sort.value.direction = 'asc'
  }
}
function isSelected(row) {
  return props.selection.some(s => s === row || (row.id != null && s != null && String(s.id) === String(row.id)))
}
function onRowClick(row) {
  if (!props.selectionMode) return
  const isSel = isSelected(row)
  if (props.selectionMode === 'multiple') {
    const next = isSel ? props.selection.filter(s => s !== row) : [...props.selection, row]
    emit('update:selection', next)
    emit(isSel ? 'row-unselect' : 'row-select', { data: row })
  } else {
    const next = isSel && props.selection.length === 1 ? [] : [row]
    emit('update:selection', next)
    emit('row-select', { data: row })
  }
}
function onRowDblClick(row) {
  emit('row-dblclick', { data: row })
}
function onFilterInput(field, val) {
  const f = props.filters[field]
  if (f) f.value = val
}
function goTo(p) { page.value = p }
function changeRows(e) {
  emit('update:rows', Number(e.target.value))
}
</script>

<style scoped>
.datatable-header { margin-bottom: .5rem; }
.table-wrap { overflow: auto; max-height: 80vh; }
.dthead { white-space: nowrap; }
.sort-click { cursor: pointer; user-select: none; }
.desc-filter { padding: 0.2rem 0.4rem; }
.row-selected { background: #eaf1ff !important; }
.datatable-pager {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-top: .5rem;
  flex-wrap: wrap;
}
.controls {
  display: flex;
  gap: .25rem;
  align-items: center;
}
.rows-input { width: 4rem; text-align: center; }
.dtext { color: #6c757d; font-size: .85rem; }
</style>