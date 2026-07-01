<template>
  <div class="rich-text-editor border rounded-lg overflow-hidden bg-white">
    <!-- Toolbar -->
    <div class="editor-toolbar d-flex align-center flex-wrap gap-1 pa-2 border-b bg-grey-lighten-4">
      <v-btn size="small" variant="text" icon="mdi-format-bold" :color="editor?.isActive('bold') ? 'primary' : 'default'" @click="editor?.chain().focus().toggleBold().run()"></v-btn>
      <v-btn size="small" variant="text" icon="mdi-format-italic" :color="editor?.isActive('italic') ? 'primary' : 'default'" @click="editor?.chain().focus().toggleItalic().run()"></v-btn>
      <v-btn size="small" variant="text" icon="mdi-format-underline" :color="editor?.isActive('underline') ? 'primary' : 'default'" @click="editor?.chain().focus().toggleUnderline().run()"></v-btn>
      <v-divider vertical class="mx-1"></v-divider>
      <v-btn size="small" variant="text" icon="mdi-format-list-bulleted" :color="editor?.isActive('bulletList') ? 'primary' : 'default'" @click="editor?.chain().focus().toggleBulletList().run()"></v-btn>
      <v-btn size="small" variant="text" icon="mdi-format-list-numbered" :color="editor?.isActive('orderedList') ? 'primary' : 'default'" @click="editor?.chain().focus().toggleOrderedList().run()"></v-btn>
      <v-divider vertical class="mx-1"></v-divider>
      <v-btn size="small" variant="text" icon="mdi-format-header-1" :color="editor?.isActive('heading', { level: 1 }) ? 'primary' : 'default'" @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"></v-btn>
      <v-btn size="small" variant="text" icon="mdi-format-header-2" :color="editor?.isActive('heading', { level: 2 }) ? 'primary' : 'default'" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"></v-btn>
      <v-divider vertical class="mx-1"></v-divider>
      <v-btn size="small" variant="text" icon="mdi-link" :color="editor?.isActive('link') ? 'primary' : 'default'" @click="setLink"></v-btn>
      <v-btn size="small" variant="text" icon="mdi-link-off" :disabled="!editor?.isActive('link')" @click="editor?.chain().focus().unsetLink().run()"></v-btn>
    </div>

    <!-- Editor Content -->
    <editor-content :editor="editor" class="editor-content pa-4 min-h-[200px]" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  }
});

watch(() => props.modelValue, (value) => {
  const isSame = editor.value?.getHTML() === value;
  if (isSame) {
    return;
  }
  editor.value?.commands.setContent(value, false);
});

function setLink() {
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);
  if (url === null) return;
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});
</script>

<style scoped>
.editor-content {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
}
.editor-content :deep(.ProseMirror) {
  outline: none;
}
.editor-content :deep(p) {
  margin-bottom: 0.5em;
}
.editor-content :deep(a) {
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}
</style>
