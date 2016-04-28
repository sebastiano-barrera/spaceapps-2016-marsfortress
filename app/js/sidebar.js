function populateBuildings () {
    var v = game.BUILDING_TYPES;
    var width = parseInt($('#bar').css('width'))*.33;
    for (k in v) {
        v[k].image=v[k].name.toLowerCase();

        var tmp = new game.BUILDING_TYPES[v[k].name]();

        $('#barbuildings').append('<div id = "'+v[k].name+'" class = "building_image" style = "background-image:url(\'images/buildings/'+v[k].image+'.png\'); height: '+width+'px;" title = "'+tmp.descr+'"/>');
    }

    $('.building_image').click(function() {
        $('.building_image').removeClass('selected');
        $(this).addClass('selected');

        highlight = {};
        highlight.drop = function() {
            console.log('Droppin');
        };

        var tmp = new game.BUILDING_TYPES[this.id]();

        highlight.id = this.id;

        highlight.size = {};

        highlight.size.x = tmp.size[0];
        highlight.size.y = tmp.size[1];

        highlight.enable = true;
    })
	.contextmenu(function(event) {
	    event.preventDefault();
	    infoDialog.describeBuilding(this.id);
	});
}
