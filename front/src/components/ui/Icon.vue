<template>
  <i :class="'bi ' + iconClass" aria-hidden="true"></i>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' }
})

const MAP = {
  'pi-bars': 'bi-list',
  'pi-times': 'bi-x-lg',
  'pi-check': 'bi-check',
  'pi-search': 'bi-search',
  'pi-plus': 'bi-plus-lg',
  'pi-pencil': 'bi-pencil',
  'pi-trash': 'bi-trash',
  'pi-eye': 'bi-eye',
  'pi-eye-slash': 'bi-eye-slash',
  'pi-link': 'bi-link-45deg',
  'pi-key': 'bi-key',
  'pi-power-off': 'bi-power',
  'pi-save': 'bi-save',
  'pi-chevron-down': 'bi-chevron-down',
  'pi-chevron-up': 'bi-chevron-up',
  'pi-chevron-left': 'bi-chevron-left',
  'pi-chevron-right': 'bi-chevron-right',
  'pi-home': 'bi-house',
  'pi-id-card': 'bi-person-vcard',
  'pi-lock': 'bi-lock',
  'pi-shield': 'bi-shield',
  'pi-sitemap': 'bi-diagram-3',
  'pi-user': 'bi-person',
  'pi-users': 'bi-people'
}

const iconClass = computed(() => {
  let n = props.name || ''
  if (n.startsWith('pi ')) n = n.replace('pi ', '')
  if (n.startsWith('pi-')) {
    return MAP[n] || 'bi-circle-fill'
  }
  return n
})
</script>