var canvas, ctx, spawned;
var ngrid = 50;
var offx = 0;
var offy = 0;
var ratio = 1;
var zoom;
var highlight = {};

var tmpMap ;

var scrolled = 0;
var maxRatio = 2.2;

var g,game;

function draw () {
    ctx.canvas.width  = window.innerWidth;


    if (window.innerWidth / window.innerHeight > maxRatio) {
        ctx.canvas.height = window.innerWidth / maxRatio;
    }
    else {
        ctx.canvas.height = window.innerHeight;
    }

    ratio = ctx.canvas.width/ctx.canvas.height;
    zoomMin = 3; //1.625*ratio;
    zoomMax = 3; // *ratio;

    zoom = zoomMin;

/*
    var img = document.getElementById('mars_bg');
    var pat = ctx.createPattern(img, 'repeat');

    ctx.rect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = pat;
    ctx.fill();
*/
}

function mapOrtho (x,y,w,h) {
    x += offx;
    y -= offy;
    x *= zoom;
    y *= zoom;
    w *= zoom;
    h *= zoom;
    return mapOrthoR(x,y,w,h);
}

function mapOrthoR (x,y,w,h) {
    var obj = {};
    obj.x = (x + ratio) / ratio * ctx.canvas.width / 2;
    obj.y = (1 - y) * ctx.canvas.height / 2;
    obj.w = w / ratio * ctx.canvas.width/2;
    obj.h = h * ctx.canvas.height/2;
    return obj;
}

function mapInvOrtho (x,y) {
    var obj = {};
    obj.x = 2*ratio*x/ctx.canvas.width - ratio;
    obj.y = 1-(y*2/ctx.canvas.height);
    obj.x /= zoom;
    obj.y /= zoom;
    obj.x -= offx;
    obj.y += offy;
    return obj;
}



function setGridOpacity (alpha) {
    obj = mapOrtho(-1,1,2,2);
    var img = document.getElementById('mars_bg');
    var pat = ctx.createPattern(img, 'repeat');

    z = zoom/3;
    ctx.fillStyle = pat;
    ctx.translate(obj.x,obj.y);
    ctx.scale(z, z);
    ctx.rect(0,0,obj.w,obj.h);
    //ctx.fillStyle = "rgba(255,255,255,1.0)";
    ctx.fill();
    ctx.scale(1/z, 1/z);
    ctx.translate(-obj.x,-obj.y);
}


function drawGrid () {
    setGridOpacity(.1);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = -1; i <= 1; i+=2/ngrid) {
        obj = mapOrtho(i, 1,0,0);
        ctx.moveTo(obj.x, obj.y);
        obj = mapOrtho(i, -1,0,0);
        ctx.lineTo(obj.x, obj.y);


        obj = mapOrtho(1,i,0,0);
        ctx.moveTo(obj.x, obj.y);
        obj = mapOrtho(-1,i,0,0);
        ctx.lineTo(obj.x, obj.y);
    }
    ctx.stroke();
}

