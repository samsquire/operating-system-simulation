var taskLines = [];
var now = Date.now();
var tickInterval = 100;
var c = document.getElementById("screen");
var ctx = c.getContext("2d");
var history = {};
var samples = 20;

var currentSample = 0;
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
];
for (var x = 0 ; x < samples ; x++) {
  history[x] = {};
  for (var y = 0; y < tasks.length; y++) {
 
      history[x][y] = -1;
    
  }
}
var thisNow = Date.now()
function label(tasks) {
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      tasks[x].subtasks[s].ticks = thisNow;
      tasks[x].subtasks[s].fresh = false;
    }
  }
}
label(tasks);

function deduct(now, tasks) {

  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
         // tasks[x].subtasks[s].fresh = false;
    }
  }
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks > now) {
      
         if (tasks[x].subtasks[s].fresh < 2) {
          tasks[x].subtasks[s].fresh++;
         }
      
        tasks[x].subtasks[s].ticks -= tickInterval;

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

        tasks[x].subtasks[s].fresh = 0;
       
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
      
      
      if (tasks[x].subtasks[s].fresh == 1) {
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
  console.log("frame");
  ctx.beginPath();
  ctx.rect(0, 0, 800, 800);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "";

  ctx.beginPath();
  ctx.rect(10, 10, 600, 400);
  
  ctx.stroke();
  var currentY = 30;
  var currentWidth = 20;
  for (var x = 0; x < tasks.length; x++) {
    var renderedSquare = false;
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
        const text = ctx.measureText(tasks[x].subtasks[s].name);
        
        
      
      ctx.beginPath();
      ctx.font = "20px serif";
      ctx.fillStyle = "black";
      ctx.fillText(tasks[x].subtasks[s].name, currentWidth, currentY);
     
      if (!renderedSquare && tasks[x].subtasks[s].ticks > now) {
          renderedSquare = true;
          ctx.beginPath();
          ctx.fillStyle = "";
          ctx.rect(currentWidth - 15, currentY - 10, 10, 10);
          ctx.fillStyle = "green";
          ctx.fill();
          ctx.stroke();
  
      }
       currentWidth += text.width + 30;
    }
    currentY += 40;
    currentWidth = 20;
  }

  ctx.beginPath();
  ctx.moveTo(20, currentY);
  ctx.lineTo(20, currentY + 300);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, currentY);
  ctx.lineTo(20 + (samples * 20), currentY);
  ctx.stroke();

  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
         tasks[x].subtasks[s].renderedText = false;
    }
  }
  
  var graphX = 20;
  var graphY = currentY + 10;
  var sampleX = graphX + currentSample * 20;

  var colours = ["green", "orange", "red", "yellow"];

  ctx.beginPath();
  ctx.moveTo(sampleX, currentY);
  ctx.lineTo(sampleX, currentY + 300);
  ctx.stroke();

  var textRenders = [];
  
  for (var x = 0 ; x < samples ; x++) {
    if (x == 0) {
      previousSample = samples - 1;
    } else {
      previousSample = x - 1;
    }
    var previousHistory = history[previousSample];
    for (var task = 0 ; task < tasks.length ; task++) {
      var myHistory = history[x];
        if (myHistory[task] != -1) {
        
          ctx.beginPath();
          ctx.moveTo(graphX, graphY);
          ctx.rect(graphX, graphY, 20, 20);
          ctx.fillStyle = colours[myHistory[task]];
        console.log(tasks[task].subtasks[myHistory[task]]);
          ctx.fill();
          if (previousHistory[task] != myHistory[task]) {
            textRenders.push({
              text: tasks[task].subtasks[myHistory[task]].name,
              x: graphX,
              y: graphY + 10
            });
            
             
          }
        }
      
        graphY = graphY + 30;
      
      

      
    
    
    }
    graphX = graphX + 20;
    graphY = currentY + 10;
  }

  for ( var x = 0 ; x < textRenders.length ; x++) {
    var render = textRenders[x];
    ctx.beginPath();
    ctx.font = "20px serif";
    ctx.fillStyle = "white";
    ctx.fillText(render.text, render.x, render.y);
    ctx.fillStyle = "";
  }
  textRenders = [];
  
  
  deduct(now, tasks);
  randomize(now, tasks);
  var taskText = generateTaskHistory(taskLines, tasks);
  document.getElementById('content').innerHTML =
    marked.parse(`# Tasks
|Task|State|Left|
|---|---|---|\n` + generateTasks(now, tasks) + `

# History\n` + taskText, {headerIds: false, mangle: false});
now = Date.now();
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks > now) {
        history[currentSample][x] = s;
        break;
      }
    }
  }
currentSample = (currentSample + 1) % samples;
}

setInterval(tick, tickInterval);