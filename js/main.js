/* La clase Note debe de seguir la siguiente estructura
{
  "title": "Entregar el proyecto del segundo parcial", // string: Titulo de la tarea
  "description": "Desarrollar la aplicación y conectarla a la API", // string: descripción de la tarea
  "completed": false, // boolean: bandera que indica si la tarea fue realizada, inicializarla en false
  "priority": "High", // string: prioridad de la tarea, pueden definir las que deseen ejem: Alta, Media, Baja
  "tag": "DFE 2023-2", // string: etiqueta o clasificación que indique el tipo de tarea ejem: Personal, Laboral
  "dueDate": "2023-10-27" // Date: fecha de vencimiento, opcional
}
*/

class Note {
    constructor(title, description, completed, priority, tag, dueDate) {
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.priority = priority;
        this.tag = tag;
        this.dueDate = dueDate;
    }
}
