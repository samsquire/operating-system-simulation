var taskLines = [];
var first = true;
var graphData = [
  ["one", "line", "two"],
  ["one", "line", "five"],
  ["two", "line", "three"],
  ["three", "line", "four"]
]
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
var products = [
  {
    "name": "hosted",
    "description": "hosted somewhere"
  }
];

function productTable(products) {
  return products.map(function(item) {
    return `|${item.name}|${item.description}\n`;
  })
}

function renderproducts() {

  var text = `\n
|Product Keyword|Description|
|---|---|\n` +
    productTable(products);
  console.log(text);
  document.getElementById('products').innerHTML =
    marked.parse(text
    );
}

renderproducts();

function getchar() {

  if (parse.pos >= parse.program.length) {
    parse.end = true;

    char = parse.program.charAt(parse.pos);
    // console.log("char is ["+ char + "]")
    return char;
  }
  var char = parse.program.charAt(parse.pos);
  parse.pos = parse.pos + 1;
  parse.last_char = char;
  // console.log("char is ["+ char + "]")
  return char;
}

const regex = /[A-Za-z0-9_\-\:&]/g;

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
  if (parse.last_char == "(") {
    getchar();
    return "openbracket"
  }
  if (parse.last_char == "") {
    return "eof";
  }
  if (parse.last_char == ")") {
    getchar();
    return "closebracket"
  }
  if (parse.last_char == ",") {
    getchar();
    return "comma"
  }
  if (parse.last_char == ";") {
    getchar();
    return "eol";
  }
  if (parse.last_char == "{") {
    getchar();
    return "opencurly";
  }
  if (parse.last_char == "}") {
    getchar();
    return "closecurly";
  }
  if (parse.last_char.match(regex)) {

    var identifier = ""
    while (!parse.end && parse.last_char.match(regex)) {

      identifier += parse.last_char;
      getchar();
    }
    //console.log("found identifier", "[" + parse.last_char + "]");
    return identifier;
  }
  return undefined;
}

function parseparameterlist(statement, kind) {
  var currentfact = {
    parameters: [],
    children: []
  }
  var parameter = [];
  var items = [];
  while (!parse.end && parse.token != kind && parse.token != "eol") {
    parse.token = gettok();
    if (parse.token == undefined) {
      break;
    }
    if (parse.token == "openbracket") {

      var me = [];
      parseparameterlist(me, "closebracket");
      currentfact.fact = items[0];
      currentfact.parameters = me.slice(0); statement.push(currentfact);
      currentfact = {
        parameters: [],
        children: []
      };
      items = []


    }
    if (parse.token == "comma") {
      continue
    }
    if (parse.token == kind) {
      break;
    }
    else if (parse.token == "pipe") {

      currentfact = {
        parameters: [],
        children: []
      };
      items = [];
    }
    else if (parse.token != "closebracket" && parse.token != "closecurly") {
      console.log(kind, "paramlist", parse.token);
      items.push(parse.token);
    }
  }
  for (var x = 0; x < items.length; x++) {
    statement.push(items[x]);
  }
}

