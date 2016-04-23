class AssertionError extends Error

assert = (cond) ->
    if not cond
        throw new AssertionError()


INITIAL_BUDGET = 1000000000
YEARLY_GRANT = 100000000
RESTOCK_MAX_CONTENT_COST = 2000000


RESOURCE_TYPES = {}

class ResourceType
   constructor: (args) ->
        {@name, @symbol, @descr, @cost, @visible = false} = args
        if RESOURCE_TYPES[@name]?
            console.warn "Overwriting resource named #{@name}"
        RESOURCE_TYPES[@name] = this

class ResourceState
    constructor: (args) ->
        {@type, @qty, @limit = null} = args
        @users = []

    beginTurn: ->
        @users = []
        @limit = null

    addStorage: (qty) ->
        @limit ?= 0
        @limit += qty

    provide: (qty, why) ->
        @users.push
            qty: qty
            why: why

    use: (qty, why) -> @provide(-qty, why)

    endTurn: ->
        for {qty, why} in @users
            console.log "Resource #{@type.name}: #{qty}: #{why}"
            if @limit? and (@qty + qty) >= @limit
                console.log "Resource @{@type.name}: exceeded #{@qty + qty} >= #{@limit}"
                break
            @qty += qty


BUILDING_TYPES = {}

registerBuildingType = (cls) ->
    console.log "REGISTERING BUILDING TYPE #{cls.name}"
    BUILDING_TYPES[cls.name] = cls

registerBuildingTypes = (clss) ->
    registerBuildingType(cls) for cls in clss


class Building
    constructor: (args) ->
        console.log "Building constructor", args
        default_img_name = @constructor.name.toLowerCase()
        {@name, @image = default_img_name,
         @pos, @size = [1,1], @descr,
         @deliver_countdown = 1,
         @cost} = args

        @active = false

    declareResources: (game) ->
    offerStorage: (game) ->
    beginTurn: (game) ->
    endTurn: (game) ->
        if @deliver_countdown > 0
            @deliver_countdown -= 1
            if @deliver_countdown <= 0
                @active = true

    use: (game, res, qty, why) ->
        why ?= "#{@name} used #{qty}"
        game.resources[res].use qty, why

    provide: (game, res, qty, why) ->
        why ?= "#{@name} provided #{qty}"
        game.resources[res].provide qty, why


class Map
    constructor: (@width, @height) ->
        @m =
            for i in [0 .. @width - 1]
                for j in [0 .. @height - 1]
                    resources: {}
                    building: null

    get: (x, y) ->
        assert (x < @width)
        assert (y < @height)
        return @m[x][y]

    placeBuilding: (building, pos) ->
        [w, h] = building.size
        [px, py] = pos

        for i in [px .. px+w-1]
            for j in [py .. py+h-1]
                if @m[i][j].building?
                    console.error "already a building at #{i}×#{j} (a #{@m[i][j].building.name})"
                    return

        building.pos = pos
        for i in [px .. px+w-1]
            for j in [py .. py+h-1]
                @m[i][j].building = building


class Game
    constructor: () ->
        @map = new Map 50, 50
        @buildings = []
        @resources = {}

        # PROPERTY: There must be exactly 1 ResourceState object for
        #           each resource type
        for name, restype of RESOURCE_TYPES
            @resources[name] = new ResourceState type: restype, qty: 0

        @resources.Soldi.qty = INITIAL_BUDGET

        @beginTurn()

    beginTurn: ->
        for name, res of @resources
            res.beginTurn()

        for b in @buildings
            b.beginTurn(this)

        for b in @buildings
            if b.active
                b.offerStorage(this)

        for b in @buildings
            if b.active
                # will call `requestRes` and/or `provideRes`
                b.declareResources(this)

    queueBuild: (type, where, args...) ->
        if typeof type == 'string'
            type = BUILDING_TYPES[type]

        building = new type(args...)
        @map.placeBuilding building, where
        @buildings.push building

        building

    endTurn: ->
        for b in @buildings
            b.endTurn(this)

        for name, res of @resources
            res.endTurn()

## Resource Types: these objects are automatically inserted in a global map
##        upon construction
new ResourceType
    name: "Energia", symbol: "", visible: true,
    cost: 100,
    descr: """ Risorsa fondamentale per l'alimentazione di qualsiasi struttura. È
possibile ricavarla attraverso i "Pannelli solari".

Nonostante le tempeste di sabbia l'energia solare è la soluzione più
conveniente per marte rispetto al nucleare. L'irraggiamento solare è
di circa 500 W/m2, e i panneli solari ne possono convertire in energia
elettrica fino al 25%
[http://www.universetoday.com/21293/despite-dust-storms-solar-power-is-best-for-mars-colonies/]
"""

