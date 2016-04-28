var mapToEnglish = {
    'Energia': 'Energy',
    'Acqua': 'Water',
    'Cibo': 'Food',
    'Ossigeno': 'Oxygen',
    'Ricambi': 'Spare parts',
    'Astronauti': 'Astronauts',
    'Soldi': 'Money',

    'Hub': "Hab",
    'Magazzino': "Warehouse",
    'Officina': "Workshop",
    'PannelloSolare': "Solar panel",
    'EstrattoreAcqua': "Water extractor",
    'RiciclatoreAcqua': "Water reclaimer",
    'Serra': "Greenhouse",
    'Oxygenator': "Oxygenerator",
    'EsperEcopoiesi': "Mars Ecopoiesis Test Bed Project",
    'EsperTerreno': "Soil analysis experiment",
    'EsperGenerico': "Generic experiment",

};

var resCoordinates = {};

function drawResources() {
    i = 20;
    ctx.font = "15px Monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText('------ RESOURCES -------',10,20);
    for(k in g.resources) {
        v = g.resources[k];
        if(k == 'AcquaConsumata')
            continue;
        //if (v.visible === true) {
            name = mapToEnglish[k] || name;
            fname = k.toLowerCase();
            if(name.length < 12)
                name = (name + "           ").slice(0,12);
            spawnImageRaw("r_" + fname, 15, 2 + i, 24, 24, 1);
            ctx.fillText(name + ": " + v.qty,50,20 + i);

	if (resCoordinates[k] === undefined) {
	    resCoordinates[k] = {
		x: 15, y: 2+i,
		width: 300, height: 24,
	    };
	}


            i += 30;
        //}

    };
}

log = ['Welcome, budding colonizer!'];

function logEvent(text) {
    if(log.length >= 10)
        log = log.splice(-9);
    log.push(text);
}
function drawLogger() {
    ctx.font = "15px Monospace";
    ctx.fillStyle = "#fff";
    h = window.innerHeight;
    i = h - 20 - 20 * 9;
    ctx.fillText('------- EVENTS -------',10,i-20);
    for(l in log) {
        ctx.fillText(log[l],20,i);
        i += 20;
    }
}

function drawHud() {
    drawResources();
    drawLogger();
}
