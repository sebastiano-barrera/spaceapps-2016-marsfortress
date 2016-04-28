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
	var displayName = mapToEnglish[name] || tmp.name;
	$('#info-dialog').dialog('option', 'title',
				 'Building: ' + displayName);
	$('#info-dialog-descr').html(tmp.descr);
	this.open();
    }

    describeResource(name) {
	var resType = game.RESOURCE_TYPES[name];
	if (resType === undefined) {
	    console.log('unknown resource: ' + name);
	    return;
	}

	var displayName = mapToEnglish[name] || name;
	$('#info-dialog').dialog('option', 'title',
				 'Resource: ' + displayName);
	$('#info-dialog-descr').html(resType.descr);
	this.open();
    }

    open() { $('#info-dialog').dialog('open'); }
}

var infoDialog = new InfoDialog();