new ResourceType
    name: "Acqua", symbol: "", visible: true,
    cost: 100,
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
    name: "Cibo", symbol: "", visible: true,
    cost: 100,
    descr: """Risorsa importantissima per permettere la sopravvivenza degli
astronauti.

La produzione di cibo localmente è necessaria per una possibile
colonizzazione del pianeta, e per rendere gli astronauti più
indipendenti dalla terra
[http://www.mars-one.com/faq/health-and-ethics/will-the-astronauts-have-enough-water-food-and-oxygen]
"""

new ResourceType
    name: "Ossigeno", symbol: "", visible: true,
    cost: 100,
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
    name: "Ricambi", symbol: "", visible: true,
    descr: """Risorsa utile alle "Officine" per permettere le
riparazioni delle varie strutture. Possono essere fornite soltanto
dalla Terra. """

new ResourceType
    name: "Astronauti", symbol: "", visible: true,
    descr: """Permettono di eseguire gli esperimenti e le
riparazioni. Una persona in media consuma circa 800 kg di cibo e 800
litri di acqua all'anno.  """

new ResourceType
    name: "Soldi", symbol: "", visible: true,
    descr: """I finanziamenti ottenunti per la missione. Aumentano di
una quantità fissa ogni anno e grazie agli esperimenti eseguiti.  """


# invisible resources
new ResourceType
    name: "AcquaConsumata", symbol: "",


## Building types: these objects are automatically inserted in a global map
##                 upon construction

class Hub extends Building
    constructor: (args) ->
        super
            name: "Hub"
            size: [2, 2]
            cost: 1500000,
            descr: """Il posto che permette agli Astronauti di vivere.

            Una possibile idea è di realizzare una struttura ricoperta
            dal terreno di Marte per migliorare la coibentazione e per
            migliorare la protezione dalle radiazioni solari
            [https://en.wikipedia.org/wiki/Mars_habitat]
            [http://www.telegraph.co.uk/technology/picture-galleries/11896687/Top-10-Mars-habitats-from-NASA-space-habitat-challenge.html?frame=3456038]
            """,
        {@population = 0} = args

    declareResources: (game) ->
        @use game, 'Energia', (100 + 500 * @population),
            "Human population in hub (#{@population})"

    declareStorage: (game) ->
        game.resources.Astronauta.addStorage(10)


class Magazzino extends Building
    constructor: (args) ->
        super
            name: "Magazzino"
            cost: 1000000,
            size: [3, 3]
            descr: """ Il magazzino permette di immagazzinare le risorse
                (1000000 kWh di Energia, 10000 litri d'acqua, 10000 kg
                di cibo, 10000 kg di ossigeno, 100000 $ di ricambi)
                """
        @storage =
            Energia: 0
            Acqua: 0
            Cibo: 0
            Ossigeno: 0
            Ricambi: 0

    declareResources: (game) ->
        for name, qty of @storage
            game.resources[name].provide(qty)

    offerStorage: (game, res) ->
        CAPACITY =
            Energia: 1000000
            Acqua: 10000
            Cibo: 10000
            Ossigeno: 10000
            Ricambi: 100000
        for name, cap of CAPACITY
            game.resources[name].addStorage(cap)


class Officina extends Building
    ## TODO Max $10000 of repair costs per turn
    constructor: (args) ->
        super
            name: "Officina"
            cost: 1000000,
            size: [1, 2]
            descr: """
                L'officina permette la riparazione delle varie
                strutture. Richiede la presenza di astronauti per
                funzionare, e può gestire al massimo 10000 $ di
                ricambi all'anno.  """
            args...

    declareResources: (game) ->
        @use game, 'Energia', 100


class PannelloSolare extends Building
    constructor: (args) ->
        super
            name: "Pannello solare"
            cost: 10000,
            size: [1,1]
            descr: """
                Ogni cella genera 500 kWh di energia all'anno. I
                pannelli solari prodotti per marte sono ad altissima
                efficienza. devono essere resistenti alle tempeste di
                sabbia di Marte. In base all'irraggiamento di marte
                possono arrivare a produrre fino a 120
                W/m2. [http://www.universetoday.com/21293/despite-dust-storms-solar-power-is-best-for-mars-colonies/]
                """
            args...

    declareResources: (game) ->
        @provide game, 'Energia', 500

