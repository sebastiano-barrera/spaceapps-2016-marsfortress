var canvas, ctx, spawned;
var ngrid = 50;
var offx = 0;
var offy = 0;
var ratio = 1;
var zoom;
var highlight = {};



var maxRatio = 2.2;

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

function spawnImageRaw (name, x, y, w, h) {
    var img = document.getElementById(name);
    ctx.drawImage(img, x, y, w, h);
}

function spawnOrtho(name, x, y, w, h) {
    obj = mapOrtho(x,y,w,h);
    spawnImageRaw(name, obj.x, obj.y, obj.w, obj.h);
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

function spawnCell(name, x, y, w, h) {
    obj = fromMatrix(x,y);
    spawnOrtho(name, obj.x, obj.y, w*2/ngrid, h*2/ngrid);
}

function loadImage (name, x, y, w, h) {
    spawned.push ({'name':name,'x':x,'y':y,'w':w, 'h':h});
    //spawnCell(name,x,y, w, h);
}

function render () {
    draw();
    drawGrid();
    spawned.forEach(function (v,k) {
        //spawnImageRaw(v.name,v.x,v.y,v.w,v.h);
        spawnCell(v.name,v.x,v.y, v.w,v.h);
    });
}

$(window).resize(function () {
    render();
});

$(window).load(function() {
    canvas = document.getElementById('mars');
    ctx = canvas.getContext("2d");
    spawned = [];

    var game = require('/game.js');

    var g = new game.Game();

    var serra = g.build('Serra', [5, 5]);

    serra.type.image = 'serra';

    loadImage(serra.type.image, 5, 5, serra.type.size[0], serra.type.size[1]);

    $('#mars').mousemove(function (event) {
        alert(1);
        var obj = mapInvOrtho(event.pageX, event.pageY);
        var obj2 = toMatrix(obj.x, obj.y);
        highlight.x = obj2.x;
        highlight.y = obj2.y;
        console.log(highlight);
    });

    setInterval (render, 50);
});

