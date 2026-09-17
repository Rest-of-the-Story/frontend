<!-- PostFinalNote.vue -->
<template>
  <section v-if="note?.enabled" class="final-note mt-10 p-6 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-text)] text-left">
    <RichText :value="note.body" />
    <ul class="list-disc pl-5 mt-4 space-y-1">
      <li v-for="(cta, i) in note.ctas" :key="i">
        <a :href="cta.href" target="_blank" rel="noopener" class="text-[var(--color-text-links)] underline hover:no-underline">
          {{ cta.label }}
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup>
 import RichText from '@/components/RichText.vue'
 const props = defineProps({ note: { type: Object, default: null } })
</script>

