var taskLines = [];
var now = Date.now();
var tickInterval = 100;
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
var thisNow = Date.now()
function label(tasks) {
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      tasks[x].subtasks[s].ticks = thisNow;
    }
  }
}
label(tasks);

function deduct(now, tasks) {

  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
          tasks[x].subtasks[s].fresh = false;
    }
  }
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks > now) {
      
      
        tasks[x].subtasks[s].fresh = false;
      
        tasks[x].subtasks[s].ticks -= tickInterval;
        if (tasks[x].subtasks[s].ticks < now && s + 1 < tasks[x].subtasks.length) {
          tasks[x].subtasks[s + 1].fresh = true;
        }
        break;
      } else {
        
      }
    }
  }
}

function randomize(now, tasks) {
  var min = 100;
  var max = 9000;

  
  for (var x = 0; x < tasks.length; x++) {
      if (tasks[x].subtasks[tasks[x].subtasks.length - 1].ticks <= now) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {

        tasks[x].subtasks[s].fresh = true;
       
        tasks[x].subtasks[s].ticks = Date.now() + Math.floor(Math.random() * (max - min) + min);

      
      }
    }
  }
}

function generateTasks(now, tasks) {
  var table = "";
  
  for (var x = 0; x < tasks.length; x++) {
    table += `|${tasks[x].task}`;
    var found = false;
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      
      
      if (tasks[x].subtasks[s].ticks > now) {
        table += `|${tasks[x].subtasks[s].name}|${tasks[x].subtasks[s].ticks}|\n`
       found = true;
        break;
      } else {
        
      }
    }
    if (!found) {
      table += `|&nbsp;|&nbsp;|\n`
    }
  }
  
  return table;
}

function generateTaskHistory(taskLines, tasks) {
  if ( taskLines.length > 5) {
    while(taskLines.length > 5) {
      taskLines.pop();
    }
  }
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      
      
      if (tasks[x].subtasks[s].fresh) {
        taskLines.unshift(tasks[x].subtasks[s].name);
        break;
      } else {
        
      }
    }
  }
  var taskText = "";
  taskText += `**${taskLines[0]}** | `
  for (var x = 1 ; x < taskLines.length; x++) {
   taskText += `${taskLines[x]} | `
  }
  
  return taskText;
}

function tick() {
  deduct(now, tasks);
  randomize(now, tasks);
  var taskText = generateTaskHistory(taskLines, tasks);
  document.getElementById('content').innerHTML =
    marked.parse(`# Tasks
|Task|State|Left|
|---|---|---|\n` + generateTasks(now, tasks) + `

# History\n` + taskText, {headerIds: false, mangle: false});
now = Date.now();
}

setInterval(tick, tickInterval);