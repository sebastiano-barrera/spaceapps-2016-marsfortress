'use strict';

class InfoDialog {
    constructor() {
	$(function() {
	    $('#info-dialog').dialog({
		resizable: false
	    }).dialog('close');
	});
    }

    describeBuilding(name) {
	var tmp = new game.BUILDING_TYPES[name]();
	$('#info-dialog').dialog('option', 'title',
				 'Building: ' + tmp.name);
	$('#info-dialog-descr').html(tmp.descr);
	this.open();
    }

    describeResource(name) {
	var resType = game.RESOURCE_TYPES[name];
	if (resType === undefined) {
	    console.log('unknown resource: ' + name);
	    return;
	}

	$('#info-dialog').dialog('option', 'title',
				 'Resource: ' + resType.name);
	$('#info-dialog-descr').html(resType.descr);
	this.open();
    }

    open() { $('#info-dialog').dialog('open'); }
}

var infoDialog = new InfoDialog();