class EstrattoreAcqua extends Building
    constructor: (args) ->
        super
            name: "Estrattore acqua"
            cost: 50000,
            size: [1, 1]
            descr: """
                Genera 100 litri d'acqua all'anno. L'acqua su marte è
                presente nel sottosuolo sottoforma di ghiaccio
                [http://www.astrocupola.it/2013/12/estrarre-lacqua-su-marte/]
                """

    declareResources: (game) ->
        @use game, 'Energia', 100
        @provide game, 'Acqua', 100

class RiciclatoreAcqua extends Building
    constructor: (args) ->
        super
            name: "Riciclatore acqua"
            cost: 80000,
            size: [1, 1]
            descr: """
                Il riciclatore è in grado di riciclare il 90%
                dell'acqua consumata. Sulla ISS sono già presenti
                sistemi di riciclo e recupero dell'acqua sporca e
                urine.
                [http://www.focus.it/scienza/spazio/gli-astronauti-nasa-sulla-iss-bevono-urina-riciclata]
                """

    declareResources: (game) ->
        waste_qty = game.resources.AcquaConsumata.qty
        @provide game, 'Acqua', (0.9 * waste_qty)
        @use game, 'Energia', 100


class Serra extends Building
    constructor: (args) ->
        super
            name: "Serra"
            size: [2, 1]
            cost: 1000000
            descr: """
                La serra permette di coltivare e produre
                1000 kg di cibo consumando 500 litri di acqua e 10000
                kWh di energia all'anno per gli astronauti.

                Per ottimizzare la produzione si può sfruttare la
                coltivazione idroponica.
                [https://it.wikipedia.org/wiki/Idroponica]
                """

    declareResources: (game) ->
        @use game, 'Acqua', 500
        @use game, 'Energia', 10000
        @provide game, 'Cibo', 100

class Oxygenator extends Building
    constructor: (args) ->
        super
            name: "Oxygenator"
            cost: 50000
            size: [1, 1]
            descr: """
                L'ossigeneratore utilizza l'elettrolisi per produrre
                ossigeno partedo da acqua e energia. Per ogni 500
                litri d'acqua e 100kWh di energia produce 100 kg di
                ossigeno.
                [https://it.wikipedia.org/wiki/Elettrolisi]
                """
    declareResources: (game) ->
        @use game, 'Acqua', 500
        @use game, 'Energia', 1000
        @provide game, 'Ossigeno', 1000


class EsperEcopoiesi extends Building
    constructor: (args) ->
        super
            name: "Esperimento Ecopoiesi"
            cost: 1000000
            size: [1,1]
            descr: """
                L'ecopoiesi è un esperimento per valutare la
                possibilità di fabbricare un ecosistema su un pianeta
                senza vita e sterile.
                [https://www.nasa.gov/content/mars-ecopoiesis-test-bed/#.Vxul4TCLTIU]
                """

    declareResources: (game) ->
        @provide game, 'Soldi', 100000
        @use game, 'Acqua', 700
        @use game, 'Energia', 1000


class EsperTerreno extends Building
    constructor: (args) ->
        super
            name: "Studio del terreno"
            size: [1,1]
            cost: 500000
            descr: """
                Gli esperimenti eseguiti servono per studiare la
                composizione chimica del terreno di marte.
                [http://www.nasa.gov/feature/can-plants-grow-with-mars-soil]
                """

    declareResources: (game) ->
        @provide game, 'Soldi', 50000
        @use game, 'Energia', 1000


class EsperGenerico extends Building
    constructor: (args) ->
        super
            name: "Esperimenti tecnologici e scientifici"
            size: [1,1]
            cost: 200000
            descr: """
                Molti esperimenti hanno bisogno di particolari
                condizioni di pressione e gravità per essere
                eseguiti. Questa struttura sfrutta le condiioni di
                marte.
                [http://www.nasa.gov/mission_pages/msl/index.html]
                """

    declareResources: (game) ->
        @provide game, 'Soldi', 10000
        @use game, 'Energia', 500

registerBuildingTypes [
    Hub,
    Magazzino,
    Officina,
    PannelloSolare,
    EstrattoreAcqua,
    RiciclatoreAcqua,
    Serra,
    Oxygenator,
    EsperEcopoiesi,
    EsperTerreno,
    EsperGenerico,
]


module.exports = {
    RESOURCE_TYPES, BUILDING_TYPES, assert, AssertionError,
    ResourceType, ResourceState, Building, Map, Game, Hub, Magazzino,
    Officina, PannelloSolare, EstrattoreAcqua, RiciclatoreAcqua,
    Serra, Oxygenator, EsperEcopoiesi, EsperTerreno, EsperGenerico,
}