function parseprogram(program) {
  // console.log(program);
  parse.pos = 0;
  parse.last_char = " ";
  parse.token = "";
  parse.program = program.replace(/\u00A0/g, '');;
  // console.log("token", parse.token);
  var statements = [];
  var currentfact = {
    parameters: [],
    children: []
  };
  var currentgroup = {
    kind: "group",
    children: [],
    parameters: [],
    fact: "group"
  };
  var statement = [];
  while (!parse.end) {

    console.log("> in line");
    while (!parse.end && parse.token != "eol" && parse.token !== undefined) {
      // console.log("innerloop");

      parse.token = gettok();
      console.log("TOK", parse.token);
      if (parse.token == undefined) {
        break;
      }
      if (parse.token == "openbracket") {
        parseparameterlist(statement, "closebracket");
        currentfact.fact = statement[0];
        currentfact.parameters = statement.slice(1);
        currentgroup.children.push(currentfact);

        currentfact = {
          parameters: [],
          children: []
        };
        statement = []
      }
      else if (parse.token == "opencurly") {
        var container = {
          kind: "parallel",
          children: [],
          parameters: [],
          fact: "parallel"
        };
        parseparameterlist(container.children, "closecurly");
        statements.push(container);
        statement = [];
      }
      else if (parse.token == "pipe" || parse.token == "equals") {
        statements.push(currentgroup);
        currentgroup = {
          kind: "group",
          children: [],
          parameters: [],
          fact: "group"
        };


        statement = [];
        currentfact = {
          parameters: [],
          children: []
        };

        statement = []
      }
      else if (parse.token != "eol") {
        statement.push(parse.token);

      }
      else if (parse.token == "eol") {

        currentfact = {
          parameters: [],
          children: []
        };
        statement = []
      }
    }


    parse.token = gettok();
    console.log("AFTERTOKEN", parse.token)
    if (parse.token == undefined) {
      break;
    }
    if (parse.token == "openbracket") {
      parseparameterlist(statement, "closebracket");
      currentfact.fact = statement[0];
      currentfact.parameters = statement.slice(1); statements.push(currentfact);
      currentfact = {
        parameters: [],
        children: []
      };
      statement = []
    }
    else if (parse.token != "eol") {
      statement.push(parse.token);
    }
    else if (parse.token == "eol") {

      currentfact = {
        parameters: [],
        children: []
      };
      statement = []
    }

  }
  parse.last_char = " ";
  parse.pos = 0;
  parse.end = false;
  var masks = [];
  var d = 0;
  for (var x = 0; x < statements.length; x++) {
    for (var n = 0 ; n < statements[x].children.length ; n ++) {
   console.log(statements[x]);
      console.log(statements[x].children[n]); masks.push([statements[x].children[n].fact, 1
               << d]);
      d++;
      }
  }
  console.log("masks", masks);
  return statements;
}
var initialprogram = parseprogram(program);
//console.log(initialprogram);
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
      { "name": "task1" },
      { "name": "task2" },
      { "name": "task3" },
      { "name": "task4" }
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

