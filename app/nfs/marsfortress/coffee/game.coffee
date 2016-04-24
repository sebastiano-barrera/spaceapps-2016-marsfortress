class AssertionError extends Error

assert =  (cond) ->
    if not cond
        throw new AssertionError()

## TODO
# - Each resource has an upper limit which depends on the available
#   structures and technology

RESOURCE_TYPES = {}

class ResourceType
   constructor: (args) ->
        {@name, @symbol, @descr} = args
        if RESOURCE_TYPES[@name]?
            console.warn "Overwriting resource named #{@name}"
        RESOURCE_TYPES[@name] = this


class ResourceState
    constructor: (args) ->
        {@type, @qty, @limit = 0} = args
        @balance = []

    clearBalance: ->
        @balance = []

    declare: (qty, why) ->
        @balance.append
            qty: qty
            why: why

    endTurn: ->
        for {qty, why} in @balance
            console.log "Resource #{@type.name}: #{qty}: #{why}"
            @qty += qty


BUILDING_TYPES = {}
class BuildingType
    constructor: (args) ->
        {@name, @image, @size, @declareResources = ((game) ->), @descr} = args
        if BUILDING_TYPES[@name]?
            console.warn "Overwriting resource named #{@name}"
        BUILDING_TYPES[@name] = this


class Building
    constructor: (args) ->
        {@type, @pos} = args
        if typeof @type == 'string'
            # we're given a name
            @type = BuildingType.ALL[@type]
        @descr = @type.descr


class Experiment extends Building
    constructor: (args) ->
        super type: 'Experiment', @pos
        {@experiment} = args


class Map
    constructor: (w, h) ->
        @size = [w, h]
        @m =
            for i in [0 .. @size[0] - 1]
                for j in [0 .. @size[1] - 1]
                    resources: {}
                    building: null

    get: (x, y) ->
        assert (x < @size[0])
        assert (y < @size[1])
        @m[x][y]

    placeBuilding: (building, pos) ->
        [w, h] = building.type.size
        [px, py] = pos

        for i in [px .. px+w-1]
            for j in [py .. py+h-1]
                if @m[i][j].building?
                    console.error "already a building at #{i}×#{j} (a #{@m[i][j].building.type.name})"
                    return

        building.pos = pos
        for i in [px .. px+w-1]
            for j in [py .. py+h-1]
                @m[i][j].building = building


class Game
    constructor: () ->
        @map = new Map 20, 20
        @buildings = []
        @resources = {}

        # PROPERTY: There must be exactly 1 ResourceState object for
        #           each resource type
        for name, restype in RESOURCE_TYPES
            @resources[name] = new ResourceState type: restype, qty: 0

        @_beginTurn()

    _beginTurn: ->
        for name, res in @resources
            res.clearBalance()

        for b in @buildings
            # will call `requestRes` and/or `provideRes`
            b.declareResources(this)

    # These methods are called by Buildings to declare their
    # need/provision of resources for the current turn
    declRes: (typeName, qty, why) ->
        @resources[typeName].declare(qty, why)

    build: (type, where, args...) ->
        if typeof type == 'string'
            type = BUILDING_TYPES[type]

        building = new Building type: type, args...
        @map.placeBuilding building, where
        @buildings.push building

        building

    endTurn: ->
        for name, res in @resources
            res.endTurn()

## Resource Types: these objects are automatically inserted in a global map
##        upon construction
new ResourceType
    name: "Energia", symbol: "",
    descr: """ Risorsa fondamentale per l'alimentazione di qualsiasi struttura. È
possibile ricavarla attraverso i "Pannelli solari".

Nonostante le tempeste di sabbia l'energia solare è la soluzione più
conveniente per marte rispetto al nucleare. L'irraggiamento solare è
di circa 500 W/m2, e i panneli solari ne possono convertire in energia
elettrica fino al 25%
[http://www.universetoday.com/21293/despite-dust-storms-solar-power-is-best-for-mars-colonies/]
"""

