game = require './game'

assert = game.assert
g = new game.Game()

building = g.queueBuild 'Serra', [3, 3]
[w, h] = building.size
for x in [3, 3 + w - 1]
    for y in [3, 3 + h - 1]
        assert (building == g.map.get(x,y).building)

assert not building.active
g.endTurn()
g.beginTurn()
assert building.active


console.log " --- before building experiment"
for name, res of g.resources
    console.log "\t#{name}: #{res.qty}"

exper = g.queueBuild 'EsperGenerico', [3,4]
g.endTurn()
g.beginTurn()
g.endTurn()
g.beginTurn()
g.endTurn()
console.log " --- after building experiment"
for name, res of g.resources
    console.log "\t#{name}: #{res.qty}"
    console.log user for user in res.users
