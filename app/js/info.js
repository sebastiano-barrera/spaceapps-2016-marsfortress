'use strict';

class InfoDialog {
    constructor() {
	$(function() {
	    $('#info-dialog').dialog().dialog('close');
	});
    }

    describeBuilding(name) {
	var tmp = new game.BUILDING_TYPES[name]();
	$('#info-dialog').dialog('option', 'title', tmp.name);
	$('#info-dialog-descr').html(tmp.descr);
	this.open();
    }

    open() { $('#info-dialog').dialog('open'); }
}

var infoDialog = new InfoDialog();