new ResourceType
    name: "Acqua", symbol: "",
    descr: """Risorsa necessaria per la sopravvivenza di astronauti e per
l'alimentazione di "Serre" e dei "Generatori di ossigeno". Può essere
ricavata dall' "Estrattore dell'acqua" e dal "Riciclatore dell'acqua".

L'acqua è un composto chimico di formula molecolare H2O, in cui i due
atomi di idrogeno sono legati all'atomo di ossigeno con legame
covalente polare. In condizioni di temperatura e pressione normali si
presenta come un sistema bifase – costituito da un liquido incolore e
insapore (che viene chiamato "acqua" in senso stretto) e da un gas
incolore (detto vapore acqueo) – ma anche come un solido (detto
ghiaccio) nel caso in cui la temperatura sia uguale o inferiore alla
temperatura di congelamento. [Wikipedia -
https://it.wikipedia.org/wiki/Acqua]
"""

new ResourceType
    name: "Cibo", symbol: "",
    descr: """Risorsa importantissima per permettere la sopravvivenza degli
astronauti.

La produzione di cibo localmente è necessaria per una possibile
colonizzazione del pianeta, e per rendere gli astronauti più
indipendenti dalla terra
[http://www.mars-one.com/faq/health-and-ethics/will-the-astronauts-have-enough-water-food-and-oxygen]
"""

new ResourceType
    name: "Ossigeno", symbol: "",
    descr: """
Risorsa necessaria la sopravvivenza degli astronauti. L'ossigeno può
essere prodotto separando l'acqua nelle sue componenti attraverso
l'elettrolisi.

The oxygen will be used to provide a breathable atmosphere in the
living units, and a portion will be stored in reserve for conditions
when there is less power available, for example at night, and during
dust storms. The second major component of the living units'
atmosphere, nitrogen, will be extracted directly from the Martian
atmosphere by the life support
unit. [http://www.mars-one.com/faq/health-and-ethics/will-the-astronauts-have-enough-water-food-and-oxygen] """

new ResourceType
    name: "Ricambi", symbol: "",
    descr: """Risorsa utile alle "Officine" per permettere le
riparazioni delle varie strutture. Possono essere fornite soltanto
dalla Terra. """

new ResourceType
    name: "Astronauti", symbol: "",
    descr: """Permettono di eseguire gli esperimenti e le
riparazioni. Una persona in media consuma circa 800 kg di cibo e 800
litri di acqua all'anno.  """

new ResourceType
    name: "Soldi", symbol: "",
    descr: """I finanziamenti ottenunti per la missione. Aumentano di
una quantità fissa ogni anno e grazie agli esperimenti eseguiti.  """


## Building types: these objects are automatically inserted in a global map
##                 upon construction

new BuildingType
    name: "Hub"  # include Habitat
    declareResources: (game) ->
        game.declareRes "Wheat", -10, 'Need some for my fam'
    descr: """
Il posto che permette agli Astronauti di vivere.

Una possibile idea è di realizzare una struttura ricoperta dal terreno
di Marte per migliorare la coibentazione e per migliorare la
protezione dalle radiazioni solari
[https://en.wikipedia.org/wiki/Mars_habitat]
[http://www.telegraph.co.uk/technology/picture-galleries/11896687/Top-10-Mars-habitats-from-NASA-space-habitat-challenge.html?frame=3456038]
p"""

new BuildingType name: "Magazzino"
new BuildingType name: "Officina"
new BuildingType name: "Pannello solare"
new BuildingType name: "Estrattore acqua"
new BuildingType name: "Riciclatore acqua"
new BuildingType name: "Serra", size: [4, 3]
new BuildingType name: "Oxygenator"  # usa acqua ed energia


module.exports = {
    RESOURCE_TYPES, ResourceType, ResourceState,
    BUILDING_TYPES, BuildingType, Building, Experiment,
    Game,
}
