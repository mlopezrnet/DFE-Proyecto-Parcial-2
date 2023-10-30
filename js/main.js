/* La clase Note debe de seguir la siguiente estructura
{
  "title": "Entregar el proyecto del segundo parcial", // string: Titulo de la tarea
  "description": "Desarrollar la aplicación y conectarla a la API", // string/string[]: descripción de la tarea. párrafos separados en un arreglo
  "completed": false, // boolean: bandera que indica si la tarea fue realizada, inicializarla en false
  "priority": "high", // string: prioridad de la tarea, pueden definir las que deseen ejem: Alta, Media, Baja
  "tag": "DFE 2023-2", // string[]: etiquetas o clasificación que indiquen el tipo de tarea ejem: Personal, Laboral
  "dueDate": "2023-10-27" // Date: fecha de vencimiento, opcional
}
*/

import { fetchAPI } from './fetch-api.js'

class Note {
  constructor(id, title, description, completed, priority, tag, dueDate) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.priority = priority;
    this.tag = tag;
    this.dueDate = dueDate;
  }
}

// Datos globales
const user = '217210140';
const add_button = document.getElementById('add-note');
const spinner = document.getElementById('spinner');
let notes = [];
let current_note = null;
let previous_target = null;

function saveNoteContainer(note_container) {
  if (!note_container) {
    return;
  }

  const text_container = note_container.querySelector('.text-container');
  if (!text_container) {
    return;
  }

  /* remove contentEditable attribute */
  if (text_container.attributes.getNamedItem('contentEditable')) {
    text_container.attributes.removeNamedItem('contentEditable');
  }

  text_container.scrollTop = 0;
  note_container.classList.remove('editing');

  saveNote(note_container)
    .then((response) => {
      if (response) {
        spinner.classList.add('hidden');
        add_button.classList.remove('hidden');
        const note = mapAPIToNote(response);
        console.log("Notas:", notes);
        return displayNotes(note, note_container);
      }
      return Promise.reject();
    })
    .then(() => {
      note_container.remove();
    })
    .catch(() => { });
}

// Global click handler
document.body.addEventListener('click', (event) => {
  const targetNote = event.target.closest('.note');
  const isNewNote = event.target.closest('.new-note');

  console.log("Click en:", event.target);

  if (isNewNote) {
    /* if any .editing note exists, save it first */
    const editingNote = document.querySelector('.editing');
    if (editingNote) {
      saveNoteContainer(editingNote);
    }
    return;
  }
  if (targetNote) {
    console.log("Dentro de una nota")
    unfocusActiveNote();
    targetNote.classList.add('active');
    // Si la nota clickeada es la misma que la actual, no hacer nada
    if (previous_target?.closest('.note') === targetNote) {
      console.log("skip")
      return;
    }
    // Si la nota clickeada es distinta a la que se le hizo click, guardar la otra primero
    if (current_note) {
      saveNoteContainer(previous_target.closest('.note'));
      saveNewNotes();
    } else {
      saveNewNotes();
    }
    current_note = notes.find(note => note.id === targetNote.dataset.id);
    if (targetNote.dataset.id) {
      editNote(targetNote)
      console.log("Nota actual:", current_note);
    };
    previous_target = event.target;
  } else {
    // Clicked outside any note, save all the notes that have at least 
    // the title and description filled out, else ignore any blank notes
    console.log("Fuera de una nota")
    current_note = null;
    unfocusActiveNote();
    saveNewNotes();

    // Find the note that was being edited then, call saveNote sending the note_container
    saveNoteContainer(document.querySelector('.editing'));
  }
});

function saveNewNotes() {
  // For each note with class new-note, call saveNote sending the note_container
  const newNotes = document.querySelectorAll('.new-note');
  newNotes.forEach(note_container => {
    saveNote(note_container)
      .then((response) => {
        if (response) {
          spinner.classList.add('hidden');
          add_button.classList.remove('hidden');
          const note = mapAPIToNote(response);
          console.log("Notas:", notes);
          return displayNotes(note);
        }
        return Promise.reject(); // si la nota está vacía, no quitarla
      })
      .then(() => {
        note_container.remove();
      })
      .catch(() => { });
  });
}

function unfocusActiveNote() {
  const activeNotes = document.querySelectorAll('.active') ?? [];
  activeNotes.forEach(note => {
    note.classList.remove('active');
  });
}

function activateNote(note_container) {
  note_container.classList.add('active');
  note_container.click();
}

// Funciones
function mapAPIToNotes(data) {
  notes = data.map(note => {
    return new Note(
      note.id,
      note.title,
      note.description,
      note.completed,
      note.priority,
      note.tag,
      note.dueDate
    );
  });
}

