
var G = require('./game');

var game = new G.Game();

var buildings = [];
var i = 0, j = 0;
for (var name in G.BUILDING_TYPES) {
    var cons = G.BUILDING_TYPES[name];
    buildings.push(new cons({pos: [i, j]}));
    i += 3;
    if (i >= game.map.width) {
	i = 0;
	j += 3;
    }
}

function listRes() {
    for (var name in game.resources) {
	var res = game.resources[name];
	console.log(name, res.qty, res.users);
    }
}

game.setRestock({
    buildings: [
	new G.Serra({pos: [1,2]}),
	new G.EstrattoreAcqua({pos: [3,2]}),
	new G.EstrattoreAcqua({pos: [4,2]}),
	new G.EstrattoreAcqua({pos: [5,2]}),
	new G.EstrattoreAcqua({pos: [6,2]}),
	new G.EstrattoreAcqua({pos: [7,2]}),
	new G.PannelloSolare({pos: [1,3]}),
    ]
});
listRes();
game.endTurn();

for (var i=0; i < 10; i++) {
    console.log(" --- ", i);
    game.beginTurn();
    listRes();
    game.endTurn();
}