function spawnImageRaw (name, x, y, w, h, alpha) {
    var img = document.getElementById(name);
    ctx.save();
    ctx.globalAlpha = alpha;
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
    }

    function spawnOrtho(name, x, y, w, h, alpha) {
        obj = mapOrtho(x,y,w,h);
        spawnImageRaw(name, obj.x, obj.y, obj.w, obj.h, alpha);
    }

    function fromMatrix (x, y) {
        var obj = {};
        obj.x = (2/ngrid * x)-1;
        obj.y = 1-(2/ngrid * y);
        return obj;
    }

    function toMatrix (x, y) {
        var obj = {};
        obj.x = (x+1)*ngrid/2;
        obj.y = (1-y)*ngrid/2;
        obj.x = parseInt(obj.x);
        obj.y = parseInt(obj.y);
        return obj;
    }

    function spawnCell(name, x, y, w, h, alpha) {
        obj = fromMatrix(x,y);
        spawnOrtho(name, obj.x, obj.y, w*2/ngrid, h*2/ngrid, alpha);
    }

    function loadImage (name, x, y, w, h, alpha) {
        spawned.push ({'name':name,'x':x,'y':y,'w':w, 'h':h, 'alpha':alpha});
        //spawnCell(name,x,y, w, h);
    }

    function render () {
        draw();
        drawGrid();
        drawHud();
        spawned.forEach(function (v,k) {
            //spawnImageRaw(v.name,v.x,v.y,v.w,v.h);
            spawnCell(v.name,v.x,v.y, v.w,v.h,v.alpha);
        });

        if (highlight.enable === true) {
            ctx.fillStyle = highlight.color;
            var obj = fromMatrix(highlight.x, highlight.y);
            var obj = mapOrtho(obj.x, obj.y,highlight.size.x*2/ngrid,highlight.size.y*2/ngrid);
                ctx.fillRect (obj.x, obj.y, obj.w, obj.h);
            }
    }

    function initTmpMap () {
        tmpMap = new Array(ngrid);
        for (var i = 0; i < ngrid; i++) {
            tmpMap[i] = new Array(ngrid).fill(false);
        }
    }

    function startTurn () {
        initTmpMap();

        spawned = [];
        g.buildings.forEach(function(v,k) {
            var obj = {};
            obj.name = v.image;
            obj.x = v.pos[0];
            obj.y = v.pos[1];
            obj.w = v.size[0];
            obj.h = v.size[1];
            obj.alpha = 1.0;
            spawned.push(obj);
        });

    buildings = [];
    g.beginTurn();
    logEvent('Starting a new turn');
}

function logga (msg) {
    console.log(msg);
}


$(window).load(function() {

    game = require('/game');
    g = new game.Game();

//    g.setLogger(logEvent);
    g.setLogger(logga);
    startTurn ();

    canvas = document.getElementById('mars');
    ctx = canvas.getContext("2d");
    spawned = [];

    populateBuildings();

    $('#mars').mousemove(function (event) {
        if (highlight.enable === true) {
            var obj = mapInvOrtho(event.pageX, event.pageY);
            var obj2 = toMatrix(obj.x, obj.y);
            highlight.x = obj2.x;
            highlight.y = obj2.y;

            highlight.color = canPlaceBuilding(highlight.x, highlight.y, highlight.size.x, highlight.size.y) ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
            highlight.enable = true;
        }
    });

    $('#mars').mouseup(function() {
        if (highlight.enable === true && typeof highlight.drop === 'function' && canPlaceBuilding(highlight.x, highlight.y, highlight.size.x, highlight.size.y) && scrolled < 0.005) {
            highlight.drop();

            loadImage(highlight.id.toLowerCase(),highlight.x,highlight.y,highlight.size.x,highlight.size.y,.7);

            for (var i = 0; i < highlight.size.x; i++) {
                for (var j = 0; j < highlight.size.y; j++) {
                    console.log(tmpMap[highlight.x+i][highlight.y+j]);
                    tmpMap[highlight.x+i][highlight.y+j] = true;
                }
            }

            buildings.push(new game[highlight.id]({'pos':[highlight.x, highlight.y]}));

            highlight.enable = false;
            $('.building_image').removeClass('selected');
        }
    });



    $('#end_turn_button').click(function () {
        logEvent('Current turn ended!');

        if (buildings.length !== 0) {
            g.setRestock({'resources': undefined, 'buildings':buildings});
        }

        g.endTurn();

        startTurn();
    });

    setInterval (render, 50);
});



function canPlaceBuilding (x, y, w, h) {
    if (x + w >= ngrid || y + h >= ngrid || x < 0 || y < 0) {
        return false;
    }

    for (var i = x; i < x + w; i++) {
        for (var j = y; j < y + h; j++) {
            if (tmpMap[i][j] === true || g.map.m[i] === undefined || g.map.m[i][j] === undefined || g.map.m[i][j].building !== null) {
                return false;


            }
        }
    }
    return true;
}
