<script setup>
import { useNotesBoard } from '@/composables/useNotesBoard'

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

  selectionMode,
  toggleSelectionMode,
  toggleSelect,
  isSelected,

  exportToExcel,
} = useNotesBoard()
</script>

<template>
  <v-container fluid class="pa-4">
    <v-tabs v-model="tab" background-color="transparent" class="mb-6" grow>
      <v-tab value="active">Текущие</v-tab>
      <v-tab value="done">Сделанные</v-tab>
      <v-tab value="deleted">Удалённые</v-tab>
    </v-tabs>

    <!-- Панель режима выбора -->
    <div v-if="selectionMode" class="mb-3" style="display:flex; gap:8px; align-items:center;">
      <v-chip color="primary" variant="flat" label>Режим выбора включён</v-chip>
      <v-btn size="small" variant="text" @click="toggleSelectionMode(false)">Выйти</v-btn>
    </div>

    <div class="notes-board">
      <v-card
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :class="{ done: note.done, deleted: note.deleted, pinned: note.pinned && !note.deleted }"
          @click="openNote(note)"
      >
        <!-- чекбокс выбора (только в selectionMode и не для удалённых) -->
        <div v-if="selectionMode && !note.deleted" style="position:absolute; top:8px; left:8px; z-index:2">
          <v-checkbox
              density="compact"
              hide-details
              :model-value="isSelected(note.id)"
              @update:model-value="toggleSelect(note.id)"
          />
        </div>

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

    <!-- FAB: добавить -->
    <v-btn
        fab
        fixed
        bottom
        right
        color="primary"
        @click="createNewNote"
        title="Добавить задачу"
        class="add-btn"
        style="right: 24px;"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <!-- FAB: экспорт Excel с меню -->
    <v-menu location="top start">
      <template #activator="{ props }">
        <v-btn
            v-bind="props"
            fab
            fixed
            bottom
            color="success"
            class="add-btn"
            title="Экспорт в Excel"
            style="right: 92px;"
        @click.stop
        >
        <v-icon>mdi-file-excel</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item @click="exportToExcel('current')">
          <v-list-item-title>Экспорт — текущая вкладка</v-list-item-title>
        </v-list-item>
        <v-list-item @click="exportToExcel('all')">
          <v-list-item-title>Экспорт — все заметки</v-list-item-title>
        </v-list-item>
        <v-list-item @click="exportToExcel('selected')">
          <v-list-item-title>
            Экспорт — выбранные
          </v-list-item-title>
          <v-list-item-subtitle>
            (включит выбор, если ничего не отмечено)
          </v-list-item-subtitle>
        </v-list-item>
        <v-divider />
        <v-list-item @click="toggleSelectionMode()">
          <v-list-item-title>
            {{ selectionMode ? 'Выключить режим выбора' : 'Включить режим выбора' }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-container>
</template>

<style src="@/styles/NotesBoard.css" scoped></style>