function mapAPIToNote(data) {
  const newNote = new Note(
    data.id,
    data.title,
    data.description,
    data.completed,
    data.priority,
    data.tag,
    data.dueDate
  );
  /* if ID already exists, update it, otherwise push it to the array */
  const index = notes.findIndex(note => note.id === newNote.id);
  if (index !== -1) {
    notes[index] = newNote;
  } else {
    notes.push(newNote);
  }
  return newNote;
}

function getNotes() {
  return fetchAPI(`users/${user}/tasks`, 'GET')
    .then(response => {
      console.log('Notas recibidas:', response);
      mapAPIToNotes(response);
    })
    .catch(error => {
      console.error('Error al obtener las notas:', error);
    });
}

function saveNote(note_container) {
  const id = note_container.dataset.id;
  let title = note_container.querySelector('.title-placeholder')?.value ?? note_container.querySelector('h4')?.innerText;
  const descInput = note_container.querySelector('.description-placeholder')?.value ?? Array.from(note_container.querySelectorAll('.text-container p, .text-container div'));
  const description = Array.isArray(descInput) ? descInput.map(p => p.innerText.trim())?.filter(p => p !== '') : descInput;
  const completed = note_container.classList.contains('completed');
  const priority = note_container.querySelector('.priority-select')?.value ?? current_note.priority;
  const tagInput = note_container.querySelector('.tag-placeholder') ?? null;
  let tags = [];
  if (tagInput === null) {
    tags = current_note.tag;
  } else {
    tags = tagInput?.value.trim() === '' ? [] : tagInput?.value.split(',').map(tag => tag.trim());
  }
  const dueDate = current_note?.dueDate ? current_note.dueDate : (note_container.querySelector('.date-placeholder')?.value === '' ? null : new Date(note_container.querySelector('.date-placeholder')?.value).getTime() / 1000);

  const titleIsEmpty = title ? title.replace(/<br>/g, '').trim() === '' : true;
  if (titleIsEmpty) { title = "" }
  const descriptionIsEmpty = Array.isArray(description) ? description.every(p => p.trim() === '') : description?.trim() === '';
  // si la nota no tiene título ni descripción, no guardarla
  if (titleIsEmpty && descriptionIsEmpty) {
    if (id !== undefined) {
      trashNote(id)
        .then((response) => {
          spinner.classList.add('hidden');
          add_button.classList.remove('hidden');
      /* find the note container with the id and remove it */;
          const note_container = document.querySelector(`[data-id="${response.id}"]`);
          note_container.remove();
          current_note = null;
          return response;
        });
    }
    return Promise.reject();
  }

  const note = new Note(
    null,
    title,
    description,
    completed,
    priority,
    tags,
    dueDate
  );

  if (id === undefined) {
    spinner.classList.remove('hidden');
    add_button.classList.add('hidden');
    return createNewNote(note);
  } else {
    return updateNote(id, note);
  }
}

function createNewNote(note) {
  return fetchAPI(`users/${user}/tasks`, 'POST', note)
    .then(response => {
      console.log('Nota creada:', response);
      return response;
    })
    .catch(error => {
      console.error('Error al crear la nota:', error);
    });
}

function updateNote(id, note) {
  return fetchAPI(`users/${user}/tasks/${id}`, 'PUT', note)
    .then(response => {
      console.log('Nota actualizada:', response);
      return response;
    })
    .catch(error => {
      console.error('Error al actualizar la nota:', error);
    });
}

function trashNote(id) {
  return fetchAPI(`users/${user}/tasks/${id}`, 'DELETE')
    .then(response => {
      console.log('Nota eliminada:', response);
      return response;
    })
    .catch(error => {
      console.error('Error al eliminar la nota:', error);
    });
}

function clearNotesContainer() {
  const notes_container = document.getElementById('notes-container');
  notes_container.innerHTML = '';
}

