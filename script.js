var tasks = [
  {
    "task": "User",
    subtasks: [
      { "name": "create-user" },
      { "name": "send-email" }
    ]
  },
  {
    "task": "System",
    subtasks: [
      { "name": "start-backup" },
      { "name": "finish-backup" }
    ]
  },
  {
    "task": "Backend",
    subtasks: [
      { "name": "do-something" },
      { "name": "something-else" }
    ]
  }
]

function label(tasks) {
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      tasks[x].subtasks[s].ticks = 0;
    }
  }
}
label(tasks);

function deduct(tasks) {
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks >= 0) {
      tasks[x].subtasks[s].ticks--;
        break;
      }
    }
  }
}

function randomize(tasks) {
  var min = 1;
  var max = 16;
  for (var x = 0; x < tasks.length; x++) {
    if (tasks[x].subtasks[tasks[x].subtasks.length - 1].ticks < 0) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
 
        tasks[x].subtasks[s].ticks = Math.floor(Math.random() * (max - min) + min);
      
    }
      }
  }
}

function generateTasks(tasks) {
  var table = "";
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks > 0) {
      table += `|${tasks[x].task}`;
      
        table += `|${tasks[x].subtasks[s].name}|${tasks[x].subtasks[s].ticks}|\n`
        break;
      }
    }
  }
  
  return table;
}

function tick() {
  deduct(tasks);
  randomize(tasks);

  document.getElementById('content').innerHTML =
    marked.parse(`# Tasks
|Task|State|Left|
|---|---|---|\n` + generateTasks(tasks));
}

setInterval(tick, 150);