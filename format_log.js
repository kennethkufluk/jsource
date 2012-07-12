var fs = require('fs');

fs.readFile('mylog.log', 'utf-8', function(e, gitlog) {
  if (e) throw e;
  var lines = gitlog.split("\n");
  var log = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var lineArr = line.split('|');
    log[lineArr[0]] = log[lineArr[0]] || [];
    log[lineArr[0]].push({
      u: lineArr[1],
      t: lineArr[2],
      f: lineArr[3]
    });
  }
  fs.writeFile('mylog.json', JSON.stringify(log, null, 2), 'utf-8');
});