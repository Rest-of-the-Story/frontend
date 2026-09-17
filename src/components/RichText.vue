<!-- The one renderer for CMS rich text (Sanity Portable Text). Every rich-text
     field on the site goes through here so paragraphs, lists, headings and links
     share one set of styles (src/styles/rich-text.pcss) instead of each section
     re-styling PortableText output on its own. -->
<script setup>
import { computed, h } from 'vue'
import { PortableText } from '@portabletext/vue'
import { urlFor } from '@/sanity'

const props = defineProps({
  value: { type: Array, default: () => [] },
  // Light text for dark/brand backgrounds (hero, image overlay, form, dark cards)
  invert: { type: Boolean, default: false },
  // Centered copy (hero). Lists stay left-aligned regardless.
  center: { type: Boolean, default: false },
  // No block spacing — for short snippets like a mailing address
  compact: { type: Boolean, default: false },
})

// A line typed as "• item" / "- item" inside a normal paragraph. Editors do this
// instead of using the list button, and the result renders as unindented body copy.
const MANUAL_BULLET = /^\s*[•·▪*\-–—]\s+/

const hasText = block =>
  block?._type !== 'block' ||
  block.listItem ||
  (block.children || []).some(child => child._type !== 'span' || child.text?.trim())

// Split a block into one block per line, keeping each span's marks intact.
function splitLines(block) {
  const lines = [[]]
  for (const child of block.children || []) {
    if (child._type !== 'span' || !child.text?.includes('\n')) {
      lines[lines.length - 1].push(child)
      continue
    }
    child.text.split('\n').forEach((text, i) => {
      if (i > 0) lines.push([])
      if (text) lines[lines.length - 1].push({ ...child, text })
    })
  }
  return lines
}

// Turn hand-typed bullet lines into a real list so they indent and hang like
// lists made with the Studio's list button. Blocks without them are untouched.
function normalize(block) {
  if (block?._type !== 'block' || block.listItem) return [block]
  const text = (block.children || []).map(c => c.text || '').join('')
  if (!text.includes('\n') || !text.split('\n').some(line => MANUAL_BULLET.test(line))) return [block]

  return splitLines(block)
    .filter(children => children.some(c => c.text?.trim()))
    .map((children, i) => {
      const isBullet = MANUAL_BULLET.test(children[0]?.text || '')
      return {
        ...block,
        _key: `${block._key || 'block'}-${i}`,
        ...(isBullet ? { listItem: 'bullet', level: 1 } : {}),
        children: isBullet
          ? children.map((c, ci) =>
              ci === 0 ? { ...c, text: c.text.replace(MANUAL_BULLET, '') } : c
            )
          : children,
      }
    })
}

// Editors also leave empty paragraphs as spacers; they double up the spacing the
// stylesheet already provides, so drop them.
const blocks = computed(() => (props.value || []).filter(hasText).flatMap(normalize))

const isExternal = href => /^https?:\/\//i.test(href) && !href.includes('therestofthestory.store')

const components = {
  block: {
    // Each page already renders its own single <h1>; an h1 inside body copy
    // would break the heading outline, so it becomes an h2.
    h1: (_, { slots }) => h('h2', slots.default?.()),
  },
  marks: {
    link: ({ value }, { slots }) => {
      const href = value?.href || ''
      return h(
        'a',
        isExternal(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href },
        slots.default?.()
      )
    },
  },
  types: {
    image: ({ value }) =>
      value?.asset
        ? h('img', {
            src: urlFor(value, { width: 900 }),
            alt: value.alt || '',
            loading: 'lazy',
            decoding: 'async',
          })
        : null,
  },
}
</script>

<template>
  <div
    v-if="blocks.length"
    class="rich-text"
    :class="{
      'rich-text--invert': invert,
      'rich-text--center': center,
      'rich-text--compact': compact,
    }"
  >
    <PortableText :value="blocks" :components="components" />
  </div>
</template>
