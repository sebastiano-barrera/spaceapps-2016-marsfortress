var zoomOffset = .1;
var zoomMin = 1;
var zoomMax = 3;

clicked = 0;
scrollx = 0; scrolly = 0;
$(window).load(function() {
    $('#mars').mousedown(function(event) {
        clicked = 1;
        scrolled = 0;
        scrollx = event.pageX;
        scrolly = event.pageY;
    });
    $('#mars').mouseup(function(event) {
        clicked = 0;
    });
    $('#mars').mousemove(function(event) {
        if(clicked) {
            scrolled += Math.abs((event.pageX - scrollx) / ctx.canvas.width * ratio / zoom * 2) + Math.abs((event.pageY - scrolly) / ctx.canvas.height / zoom * 2);
;
            offx += (event.pageX - scrollx) / ctx.canvas.width * ratio / zoom * 2;
            offy += (event.pageY - scrolly) / ctx.canvas.height / zoom * 2;
            scrollx = event.pageX;
            scrolly = event.pageY;
            minOffx = -0.5/ratio;
            maxOffx = +0.5/ratio;
            minOffy = -0.5;
            maxOffy = 0.5;
            
            if(offx < minOffx) offx = minOffx;
            if(offx > maxOffx) offx = maxOffx;
            if(offy < minOffy) offy = minOffy;
            if(offy > maxOffy) offy = maxOffy;
            render();
        }
    });
});
