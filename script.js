var taskLines = [];
var first = true;
var cpu = {
  threads: 2,
  cores: 8
}

var program = `
server = bind | accept | create-thread;
create-thread = epoll | epoll-poll | parse | save
`

var parse = {
  program: "",
  last_char: " ",
  pos: 0,
  end: false
};

function getchar() {

  if (parse.pos >= parse.program.length) {
    parse.end = true;
    return parse.program.charAt(parse.pos);
  }
  var char = parse.program.charAt(parse.pos);
  parse.pos = parse.pos + 1;
  parse.last_char = char;
  return char;
}

const regex = /[A-Za-z0-9_\-\&]/g;

function gettok() {
  while (!parse.end && (parse.last_char == "\t" || parse.last_char == "\n" || parse.last_char == " ")) {
    getchar();
  }
  if (parse.last_char == "|") {
    getchar();
    return "pipe";
  }
  if (parse.last_char == "=") {
    getchar();
    return "equals";
  }


  if (parse.last_char == ";") {
    getchar();
    return "eol";
  }
  if (parse.last_char.match(regex)) {

    var identifier = ""
    while (!parse.end && parse.last_char.match(regex)) {

      identifier += parse.last_char;
      getchar();
    }
    console.log("found identifier", "[" + parse.last_char + "]");
    return identifier;
  }
  return undefined;
}