function updateGraph() {
  nodes = {};
  nodeList = [];
  adjacency = {};
  visited = {};
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
}
updateGraph();
function topoSort(name, visited, stack) {
  visited[name] = true;
  //console.log(adjacency, name);
  for (var n = 0; n < adjacency[name].length; n++) {
    if (!visited[adjacency[name][n].destination]) {
      topoSort(adjacency[name][n].destination, visited, stack);
    }
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
  //console.log(adjacency);
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
  gctx.rect(0, 0, 5000, 10000);
  gctx.fillStyle = "white";
  gctx.fill();
  gctx.fillStyle = "";

  var order = beginTopoSort(graphData);
  console.log("ordering", order);
  var new_x = 500;
  var new_y = 400;

  var rendered = {};
  var connections = {};

  var angle = 0;
  for (var n = 0; n < order.length; n++) {
    angle = 0;
    var distance = 10;
    if (!rendered.hasOwnProperty(order[n])) {
      //console.log("order new node ", order[n]);

      new_x += 50;
      new_y += 500;

      gctx.beginPath();
      gctx.arc(new_x, new_y, 25, 0, 2 * Math.PI);
      gctx.stroke();

      last_x = new_x;
      last_y = new_y;

      ctx.beginPath();
      gctx.font = "13px serif";
      gctx.fillStyle = "black";
      gctx.fillText(order[n], new_x, new_y);

      rendered[order[n]] = {
        "node": order[n],
        x: new_x,
        y: new_y
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
        ctx.beginPath();
        gctx.font = "13px serif";
        gctx.fillStyle = "black";
        gctx.fillText(adjacency[order[n]][a].destination, x, y);//console.log("rendering new node", order[n], adjacency[order[n]][a].destination, x, y);
        rendered[adjacency[order[n]][a].destination] = {
          "node": adjacency[order[n]][a],
          x: x,
          y: y
        }
        gctx.beginPath();
        gctx.moveTo(x, y);
        gctx.lineTo(last_x, last_y);

        var headlen = 10; // length of head in pixels
        var dx = last_x - x;
        var dy = last_y - y;
        var aangle = Math.atan2(dy, dx);

        gctx.lineTo(last_x - headlen * Math.cos(aangle - Math.PI / 6), last_y - headlen * Math.sin(aangle - Math.PI / 6));
        gctx.moveTo(last_x, last_y);
        gctx.lineTo(last_x - headlen * Math.cos(aangle + Math.PI / 6), last_y - headlen * Math.sin(aangle + Math.PI / 6));

        gctx.stroke();
        // last_x = x;
        // last_y = y;

      } else {
        var source = rendered[adjacency[order[n]][a].destination];
        var target = rendered[order[n]];
        var key = `${source.node}->${target.node}`;
        if (!connections.hasOwnProperty(key)) {
          connections[key] = true;
          // console.log("drawing line to existing item", source, target);
          xx = target.x;
          yy = target.y;
          last_xx = source.x;
          last_yy = source.y;
          gctx.beginPath();
          gctx.moveTo(xx, yy);
          gctx.lineTo(last_xx, last_yy);

          var headlen = 10; // length of head in pixels
          var dx = last_xx - xx;
          var dy = last_yy - yy;
          var aangle = Math.atan2(dy, dx);

          gctx.lineTo(last_xx - headlen * Math.cos(aangle - Math.PI / 6), last_yy - headlen * Math.sin(aangle - Math.PI / 6));
          gctx.moveTo(last_xx, last_yy);
          gctx.lineTo(last_xx - headlen * Math.cos(aangle + Math.PI / 6), last_yy - headlen * Math.sin(aangle + Math.PI / 6));

          gctx.stroke();
        }
      }


      angle = (angle + 35) % 360;
    }

    // angle = (angle + 35) % 360;
  }

}
graphTick();
setInterval(graphTick, 30000);
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
  //console.log(e);
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

      //console.log(line);
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
    var distance = 1;
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
  `handle-request() = submit-io() | &callback() | do-something();`,
  `submit-io() = prep() | submit() | callback();`,
  `next_free_thread(thread:2);
task(task:A) thread(thread:1) assignment(task:A, thread:1) = running_on(task:A, thread:1) | paused(task:A, thread:1);

running_on(task:A, thread:1)
thread(thread:1)
assignment(task:A, thread:1)
thread_free(thread:next_free_thread) = fork(task:A, task:B)
                                | send_task_to_thread(task:B, thread:next_free_thread)
                                |   running_on(task:B, thread:2)
                                    paused(task:A, thread:1)
                                    running_on(task:A, thread:1)
                                    assignment(task:B, thread:2)
                               | { yield(task:B, returnvalue) | paused(task:B, thread:2) }
                                 { await(task:A, task:B, returnvalue) | paused(task:A, thread:1) }
                               | send_returnvalue(task:B, task:A, returnvalue); 
  `
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
setInterval(refreshevents, 5000);

function refresheventprograms() {
  $("#events").empty();
  for (var x = 0; x < eventprograms.length; x++) {
    var item = $(`<pre contenteditable>${eventprograms[x]}</pre>`)
    var program = $("#events").append(item);
    $(item).on("input", function(x) {
      return function(event) {
        eventprograms[x] = $(event.target).text();
        events.changed = true;
      }
    }(x))

  };

}
function indexStatement(x, statement, statements, parameterIndex) {

  for (var c = 0; c < statement.children.length; c++) {
    indexStatement(c, statement.children[c], statement.children, parameterIndex)
  }
  for (var v = 0; v < statement.parameters.length; v++) {

    if (!parameterIndex.hasOwnProperty(statement.parameters[v])) {
      parameterIndex[statement.parameters[v]] = []
    }
    parameterIndex[statement.parameters[v]].push(statement);
  }
}
graphIndexLeft = {};
graphIndexRight = {};
function parseStatement(statements, n) {
  if (statements[n].kind == "parallel") {
    for (var x = 0; x < statements[n].children.length; x++) {
      parseStatement(statements[n].children, x);
    }
  }
  for (var b = 0; b < statements[n].parameters.length; b++) {

    for (var c = 0; c < statements[n].parameters.length; c++) {
      if (b != c) {
        var left = `${statements[n].parameters[b]}`;
        var right = statements[n].parameters[c];
        var key = `${left}->${right}`;
        if (!graphIndexLeft.hasOwnProperty(key)) {
          graphIndexLeft[key] = true;

          graphData.push([left, "moves", right]);
        }

      }
    }
  }
}
function create_dependencies(statements) {
  var items = [];
  var parameters = [];
  var index = {};
  for (var x = 0; x < statements.length; x++) {
    items = items.concat(statements[x].children);
    for (var c = 0; c < statements[x].children.length; c++) {
      for (var n = 0; n < statements[x].children[c].parameters.length; n++) {
        parameters.push({"parameter": statements[x].children[c].parameters[n], "fact": statements[x].children[c].fact});
        if (!index.hasOwnProperty(statements[x].children[c].parameters[n])) {
          index[statements[x].children[c].parameters[n]] = [];
        } else {
          index[statements[x].children[c].parameters[n]].push(statements[x].children[c].fact)
        }
      }
    }
  }
  console.log("allitems", items);
  console.log("parameters", parameters);
  console.log("index", index);
  
  
  // live ranges
}

function mergeTasks() {
  graphIndexLeft = {};
  console.log("MERGE TASKS");
  var programs = [];
  var index = {};
  $("#parsedevents").empty();
  for (var x = 0; x < eventprograms.length; x++) {
    var statements = parseprogram(eventprograms[x]);
    create_dependencies(statements);
    programs.push(statements);
    console.log("statements", statements);

    var ol = $("<ol></ol>");
    var ul = $("#parsedevents").append(ol)
    for (var n = 0; n < statements.length; n++) {


      for (var c = 0; c < statements[n].children.length; c++) {
        var container = $(`<div class="fact-container"></div>`);
        ol.append(container)
        var name = $(`<div class="fact-name">${statements[n].children[c].fact}</div>`);
        container.append(name);

        for (var b = 0; b < statements[n].children[c].parameters.length; b++) {
          var factname = $(`<div class="fact-parameter">${statements[n].children[c].parameters[b]}</div>`);
          container.append(factname);
        }
      }
      //var taskA = $("")

    }
  }



  // process AST
  var parameterIndex = {};
  statements = programs[programs.length - 1];
  for (var x = 0; x < statements.length; x++) {

    indexStatement(x, statements[x], statements, parameterIndex);

  }

  console.log("statementindex", parameterIndex);
  console.log("statements", statements);
  graphData = [];
  var keys = Object.keys(parameterIndex);

  for (var n = 0; n < statements.length; n++) {
    //graphData.push([statements[n].fact, "moves", statements[n].parameters.join(" ")]);
    parseStatement(statements, n);


    //graphData.push([parameterIndex[keys[n]][b].fact, "moves", keys[n]]);

    // graphData.push([parameterIndex[keys[n]][b].parameters[x], "moves", keys[n]]);





  }
  graphData = [...new Set(graphData)];
  console.log(graphData);
  updateGraph();
  for (var i = 0; i < programs.length; i++) {
    var prog = programs[i];
    for (var n = 0; n < prog.length; n++) {
      for (var s = 0; s < prog[n].length; s++) {
        var item = prog[n][s];
        // console.log("itemis", item);
        if (typeof item === "string" && item.charAt(0) == "&") {
          index[item] = {
            program: prog[n],
            stateline: n,
            position: s
          }
        }
      } // end s
    } //
  }
  //console.log(index);
  for (var x = 0; x < programs.length; x++) {
    for (var s = 0; s < programs[x].length; s++) {
      for (var v = 0; v < programs[x][s].length; v++) {
        var bb = programs[x][s][v];
        //console.log(bb);
        var key = "&" + bb;
        if (index.hasOwnProperty(key)) {
          var record = index[key]
          //console.log(record.position);
          console.log(record.program.slice(record.position + 1));
        }
      }
    }
  }

}
mergeTasks();
refresheventprograms();

var lc = document.getElementById("logistical-animation");
var lctx = lc.getContext("2d");

var atoms = [
  { "name": "one", x: 50, y: 50, angle: 0 }
]

var lradius = 5;
var ldistance = 1.3;
function aniTick() {
  lctx.fillStyle = "white";
  lctx.fillRect(0, 0, 800, 800);
  for (var x = 0; x < atoms.length; x++) {
    lctx.fillStyle = "red";
    atoms[x].angle = (atoms[x].angle + 20) % 360;
    atoms[x].x = atoms[x].x + lradius * Math.cos(-atoms[x].angle * Math.PI / 180) * ldistance;
    atoms[x].y = atoms[x].y + lradius * Math.sin(-atoms[x].angle * Math.PI / 180) * ldistance;
    lctx.fillRect(atoms[x].x, atoms[x].y, 5, 5);

  }
}
aniTick();
setInterval(aniTick, 200);

var nt = $("#number-table");

var c = 0;
for (var x = 0; x < 15; x++) {
  for (var n = 0; n < 15; n++) {
    var nn = $(`<span>${c++} <span> `);
    nt.append(nn);
  }
  nt.append($("<br>"))
}