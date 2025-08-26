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

    <!-- Модалка -->
    <v-dialog v-model="modal" max-width="600px">
      <v-card>
        <v-card-title>
          <v-text-field v-model="modalNote.title" label="Заголовок" />
        </v-card-title>
        <v-card-text>
          <v-textarea v-model="modalNote.content" label="Контент" rows="6" auto-grow />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeModal">Отмена</v-btn>
          <v-btn color="primary" @click="saveNote">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- FAB -->
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
import { useNotesBoard } from '@/composables/useNotesBoard'

// получаем все реактивные сущности из композиционного модуля
const {
  tab,
  filteredNotes,
  modal,
  modalNote,
  togglePin,
  toggleDone,
  deleteOrRestore,
  openNote,
  closeModal,
  saveNote,
  createNewNote,
} = useNotesBoard()
</script>

<!-- Вариант 1: импортом из JS -->
<!-- <script setup src="@/composables/useNotesBoard.js"></script> -->

<!-- Подключаем внешний css. scoped можно оставить, если стили только для этого компонента -->
<style src="@/styles/NotesBoard.css" scoped></style>