function displayNotes(notes, old_pos = null) {
  const notes_container = document.getElementById('notes-container');

  notes = Array.isArray(notes) ? notes : [notes];
  notes.forEach(note => {
    const note_container = document.createElement('div');
    note_container.classList.add('note');
    /* create dataset id property */
    note_container.dataset.id = note.id;

    /* add priority-high or priority-low class to note_container */
    if (note.priority === 'high') {
      note_container.classList.add('priority-high');
    } else if (note.priority === 'low') {
      note_container.classList.add('priority-low');
    }

    if (note.completed) {
      note_container.classList.add('completed');
    }

    /* si la nota tiene fecha de vencimiento, crear su div */
    if (note.dueDate) {
      const note_dateContainer = document.createElement('div');
      note_dateContainer.classList.add('date-container');
      note_container.appendChild(note_dateContainer);

      //formato DD-MM-YYYY HH:MM 24h
      const parsedDate = formatDate(new Date(note.dueDate * 1000));
      const note_dueDate = document.createElement('div');
      note_dueDate.classList.add('due-date');
      note_dueDate.innerText = parsedDate;
      note_dateContainer.appendChild(note_dueDate);
    }

    const text_container = document.createElement('div');
    text_container.onclick = () => {
      text_container.contentEditable = true;
      text_container.focus();
    };
    text_container.classList.add('text-container');
    note_container.appendChild(text_container);

    const note_title = document.createElement('h4');
    note_title.innerText = note.title;
    text_container.appendChild(note_title);

    /* If note.description is not an array already, make a single element array */
    const descriptions = Array.isArray(note.description) ? note.description : [note.description];
    if (descriptions.length === 0) {
      const note_description = document.createElement('p');
      text_container.appendChild(note_description);
    }
    descriptions.forEach(paragraph => {
      const note_description = document.createElement('p');
      note_description.innerText = paragraph;
      text_container.appendChild(note_description);
    });

    /* if note.tag is falsey, make it an empty array */
    note.tag = note.tag || [];

    if (note.tag.length > 0) {
      const tags_container = document.createElement('div');
      tags_container.classList.add('tags-container');
      note_container.appendChild(tags_container);

      /* for every tag found in "tag" array, create a p element */
      note.tag.forEach(tag => {
        const note_tag = document.createElement('p');
        note_tag.innerText = tag;
        tags_container.appendChild(note_tag);
      });
    }

    /* click anywhere in the note itself to trigger edit mode */

    /*
    const note_trash = document.createElement('button');
    note_trash.innerText = 'Eliminar';
    note_trash.onclick = () => {
      trashNote();
    };
    note_container.appendChild(note_trash);
    */

    /* append always before any notes with .new-note class */
    if (old_pos !== null) {
      return notes_container.insertBefore(note_container, old_pos);
    }

    const newNotes = document.querySelectorAll('.new-note');
    if (newNotes.length > 0) {
      return notes_container.insertBefore(note_container, newNotes[0]);
    } else {
      return notes_container.appendChild(note_container);
    }
  });
}

function formatDate(date) {
  const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

  if (!(date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0)) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
  }

  return formattedDate;
}

function newBlankNote() {
  /* create a note in the DOM with placeholder fields so the user can write in it*/
  const notes_container = document.getElementById('notes-container');
  const note_container = document.createElement('div');
  note_container.classList.add('note');
  note_container.classList.add('new-note');

  const text_container = document.createElement('div');
  text_container.classList.add('text-container');
  note_container.appendChild(text_container);

  const note_dueDate = document.createElement('input');
  note_dueDate.setAttribute('type', 'datetime-local');
  note_dueDate.classList.add('date-placeholder');
  note_container.appendChild(note_dueDate);

  const note_title = document.createElement('input');
  note_title.setAttribute('type', 'text');
  note_title.setAttribute('placeholder', 'Título');
  note_title.classList.add('title-placeholder');
  text_container.appendChild(note_title);

  const note_description = document.createElement('textarea');
  note_description.setAttribute('rows', '2');
  note_description.setAttribute('onInput', 'auto_grow(this)');
  note_description.setAttribute('placeholder', 'Descripción');
  note_description.classList.add('description-placeholder');
  text_container.appendChild(note_description);

  const note_tag = document.createElement('input');
  note_tag.setAttribute('type', 'text');
  note_tag.setAttribute('placeholder', 'Tags');
  note_tag.classList.add('tag-placeholder');
  note_container.appendChild(note_tag);

  const note_priority = document.createElement('select');
  note_priority.setAttribute('type', 'text');
  note_priority.setAttribute('placeholder', 'Prioridad');
  note_priority.classList.add('priority-select');
  note_priority.innerHTML = `
    <option class="sel-priority-high" value="high">Alta</option>
    <option selected class="sel-priority-medium" value="medium">Media</option>
    <option class="sel-priority-low" value="low">Baja</option>
  `;
  note_container.appendChild(note_priority);

  note_priority.onchange = () => {
    note_container.classList.remove('priority-high');
    note_container.classList.remove('priority-low');

    if (note_priority.value === 'high') {
      note_container.classList.add('priority-high');
    } else if (note_priority.value === 'low') {
      note_container.classList.add('priority-low');
    }
  }
  /*
    const note_save = document.createElement('button');
    note_save.innerText = 'Guardar';
    note_save.onclick = () => {
      saveNote();
    };
  */

  const note_dismiss = document.createElement('span');
  note_dismiss.innerText = '✖';
  note_dismiss.classList.add('btn-close');
  note_dismiss.onclick = () => {
    notes_container.removeChild(note_container);
  };
  note_container.appendChild(note_dismiss);

  /* note container should listen to global click event. if the click is outside the bounds of the note, save the note*/

  notes_container.appendChild(note_container);
  activateNote(note_container);
  note_title.focus();

}

