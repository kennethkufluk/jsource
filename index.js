window.onload = function() {
  var width = 1000,
      height = 1000,
      JSON_FILENAME = "mylog.json",
      CHARGE = -120,
      NODE_RADIUS = 10;

  var color = d3.scale.category20();

  var force = d3.layout.force()
      .linkDistance(10)
      .linkStrength(function(d) { return d.strength; })
      .charge(function(d) { return d.charge; })
      .size([width, height]);

  var svg = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height);


  var files = {
    '': {
      meta: {
        nodeIndex: 0,
        parent: null
      },
      folders: {},
      files: {}
    }
  };
  var folders = {
    '' : files['']
  };
  var root = folders[''];
  function addFile(fullPath) {
    if (files[fullPath]) return false;
    var path = fullPath.split('/');
    var filename = path.pop();
    var currentFolder = root;
    path.forEach(function(folder, index) {
      if (folder=='') return;
      if (!currentFolder.folders[folder]) {
        nodes.push({
          name: folder,
          group: index + 2,
          charge: CHARGE,
          x:width/2,
          y:height/2
        });
        currentFolder.folders[folder] = {
          meta: {
            nodeIndex: nodes.length - 1,
            parent: currentFolder
          },
          folders: {},
          files: {}
        };
        links.push({
          source: currentFolder.meta.nodeIndex,
          target: currentFolder.folders[folder].meta.nodeIndex,
          value: 1,
          strength: 1
        });
      }
      currentFolder = currentFolder.folders[folder];
    });
    if (!currentFolder.files[filename]) {
      nodes.push({
        name: filename,
        group: 0,
        charge: CHARGE,
        x:width/2,
        y:height/2
      });
      currentFolder.files[filename] = files[fullPath] = {
        meta: {
          nodeIndex: nodes.length - 1,
          parent: currentFolder
        },
        fullPath: fullPath
      };
      links.push({
        source: currentFolder.meta.nodeIndex,
        target: currentFolder.files[filename].meta.nodeIndex,
        value: 1,
        strength: 1
      });
      return true;
    }
  }

  var users = {};
  function addUser(username) {
    if (users[username]) return false;
    nodes.push({
      name: username,
      group: 1,
      charge: CHARGE,
      x:width/2,
      y:height/2
    });
    users[username] = {
      index: nodes.length - 1,
    };
  }

  function setup() {
    // links
    var link = svg.selectAll("line.link")
        .data(links)
      .enter().append("line")
        .attr("class", "link");

    // tidy dead links
    svg.selectAll("line.link")
        .data(links)
        .exit().remove();

    svg.selectAll("line.link")
        .style("stroke", function(d) { return d.color; } )
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    // nodes
    var node = svg.selectAll(".node")
        .data(nodes)
      .enter().append('g')
        .attr("class", "node");

    node.append("circle")
        .attr("r", NODE_RADIUS)
        .style("fill", function(d) { return color(d.group); })
        .call(force.drag);

    // title
    node.append("text")
        .text(function(d) { return d.name.split('.')[0]; })
        .attr("dx", 12)
        .attr("dy", ".35em")
        .style("fill","black");

    return {
      svgLinks: svg.selectAll("line.link"),
      svgNodes: svg.selectAll(".node")
    };
  }

  function getLineCol(type) {
    switch(type) {
      case 'A':
        return "green";
      case 'M':
        return "yellow";
      case 'D':
        return "red";
    }
  }

  var TICK_DURATION = 1;
  var nodes = [{"name":"/","group":0, charge:0, x:width/2, y:height/2}];
  var links = [];
  var actionLinks = [];
  d3.json(JSON_FILENAME, function(log) {
    force
        .nodes(nodes)
        .links(links)
        .start();

    var s = setup();
    var svgLinks = s.svgLinks;
    var svgNodes = s.svgNodes;

    var times = Object.keys(log);
    var start = times[0];
    var end = times[times.length-2];
    var now = parseInt(start, 10);
    var lastUpdate = now;
    var lastTick = (+now)-1;

    force.on("tick", function() {
      svgLinks.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

      svgNodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });

    var inactiveTime = 0;
    var clockEl = d3.select("#foot");
    setInterval(function() {
      var updates = false;
      actionLinks.forEach(function(link) {
        links.splice(links.indexOf(link), 1);
        updates = true;
      });
      actionLinks = [];
      var changes = [];
      for (var i=now; i>lastTick; i--) {
        if (log[i]) {
          changes = changes.concat(log[i]);
          lastUpdate = i;
        }
      }
      if (changes.length) {
        for (var logline in changes) {
          updates = addFile(changes[logline].f) || updates;
          updates = addUser(changes[logline].u) || updates;
          var actionLink = {
            source: users[changes[logline].u].index,
            target: files[changes[logline].f].meta.nodeIndex,
            value: 100,
            strength: 0.1,
            color: getLineCol(changes[logline].t)
          };
          links.push(actionLink);
          actionLinks.push(actionLink);
          updates = true;
        }
        clockEl.html(new Date(now * 1000));
      }
      if (updates) {
        s = setup();
        svgLinks = s.svgLinks;
        svgNodes = s.svgNodes;
        force.links = links.concat(actionLinks);
        force.start();
        inactiveTime = 0;
      } else {
        inactiveTime++;
      }

      // skip ahead
      lastTick = now;
      if (inactiveTime > 1) {
        for (var i=0; i<times.length; i++) {
          if (times[i]>lastUpdate) {
            now = +times[i];
            if (times[i]==lastUpdate) {
              now = +times[i+1];
            }
            break;
          }
        }
      } else {
        now += TICK_DURATION;
      }
    }, 20);

    var timeControl = d3.select("#time");
    var timeLabel = d3.select("#timelabel");
    timeControl.on('change', function() {
      var range = end - start;
      var scaler = range / 100;
      lastTick = now = lastUpdate = +start + Math.round(scaler * (+this.value));
    });

  });

  var speedControl = d3.select("#speed");
  var speedLabel = d3.select("#speedlabel");
  speedControl.on('change', function() {
    TICK_DURATION = +this.value;
    speedLabel.html('Speed ' + TICK_DURATION);
  });


};