function parseprogram(program) {
  console.log(program);
  parse.pos = 0;
  parse.last_char = " ";
  parse.program = program.replace(/\u00A0/g, '');;
  var token = null;
  console.log("token", token);
  var statements = [];
  while (!parse.end) {
    var statement = [];
    console.log("line");
    while (!parse.end && token != "eol" && token !== undefined) {
      console.log("innerloop");

      token = gettok();
      console.log(token);
      if (token != "eol") {
        statement.push(token);
      }
    }
    statements.push(statement);

    token = gettok();

    if (token != "eol") {
      statement.push(token);
    }

  }
  parse.last_char = " ";
  parse.pos = 0;
  parse.end = false;
  return statements;
}
var initialprogram = parseprogram(program);
console.log(initialprogram);
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
      { "name": "update-subscription" },
      { "name": "bill" }
    ]
  },
  {
    "task": "System",
    subtasks: [
      { "name": "start-backup" },
      { "name": "finish-backup" },
      { "name": "reindex" },
      { "name": "optimise" }
    ]
  },
  {
    "task": "Backend",
    subtasks: [
      { "name": "synchronize" },
      { "name": "scaleup" },
      { "name": "scaledown" },
      { "name": "upgrade" }
    ]
  }
];
for (var i = 0; i < cpu.cores; i++) {
  tasks.push({

    "task": `Core ${i}`,
    "subtasks": [
      {"name": "task1"},
      {"name": "task2"},
      {"name": "task3"},
      {"name": "task4"}
    ]
  }
  )
}
for (var x = 0; x < samples; x++) {
  history[x] = {};
  for (var y = 0; y < tasks.length; y++) {

    history[x][y] = -1;

  }
}
var thisNow = Date.now();
var now = thisNow;
function label(tasks) {
  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      tasks[x].subtasks[s].ticks = thisNow;
      tasks[x].subtasks[s].fresh = 2;
      tasks[x].subtasks[s].completed = true;

    }
    if (tasks[x].subtasks.length > 0) {
      tasks[x].subtasks[0].completed = false;
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

function randomize(first, now, tasks) {
  var min = tickInterval * 5
  var max = tickInterval * 100;
  

  for (var x = 0; x < tasks.length; x++) {
    var running = -1;
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks <= now && !tasks[x].subtasks[s].completed) {
        running = s;
      tasks[x].subtasks[running].completed = true;
        
      }
    }

    if (running < tasks[x].subtasks.length && running != -1 && !first) {
      tasks[x].subtasks[running].completed = true;
      running = running + 1;
    }

    if (running != -1 || first) {


      if (running >= tasks[x].subtasks.length) {
        running = 0;
      }
      if (running < tasks[x].subtasks.length) {
        tasks[x].subtasks[running].fresh = 0;
        tasks[x].subtasks[running].completed = false;

        tasks[x].subtasks[running].ticks = Date.now() + (Math.floor(Math.random() * (max - min) + min));
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
  if (taskLines.length > 5) {
    while (taskLines.length > 5) {
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
  for (var x = 1; x < taskLines.length; x++) {
    taskText += `${taskLines[x]} | `
  }

  return taskText;
}

function generateProcessDefinitions(tasks) {
  var strings = [];
  for (var task = 0; task < tasks.length; task++) {
    var row = [];
    strings.push(row);
    strings.push(["\n"]);
    row.push("### " + tasks[task].task + "\n");
    for (var subtask = 0; subtask < tasks[task].subtasks.length; subtask++) {
      row.push(tasks[task].subtasks[subtask].name);
    }
    row.push("\n");
  }
  // console.log(strings);
  var output = "";
  for (var string = 0; string < strings.length; string++) {
    output += strings[string].join(" | ");
  }
  return output;
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

  for (var x = 0; x < samples; x++) {
    if (x == 0) {
      previousSample = samples - 1;
    } else {
      previousSample = x - 1;
    }
    var previousHistory = history[previousSample];
    for (var task = 0; task < tasks.length; task++) {
      var myHistory = history[x];
      if (myHistory[task] != -1) {

        ctx.beginPath();
        ctx.moveTo(graphX, graphY);
        ctx.rect(graphX, graphY, 20, 20);
        ctx.fillStyle = colours[myHistory[task]];
        // console.log(tasks[task].subtasks[myHistory[task]]);
        ctx.fill();
        if (previousHistory[task] != myHistory[task] || x == 0) {
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

  for (var x = 0; x < textRenders.length; x++) {
    var render = textRenders[x];
    ctx.beginPath();
    ctx.font = "20px serif";
    ctx.fillStyle = "white";
    ctx.fillText(render.text, render.x, render.y);
    ctx.fillStyle = "";
  }
  textRenders = [];


  deduct(now, tasks);
  randomize(first, now, tasks);
  first = false;
  var taskText = generateTaskHistory(taskLines, tasks);
  document.getElementById('content').innerHTML =
    marked.parse(`# Operating system
    ${cpu.cores} cores/${cpu.threads * cpu.cores} threads
|Task|State|Left|
|---|---|---|\n` + generateTasks(now, tasks) + `

# Process definitions\n` +
      generateProcessDefinitions(tasks) + `\n
# History\n` + taskText, { headerIds: false, mangle: false });

  for (var x = 0; x < tasks.length; x++) {
    for (var s = 0; s < tasks[x].subtasks.length; s++) {
      if (tasks[x].subtasks[s].ticks > now) {
        history[currentSample][x] = s;
        break;
      } else {

      }
    }
  }
  currentSample = (currentSample + 1) % samples;
  now = Date.now();
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
for (var x = 0; x < graphData.length; x++) {
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
  for (var n = 0; n < adjacency[name].length; n++) {
    topoSort(adjacency[name][n].destination, visited, stack);
  }
  stack.push(name);
}

function beginTopoSort(graph) {
  var stack = [];
  for (var x = 0; x < graph.length; x++) {
    var item = graph[x];
    if (!adjacency.hasOwnProperty(item[2])) {
      adjacency[item[2]] = [];

    }
    if (!adjacency.hasOwnProperty(item[0])) {
      adjacency[item[0]] = [];

    }
    adjacency[item[0]].push({ "label": item[1], "destination": item[2] });


  }
  console.log(adjacency);
  for (var x = 0; x < nodeList.length; x++) {
    visited[nodeList[x]] = false;
  }
  for (var x = 0; x < nodeList.length; x++) {
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
  for (var n = 0; n < order.length; n++) {
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

    for (var a = 0; a < adjacency[order[n]].length; a++) {

      if (!rendered.hasOwnProperty(adjacency[order[n]][a].destination)) {
        distance *= 1.3;
        var radius = 10;
        var x = rendered[order[n]].x + radius * Math.cos((-angle) * Math.PI / 180) * distance;
        var y = rendered[order[n]].y + radius * Math.sin((-angle) * Math.PI / 180) * distance;



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
function renderProgram() {

}
var program = [];
var latches = [];
var activeLatch = -1;
var commands = [
  { "name": "create-email" },
  { "name": "create-file" },
  { "name": "create-tls-connection" },
  { "name": "create-tcp-connection" },
  { "name": "create-https-connection" },
  { "name": "create-http-connection" },
  { "name": "create-postgres-connection" },
  { "name": "create-sqlite-connection" }
];

function drawCommands() {
  var array = program;
  var transposed = array.map((_, colIndex) => array.map(row => row[colIndex]));
  $("#timetable tbody").empty();
  for (var x = 0; x < commands.length; x++) {
    $("#commands tbody").append(`<tr><td data-action="append">` + commands[x].name + `</td></tr>`);
  }

  var rows = 5;
  var size = 10;
  for (var x = 0; x < transposed.length; x++) {
    $("#timetable tbody").append("<tr></tr>");
    var row = $("#timetable tbody tr")[x];
    for (var y = 0; y < transposed[x].length; y++) {
      if (transposed[x][y] != undefined) {
        $(row).append(`<td>${transposed[x][y]}</td>`);
      }
    }
  }

}

function refresh() {
  $("#latches").empty();
  $("#program tbody").empty();
  $("#program thead").empty();
  $("#commands tbody").empty();

  for (var x = 0; x < program.length; x++) {
    if (program[x].length - 1 < latches.length) {
      for (var n = 0; n < latches.length; n++) {
        program[x].push("");
      }
    }
  }

  drawCommands();
  for (var x = 0; x < latches.length; x++) {
    $("#latches").append(`<li data-latch="${x}">` + latches[x] + "</li>");
  }
  $("#program thead").append(`<th data-latch="-1" class="active-latch">Command</th>`);
  for (var x = 0; x < latches.length; x++) {
    $("#program thead").append(`<th data-latch="${x}">${latches[x]}</th>`);
  }
  for (var x = 0; x < program.length; x++) {
    var row = $("#program tbody").append("<tr></tr>");
    row.append(`<td>${program[x][0]}</td>`);
    for (var r = 0; r < latches.length; r++) {
      row.append(`<td>${program[x][r + 1]}</td>`);
    }
    for (var n = 1; n < program[x].length; n++) {

    }
  }
  $("#program thead th").on("click", function(element) {
    var latch = $(event.target).data("latch");
    console.log(latch);
    activeLatch = parseInt(latch);
    refresh();

  });
  $(".active-latch").toggleClass("active-latch");

  var x = $("#program thead th")
  $(x[activeLatch + 1]).toggleClass("active-latch");


} // end of refresh
$("#commands tbody").on("click", function(event) {
  var e = $(event.target);
  console.log(e);
  var action = $(e).data("action");
  console.log(action);
  switch (action) {
    case "append":
      var line = [""];
      for (var x = 0; x < latches.length; x++) {
        line.push("");
      }

      var changeLine = activeLatch + 1;

      line[changeLine] = e.text();

      console.log(line);
      program.push(line)
      break;
  };
  refresh();
});
$("#addlatch").on("click", function() {
  latches.push($("#latchname").val());

  refresh();
});
refresh();
var mouse = null;
var originalTop = 0;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
var wheelOpt = { passive: false };
var keys = { 37: 1, 38: 1, 39: 1, 40: 1 };

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}
function transformScroll(event) {
  if (mouse == null) {
    return;
  }
  if (!event.deltaY) {
    return;
  }


  mouse.scrollLeft += event.deltaX + event.deltaY;
  // event.preventDefault();
}

function disableScroll() {
  window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  window.addEventListener('wheel', preventDefault, wheelOpt); // mobile
  window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}
function preventDefault(e) {
  e.preventDefault();
}
// call this to Enable
function enableScroll() {
  window.removeEventListener('DOMMouseScroll', preventDefault, false);
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  window.removeEventListener('wheel', preventDefault, wheelOpt);
  window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}

$("#timeline").on("mouseover", function(event) {
  disableScroll();
  console.log("disable scroll");
  mouse = $("#timeline").get(0);

});
$("#timeline").on("mouseout", function(event) {
  mouse = null;
  enableScroll();
});


var element = document.scrollingElement || document.documentElement;
// var element = document.getElementByid("timetable");
element.addEventListener('wheel', transformScroll);

var cc = document.getElementById("cycles");
var cctx = cc.getContext("2d");

var circles = [
  { x: 50, y: 100, angle: 0 },
  { x: 100, y: 200, angle: 200 },
  { x: 100, y: 100, angle: 65 },
  { x: 50, y: 200, angle: 65 },
  { x: 180, y: 100, angle: 65 },
  { x: 200, y: 200, angle: 35 }
]

function cycles() {
  cctx.beginPath();
  cctx.rect(0, 0, 800, 800);
  cctx.fillStyle = "white";
  cctx.fill();
  cctx.fillStyle = "";
  for (var n = 0; n < circles.length; n++) {
    circles[n].angle = (circles[n].angle + 10) % 360
    var distance = 3;
    var radius = 10;

    var x = circles[n].x + radius * Math.cos((-0) * Math.PI / 180) * distance;
    var y = circles[n].y + radius * Math.sin((-0) * Math.PI / 180) * distance;

    var line_x = x + radius * Math.cos((-circles[n].angle) * Math.PI / 180) * distance;
    var line_y = y + radius * Math.sin((circles[n].angle) * Math.PI / 180) * distance;


    cctx.beginPath();
    cctx.moveTo(line_x, line_y);
    cctx.lineTo(x, y);
    cctx.stroke();

    cctx.strokeStyle = "black";
    cctx.beginPath();

    cctx.arc(x, y, 25, 0, 2 * Math.PI);
    cctx.stroke();
  }
}

setInterval(cycles, 100);

var eventprograms = [
  `handle-request = submit-io | &callback | do-something;`,
  `submit-io = prep | submit | callback;`
]
var events = {
  changed: false
}
function refreshevents() {
  if (events.changed) {
    events.changed = false;
    mergeTasks();
  }
}
setInterval(refreshevents, 300);

function refresheventprograms() {
  $("#events").empty();
  for (var x = 0; x < eventprograms.length; x++) {
    var item = $(`<div contenteditable>${eventprograms[x]}</div>`)
    var program = $("#events").append(item);
    $(item).on("input", function(x) {
      return function(event) {
        eventprograms[x] = $(event.target).text();
        events.changed = true;
      }
    }(x))

  };

}

function mergeTasks() {
  console.log("MERGE TASKS");
  var programs = [];
  var index = {};
  $("#parsedevents").empty();
  for (var x = 0; x < eventprograms.length; x++) {
    var statements = parseprogram(eventprograms[x]);
    programs.push(statements);
    console.log("statements", statements);


    for (var n = 0; n < statements.length; n++) {
      var ol = $("<ol></ol>");
      var ul = $("#parsedevents").append(ol)

      for (var b = 0; b < statements[n].length; b++) {
        ol.append(`<li>${statements[n][b]}</li>`)
      }
    }
    //var taskA = $("")

  }
  for (var i = 0 ; i < programs.length; i++) {
    var prog = programs[i];
    for (var n = 0 ; n < prog.length; n++) {
      for (var s = 0 ; s < prog[n].length; s++) {
        var item = prog[n][s];
        console.log("item", item);
        if (item.charAt(0) == "&") {
          index[item] = {
            program: prog[n],
            stateline: n,
            position: s
          } 
        }
      } // end s
    } //
  }
  console.log(index);
  for (var x = 0 ; x < programs.length; x++) {
    for (var s = 0 ; s < programs[x].length; s++) {
      for (var v = 0 ; v < programs[x][s].length; v++) {
        var bb = programs[x][s][v];
        console.log(bb);
        var key = "&" + bb;
      if (index.hasOwnProperty(key)) {
        var record = index[key]
        console.log(record.position);
        console.log(record.program.slice(record.position + 1));
      }
      }
    }
  }

}
mergeTasks();
refresheventprograms();