var taskLines = [];
var now = Date.now();
var tickInterval = 100;
var c = document.getElementById("screen");
var ctx = c.getContext("2d");
var history = {};
var samples = 20;
var colours = ["green", "orange", "red", "yellowgreen"];

var currentSample = 0;
var tasks = [
  {
    "task": "User",
    subtasks: [
      { "name": "create-user" },
      { "name": "send-email" },
      { "name": "update-subscription"},
      { "name": "bill"}
    ]
  },
  {
    "task": "System",
    subtasks: [
      { "name": "start-backup" },
      { "name": "finish-backup" },
      { "name": "reindex" },
      { "name": "optimise"}
    ]
  },
  {
    "task": "Backend",
    subtasks: [
      { "name": "synchronize" },
      { "name": "scaleup" },
      { "name": "scaledown" },
      { "name": "upgrade"}
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
        tasks[x].subtasks[s].fresh++;
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
          ctx.fillStyle = colours[s];
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
        // console.log(tasks[task].subtasks[myHistory[task]]);
          ctx.fill();
          if (previousHistory[task] != myHistory[task]) {
            textRenders.push({
              text: tasks[task].subtasks[myHistory[task]].name,
              x: graphX,
              y: graphY + 15
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
var c2 = document.getElementById("graph");
var gctx = c2.getContext("2d");
var visited = {};
var adjacency = {};
var nodes = {};
var nodeList = [];

var graphData = [
  ["one", "line", "two"],
  ["one", "line", "five"],
  ["two", "line", "three"],
  ["three", "line", "four"]
]
for (var x = 0 ; x < graphData.length; x++) {
  if (!nodes.hasOwnProperty(graphData[x][0])) {
    nodes[graphData[x]] = 1;
    nodeList.push(graphData[x][0]);
  }
  if (!nodes.hasOwnProperty(graphData[x][2])) {
    nodes[graphData[x]] = 1;
    nodeList.push(graphData[x][2]);
  }
}
function topoSort(name, visited, stack) {
  visited[name] = true;
  console.log(adjacency, name);
  for (var n = 0 ; n < adjacency[name].length ; n++) {
    topoSort(adjacency[name][n].destination, visited, stack);
  }
  stack.push(name);
}

function beginTopoSort(graph) {
  var stack = [];
  for (var x = 0 ; x < graph.length; x++) {
    var item = graph[x];
    if (!adjacency.hasOwnProperty(item[2])) {
      adjacency[item[2]] = [];
      
    }
    if (!adjacency.hasOwnProperty(item[0])) {
      adjacency[item[0]] = [];
      
    }
      adjacency[item[0]].push({"label": item[1], "destination": item[2]});
    
    
  }
  console.log(adjacency);
  for (var x = 0 ; x < nodeList.length; x++) {
    visited[nodeList[x]] = false;
  }
  for (var x = 0 ; x < nodeList.length; x++) {
    if (!visited[nodeList[x]]) {
      topoSort(nodeList[x], visited, stack);
    }
  }
  var order = [];
  while (stack.length > 0) {
    var item = stack.pop();
    order.push(item);
  }
  return order;
  
}

function graphTick() {
  gctx.beginPath();
  gctx.rect(0, 0, 800, 800);
  gctx.fillStyle = "white";
  gctx.fill();
  gctx.fillStyle = "";

  var order = beginTopoSort(graphData);
  console.log(order);
  var new_x = 200;
  var new_y = 400;

  var rendered = {};

  var angle = 0;
  for (var n = 0 ; n < order.length; n++) {
    var distance = 10;
    if (!rendered.hasOwnProperty(order[n])) {
      console.log("order new node ", order[n]);
      last_x = new_x;
      last_y = new_y;
      gctx.beginPath();
      gctx.arc(new_x, new_y, 25, 0, 2 * Math.PI);
      gctx.stroke();
      rendered[order[n]] = {
        "node": order[n],
        x: last_x,
        y: last_y
      }
    } else {
      last_x = rendered[order[n]].x;
      last_y = rendered[order[n]].y;
    }
    
    for (var a = 0 ; a < adjacency[order[n]].length; a++) {
      
    if (!rendered.hasOwnProperty(adjacency[order[n]][a].destination)) {
    distance *= 1.3;
    var radius = 10;
    var x = rendered[order[n]].x + radius * Math.cos((-angle)*Math.PI/180) * distance;
    var y = rendered[order[n]].y + radius * Math.sin((-angle)*Math.PI/180) * distance;


      
  gctx.beginPath();
  gctx.arc(x, y, 25, 0, 2 * Math.PI);
  gctx.stroke();
    console.log("rendering new node", order[n], adjacency[order[n]][a].destination, x, y);
      rendered[adjacency[order[n]][a].destination] = {
        "node": adjacency[order[n]][a],
        x: x,
        y: y
      }
      gctx.beginPath();
  gctx.moveTo(last_x, last_y);
  gctx.lineTo(x, y);
  gctx.stroke();
      // last_x = x;
      // last_y = y;
        
  }
      

      angle = (angle + 35) % 360;
    }
    angle = 0;
    
  }
  
}
graphTick();
// setInterval(graphTick, tickInterval);