function editNote(note_container) {
  console.log("Editando nota:", note_container);
  note_container.classList.add('editing');
  //note_container.classList.remove('completed');



  /* set date container to hidden */
  const date_container = note_container.querySelector('.date-container');
  const note_dueDate = document.createElement('input');
  note_dueDate.setAttribute('type', 'datetime-local');
  note_dueDate.classList.add('date-placeholder');
  if (date_container) {
    /* set the dueDate, if there is one */
    if (current_note.dueDate) {
      const date = new Date(current_note.dueDate * 1000);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      note_dueDate.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    date_container.style.visibility = 'hidden';
  }
  note_container.appendChild(note_dueDate);

  /* set tags container to visibility hidden */
  const tags_container = note_container.querySelector('.tags-container');
  /* set the tags as a comma separated string */
  const tags = note_container.querySelectorAll('.tags-container p');
  const tags_string = Array.from(tags).map(tag => tag.innerText).join(', ');

  const note_tag = document.createElement('input');
  note_tag.setAttribute('type', 'text');
  note_tag.setAttribute('placeholder', 'Tags');
  note_tag.classList.add('tag-placeholder');
  note_tag.value = tags_string;
  if (tags_container) {
    tags_container.style.visibility = 'hidden';
  }
  note_container.appendChild(note_tag);


  const note_priority = document.createElement('select');
  note_priority.setAttribute('type', 'text');
  note_priority.setAttribute('placeholder', 'Prioridad');
  note_priority.classList.add('priority-select');
  /* set the current priority as selected */
  note_priority.innerHTML = `
  <option class="sel-priority-high" value="high" ${current_note.priority === 'high' ? 'selected' : ''}>Alta</option>
  <option class="sel-priority-medium" value="medium" ${current_note.priority === 'medium' ? 'selected' : ''}>Media</option>
  <option class="sel-priority-low" value="low" ${current_note.priority === 'low' ? 'selected' : ''}>Baja</option>
  `;
  note_container.appendChild(note_priority);

  note_priority.onchange = () => {
    note_container.classList.remove('priority-high');
    note_container.classList.remove('priority-low');

    if (note_priority.value === 'high') {
      note_container.classList.add('priority-high');
    } else if (note_priority.value === 'low') {
      note_container.classList.add('priority-low');
    }
  }

  const note_done = document.createElement('span');
  note_done.innerText = '✔';
  note_done.classList.add('btn-task-done');
  note_done.onclick = () => {
    note_container.classList.toggle('completed');
  };
  note_container.appendChild(note_done);

  const note_dismiss = document.createElement('span');
  note_dismiss.innerText = '✖';
  note_dismiss.classList.add('btn-close');
  note_dismiss.onclick = () => {
    spinner.classList.remove('hidden');
    add_button.classList.add('hidden');
    trashNote(current_note.id)
      .then((response) => {
        spinner.classList.add('hidden');
        add_button.classList.remove('hidden');
      /* find the note container with the id and remove it */;
        const note_container = document.querySelector(`[data-id="${response.id}"]`);
        note_container.remove();
        current_note = null;
      });
  };
  note_container.appendChild(note_dismiss);


}

// INICIALIZACIÓN

function initButtonsHandler() {
  //const edit_button = document.getElementById('edit-button');
  //const trash_button = document.getElementById('trash-button');

  /*edit_button.onclick = () => {
    editNote();
  };

  trash_button.onclick = () => {
    trashNote();
  };*/

  add_button.onclick = (event) => {
    event.stopPropagation();
    current_note = null;
    unfocusActiveNote();
    newBlankNote();
  };
}

function initNotes() {
  notes = []
  add_button.classList.add('hidden');
  spinner.classList.remove('hidden');
  getNotes().then(() => {
    clearNotesContainer();
    displayNotes(notes);
    initButtonsHandler();
    add_button.classList.remove('hidden');
    spinner.classList.add('hidden');
  });
}

document.addEventListener('DOMContentLoaded', initNotes);
