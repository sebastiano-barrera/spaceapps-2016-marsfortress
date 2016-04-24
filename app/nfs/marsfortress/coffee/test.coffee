
game = require './game'

console.log game.BUILDING_TYPES

g = new game.Game()

building = g.build 'Serra', [3, 3]
[w, h] = game.BUILDING_TYPES['Serra'].size
for x in [3, 3 + w - 1]
    for y in [3, 3 + h - 1]
        assert (building == g.map.get(x,y).building)
