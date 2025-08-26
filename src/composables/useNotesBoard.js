// composables/useNotesBoard.js
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import { collection, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore'

export function useNotesBoard() {
    const tab = ref('active')
    const notes = ref([])
    const modal = ref(false)
    const modalNote = ref({
        id: null, title: '', content: '', done: false, deleted: false, pinned: false
    })

    const notesCollection = collection(db, 'notes')

    // live-обновления
    onSnapshot(notesCollection, (snapshot) => {
        notes.value = snapshot.docs.map(d => {
            const data = d.data()
            return {
                id: d.id,
                title: data.title || '',
                content: data.content || '',
                done: !!data.done,
                deleted: !!data.deleted,
                pinned: !!data.pinned,
            }
        })
    })

    const pinnedCount = computed(
        () => notes.value.filter(n => n.pinned && !n.deleted).length
    )

    const baseSorted = computed(() => {
        const arr = [...notes.value]
        arr.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
            return (a.title || '').localeCompare(b.title || '')
        })
        return arr
    })

    const filteredNotes = computed(() => {
        if (tab.value === 'active') return baseSorted.value.filter(n => !n.done && !n.deleted)
        if (tab.value === 'done')   return baseSorted.value.filter(n =>  n.done && !n.deleted)
        if (tab.value === 'deleted')return baseSorted.value.filter(n =>  n.deleted)
        return baseSorted.value
    })

    async function togglePin(note) {
        if (note.deleted) return
        const noteRef = doc(db, 'notes', note.id)
        if (!note.pinned && pinnedCount.value >= 3) {
            alert('Можно закрепить не более 3 заметок.')
            return
        }
        await updateDoc(noteRef, { pinned: !note.pinned })
    }

    async function toggleDone(note) {
        const noteRef = doc(db, 'notes', note.id)
        await updateDoc(noteRef, { done: !note.done })
    }

    async function deleteOrRestore(note) {
        const noteRef = doc(db, 'notes', note.id)
        if (!note.deleted) {
            await updateDoc(noteRef, { deleted: true, done: false, pinned: false })
        } else {
            await updateDoc(noteRef, { deleted: false })
        }
    }

    function openNote(note) {
        if (note.deleted) return
        modalNote.value = { ...note }
        modal.value = true
    }

    function closeModal() {
        modal.value = false
    }

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
                pinned: false,
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

    return {
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
    }
}
