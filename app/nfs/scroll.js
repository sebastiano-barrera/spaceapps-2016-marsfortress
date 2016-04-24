var zoomOffset = .1;
var zoomMin = 1;
var zoomMax = 3;

function changeZoom (offset) {
    zoom += offset;
    if(zoom < zoomMin) zoom = zoomMin;
    if(zoom > zoomMax) zoom = zoomMax;
    console.log(zoom+' '+ratio);
}


function extractDelta(e) {
    if (e.wheelDelta) {
        return e.wheelDelta;
    }

    if (e.originalEvent.detail) {
        return e.originalEvent.detail * -40;
    }

    if (e.originalEvent && e.originalEvent.wheelDelta) {
        return e.originalEvent.wheelDelta;
    }
}


$(window).bind('mousewheel DOMMouseScroll MozMousePixelScroll', function(event) {
if (extractDelta(event) >= 0) {
        changeZoom(zoomOffset);
    }
    else {
        changeZoom(-zoomOffset);
    }
    render();
});
