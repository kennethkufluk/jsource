jsource
=======

Hey, look, it's one of those git visualizer things.
Inspired by the beautiful acaudwell/Gource project.
This rough script uses mbostock/d3 to create a force directed layout of your git repo, showing commits over time by the authors.

Check out a demo, using the jquery repo as an example, here:
http://kennethkufluk.github.io/jsource/

To run this over your own repo:

1) Install gource (`brew install gource`)

1) `cd` to the root of your repo

2) Create a git log file
    `gource --output-custom-log mylog.log`

3) Copy that file to the jsource folder

5) Convert your log file to json
    `node format_log.js`

8) Start a local browser
    `python -m SimpleHTTPServer &`

13) Load up index.html
    `open http://localhost:8000/`

Copyrighted, licensed and patented to the hilt. I own you now.

(HTML and CSS adapted from the force-directed layout example of d3.)
