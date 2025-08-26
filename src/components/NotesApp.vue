<template>
  <v-container fluid class="pa-4">
    <v-tabs v-model="tab" background-color="transparent" class="mb-6" grow>
      <v-tab value="active">Текущие</v-tab>
      <v-tab value="done">Сделанные</v-tab>
      <v-tab value="deleted">Удалённые</v-tab>
    </v-tabs>

    <div class="notes-board">
      <v-card
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :class="{ done: note.done, deleted: note.deleted, pinned: note.pinned && !note.deleted }"
          @click="openNote(note)"
      >
        <div class="note-header">
          <div class="note-title">{{ note.title }}</div>
          <div class="note-actions" @click.stop>
            <v-btn
                v-if="!note.deleted"
                icon
                small
                :color="note.pinned ? 'amber' : 'grey'"
                @click.stop="togglePin(note)"
                :title="note.pinned ? 'Открепить заметку' : 'Закрепить заметку'"
            >
              <v-icon>{{ note.pinned ? 'mdi-pin' : 'mdi-pin-outline' }}</v-icon>
            </v-btn>
            <v-btn
                v-if="!note.deleted && tab !== 'done'"
                icon
                small
                color="green"
                @click.stop="toggleDone(note)"
                :title="note.done ? 'Отметить как не сделано' : 'Отметить как сделано'"
            >
              <v-icon>{{ note.done ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline' }}</v-icon>
            </v-btn>

            <v-btn
                icon
                small
                :color="note.deleted ? 'primary' : 'red'"
                @click.stop="deleteOrRestore(note)"
                :title="note.deleted ? 'Восстановить' : 'Удалить'"
            >
              <v-icon>{{ note.deleted ? 'mdi-restore' : 'mdi-delete' }}</v-icon>
            </v-btn>
          </div>
        </div>
        <div class="note-content" :class="{ 'full-content': note.deleted || tab === 'deleted' }">
          {{ note.content }}
        </div>
      </v-card>
    </div>

    <!-- Модалка для просмотра и редактирования -->
    <v-dialog v-model="modal" max-width="600px">
      <v-card>
        <v-card-title>
          <v-text-field v-model="modalNote.title" label="Заголовок" />
        </v-card-title>
        <v-card-text>
          <v-textarea
              v-model="modalNote.content"
              label="Контент"
              rows="6"
              auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeModal">Отмена</v-btn>
          <v-btn color="primary" @click="saveNote">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Кнопка добавления -->
    <v-btn
        fab
        fixed
        bottom
        right
        color="primary"
        @click="createNewNote"
        title="Добавить задачу"
        class="add-btn"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { db } from '../firebase.js'
import {
  collection, addDoc, doc, updateDoc, onSnapshot
} from 'firebase/firestore' // serverTimestamp можно не тянуть, достаточно булева флага

const tab = ref('active')
const notes = ref([])
const modal = ref(false)
const modalNote = ref({ id: null, title: '', content: '', done: false, deleted: false, pinned: false })

const notesCollection = collection(db, 'notes')

onSnapshot(notesCollection, (snapshot) => {
  notes.value = snapshot.docs.map(d => {
    const data = d.data()
    // дефолты для старых документов
    return {
      id: d.id,
      title: data.title || '',
      content: data.content || '',
      done: !!data.done,
      deleted: !!data.deleted,
      pinned: !!data.pinned
    }
  })
})

// Сколько закреплено (не удалённых)
const pinnedCount = computed(() => notes.value.filter(n => n.pinned && !n.deleted).length)

// Отсортированные по закрепу (сначала pinned)
const baseSorted = computed(() => {
  const arr = [...notes.value]
  // pinned — вверх, далее просто по title (можно заменить на createdAt, если есть)
  arr.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return (a.title || '').localeCompare(b.title || '')
  })
  return arr
})

// Фильтр по вкладкам поверх сортировки
const filteredNotes = computed(() => {
  let list = []
  if (tab.value === 'active') list = baseSorted.value.filter(n => !n.done && !n.deleted)
  else if (tab.value === 'done') list = baseSorted.value.filter(n => n.done && !n.deleted)
  else if (tab.value === 'deleted') list = baseSorted.value.filter(n => n.deleted)
  return list
})

// ПИН/АНПИН с ограничением 3
async function togglePin(note) {
  if (note.deleted) return
  const noteRef = doc(db, 'notes', note.id)

  if (!note.pinned && pinnedCount.value >= 3) {
    // здесь можно заменить на v-snackbar; для простоты alert
    alert('Можно закрепить не более 3 заметок.')
    return
  }

  await updateDoc(noteRef, { pinned: !note.pinned })
}

// Остальной код без изменений...
async function toggleDone(note) {
  const noteRef = doc(db, 'notes', note.id)
  await updateDoc(noteRef, { done: !note.done })
}

async function deleteOrRestore(note) {
  const noteRef = doc(db, 'notes', note.id)
  if (!note.deleted) {
    await updateDoc(noteRef, { deleted: true, done: false, pinned: false }) // при удалении снимаем пин
  } else {
    await updateDoc(noteRef, { deleted: false })
  }
}

function openNote(note) {
  if (note.deleted) return
  modalNote.value = { ...note }
  modal.value = true
}

function closeModal() { modal.value = false }

async function saveNote() {
  if (modalNote.value.id) {
    const noteRef = doc(db, 'notes', modalNote.value.id)
    await updateDoc(noteRef, {
      title: modalNote.value.title,
      content: modalNote.value.content,
    })
  } else {
    const newNote = {
      title: modalNote.value.title,
      content: modalNote.value.content,
      done: false,
      deleted: false,
      pinned: false
    }
    await addDoc(notesCollection, newNote)
  }
  modal.value = false
  modalNote.value = { id: null, title: '', content: '', done: false, deleted: false, pinned: false }
}

function createNewNote() {
  modalNote.value = { id: null, title: '', content: '', done: false, deleted: false, pinned: false }
  modal.value = true
}

</script>

<style scoped>
.notes-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  padding-bottom: 80px; /* Добавляем отступ для кнопки добавления */
}

.note-card {
  display: flex;
  flex-direction: column;
  background: white;
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.3s ease;
  min-height: 160px;
  height: 100%;
  box-sizing: border-box;
}

.note-card:hover {
  box-shadow: 0 12px 25px rgba(0,0,0,0.15);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.note-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.note-actions {
  display: flex;
  gap: 4px;
}

.note-content {
  flex-grow: 1;
  font-size: 0.95rem;
  color: #555;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.note-content.full-content {
  -webkit-line-clamp: unset;
  overflow: visible;
  white-space: pre-wrap;
  display: block;
}

.note-card.done .note-title {
  text-decoration: line-through;
  color: #888;
}

.note-card.done {
  background-color: #f0f9ff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.note-card.deleted {
  opacity: 0.7;
  background-color: #ffe6e6;
}

.note-card.deleted .note-header {
  cursor: default;
}

.note-card.deleted .note-content {
  cursor: default;
}

.add-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}
.note-card.pinned {
  border: 2px dashed #ffb300; /* amber vibe */
  box-shadow: 0 10px 22px rgba(255, 179, 0, 0.18);
  position: relative;
}
.note-card.pinned .note-title::before {
  content: "📌";
  margin-right: 6px;
}

</style>