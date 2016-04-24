"use strict";

var _ = require('lodash');

class AssertionError extends Error {}
class GameRulesError extends Error {}

function assert(cond) {
    if (!cond) {
        throw new AssertionError();
    }
}

var INITIAL_BUDGET = 1000000000;
var YEARLY_GRANT = 1000000;
var RESTOCK_MAX_CONTENT_COST = 2000000;
var RESTOCK_COST = 100000000;

var RESOURCE_TYPES = {};

class ResourceType {
    constructor(options) {
        this.name = options.name;
        this.symbol = options.symbol;
        this.descr = options.descr;
        this.cost = options.cost;
        this.visible = options.visible || false;
        this.restockable = options.restockable || true;
        if (RESOURCE_TYPES[this.name] != null) {
            console.warn("Overwriting resource named " + this.name);
        }
        RESOURCE_TYPES[this.name] = this;
    }
}

class ResourceState {
    constructor(options) {
        this.type = options.type;
        this.qty = options.qty;
        this.limit = options.limit;
        this.users = [];
    }

    beginTurn() {
        this.users = [];
        this.limit = null;
    }

    addStorage(qty) {
        if (this.limit == null) {
            this.limit = 0;
        }
        this.limit += qty;
    }

    provide(qty, why) {
        var user = {
            qty: qty,
            why: why
        };
        this.users.push(user);
    }

    use(qty, why) {
        return this.provide(-qty, why);
    }

    check(qty) {
        var result = this.qty + qty;
        if (this.limit != null && result <= this.limit)
	    return false;
	return (result >= 0);
    }

    endTurn() {
        for (var i in this.users) {
            var qty = this.users[i].qty;
            var why = this.users[i].why;
            console.log(`Resource ${this.type.name}: ${qty}: ${why}`);
            if (this.limit != null && (this.qty + qty) >= this.limit) {
                console.log(`Resource ${this.type.name}: exceeded ${this.qty + qty} >= ${this.limit}`);
                break;
            }

            this.qty += qty;
        }
    }

    forecast() {
        var total = 0;
        for (var i in this.users) {
            total += this.users[i].qty;
        }
        return total;
    }
}


var BUILDING_TYPES = {};

function registerBuildingType(cls) {
    BUILDING_TYPES[cls.name] = cls;
};

function registerBuildingTypes(clss) {
    for (var i in clss) {
        registerBuildingType(clss[i]);
    }
}


class Building {
    constructor(options) {
        var default_img_name = this.constructor.name.toLowerCase();
        this.name = options.name;
        this.image = options.image || default_img_name;
        this.pos = options.pos;
        this.size = options.size || [1, 1];
        this.descr = options.descr;
        this.deliver_countdown = options.deliver_countdown || 1;
        this.cost = options.cost;
        this.active = false;
    }

    declareResources() {}

    offerStorage() {}

    beginTurn(game) {}

    endTurn(game) {
        if (this.deliver_countdown > 0) {
            this.deliver_countdown -= 1;
            if (this.deliver_countdown <= 0) {
                this.active = true;
            }
        }
    }

    provide(game) {
        var movements;
        if (typeof arguments[1] == 'string') {
            movements = [[arguments[1], arguments[2], arguments[3]]];
        } else {
            movements = arguments[1];
        }

        for (var i in movements) {
            var move = movements[i];
            var res = move[0], qty = move[1];
            if (!game.resources[res].check(qty))
                return false;
        }

        for (var i in movements) {
            var move = movements[i];
            var res = move[0], qty = move[1], why = move[2];
            if (why == null) why = `${this.name} provided ${qty} ${res}`;
            game.resources[res].provide(qty, why);
        }

        return true;
    }

    use(game) {
        var movements;
        if (typeof arguments[1] == 'string') {
            movements = [[arguments[1], arguments[2], arguments[3]]];
        } else {
            movements = arguments[1];
        }

        movements = _.clone(movements);
        for (var i in movements) {
            // change sign to qty
            movements[i][1] = -movements[i][1];
        }

        return this.provide(game, movements);
    }

    store(stock) {
        return stock;
    }
}

class Map {
    constructor(width, height) {
        var i, j;
        this.width = width;
        this.height = height;
        this.m = [];

        for (var i=0; i < this.height-1; i++) {
            this.m[i] = [];
            for (var j=0; j < this.width-1; j++) {
                this.m[i][j] = {
                    resources: {},
                    building: null
                };
            }
        }
    }

    get(x, y) {
        assert(x < this.width);
        assert(y < this.height);
        return this.m[x][y];
    }

    placeBuilding(building) {
        var w = building.size[0], h = building.size[1],
            px = building.pos[0], py = building.pos[1];

        for (var i=px; i < px+w; i++) {
            for (var j=py; j < py+h; j++) {
                if (this.m[i][j].building != null) {
                    console.error("already a building at ${i}×${j} (a ${this.m[i][j].building.name})");
                    return;
                }
            }
        }

        for (var i=px; i < px+w; i++) {
            for (var j=py; j < py+h; j++) {
                this.m[i][j].building = building;
            }
        }
    }
}

class Game {
    constructor() {
        this.map = new Map(50, 50);
        this.buildings = [];
        this.resources = {};
        this.restock = null;

        for (var name in RESOURCE_TYPES) {
            var restype = RESOURCE_TYPES[name];
            this.resources[name] = new ResourceState({
                type: restype,
                qty: 0
            });
        }

        this.resources.Soldi.qty = INITIAL_BUDGET;
        this.beginTurn();

        this.logger = function() {};
    }

    setLogger(logger) { this.logger = logger; }

    beginTurn() {
        if (this.restock != null && this.restock.resources != null) {
            this._acquireRestockContent(this.restock.resources);
        }
        this.restock = null;

        for (var name in this.resources) {
            this.resources[name].beginTurn();
        }

        for (var i in this.buildings) {
            this.buildings[i].beginTurn(this);
        }

        for (var i in this.buildings) {
            var b = this.buildings[i];
            if (b.active) {
                b.offerStorage(this);
            }
        }

        for (var i in this.buildings) {
            var b = this.buildings[i];
            if (b.active) {
                b.declareResources(this);
            }
        }
    }

    _acquireRestockContent(restock) {
        this.logger('distributing restock');
        var rem = restock;
        for (var i in this.buildings) {
            rem = this.buildings[i].store(rem);
        }

        for (var name in rem) {
            this.logger(`${name} -> ${rem[name]}`);
            if (rem[name] > 0) {
                this.logger("${rem[name]} unità di ${name} sono state scartate dall'ultimo rifornimento per insufficienza di spazio d'immagazzinamento");
            }
        }
    }

    queueBuild() {
        var type = arguments[0];
        var where = arguments[1];
        var args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        if (typeof type === 'string') {
            type = BUILDING_TYPES[type];
        }

        var building = type.apply(args);
        // var building = (function(func, args, ctor) {
        //     ctor.prototype = func.prototype;
        //     var child = new ctor, result = func.apply(child, args);
        //     return Object(result) === result ? result : child;
        // })(type, args, (){});

        this.map.placeBuilding(building, where);
        this.buildings.push(building);
        return building;
    };

    forecastStorageSpace() {
        var result = {};
        for (var i in this.resources) {
            var res = this.resources[i];
            if (res.limit != null) {
                result[res.type.name] = res.limit - res.forecast();
            }
        }
        return result;
    }

    setRestock(restock) {
        var total_cost = 0;
        var storage_space = this.forecastStorageSpace();
        var any_issues = false;

        this.restock = null;

        this.logger('evaluating restock');

        for (var name in restock.resources) {
            var qty = restock.resources[name];
            var restype = RESOURCE_TYPES[name];
            if (!restype.restockable) {
                this.logger("La risorsa ${restype.name} non può essere acquisita da rifornimenti dalla Terra");
                any_issues = true;
            }

            total_cost += restype.cost * qty;
            if (total_cost > RESTOCK_MAX_CONTENT_COST) {
                this.logger("Il piano di rifornimenti eccede il costo massimo ($" + RESTOCK_MAX_CONTENT_COST + ")");
                any_issues = true;
            }

            if (storage_space[name] != null && storage_space[name] < qty) {
                this.logger("Si prevede che non ci sarà spazio sufficiente per immagazinare la risorsa richiesta (${qty} > ${storage_space[name]}). La parte in eccesso andrà persa.");
                any_issues = true;
            }
        }

        for (var i in restock.buildings) {
            var building = restock.buildings[i];

            total_cost += building.cost;
            if (total_cost > RESTOCK_MAX_CONTENT_COST) {
                this.logger("Il piano di rifornimenti eccede il costo massimo ($${RESTOCK_MAX_CONTENT_COST})");
                any_issues = true;
            }

            /// DEMO DRIVEN DEVELOPMENT AT WORK
            // These two lines of code don't belong here
            this.map.placeBuilding(building);
            this.buildings.push(building);
        }

        if (!any_issues)
            this.restock = restock;

        return (!any_issues);
    }

    endTurn() {
        for (var i in this.buildings) {
            this.buildings[i].endTurn(this);
        }

        for (var name in this.resources) {
            this.resources[name].endTurn();
        }

        this.resources.Soldi.qty += YEARLY_GRANT;
        if (this.restock != null && this.restock.buildings != null) {
            this.resources.Soldi.qty -= RESTOCK_COST;
            for (var i in this.restock.buildings) {
                var b = this.restock.buildings[i];
                this.resources.Soldi.qty -= b.cost;
            }
        }
    }
}

// Resource Types: these objects are automatically inserted in a global map
//                 upon construction
new ResourceType({
    name: "Energia",
    symbol: "",
    visible: true,
    cost: 100,
    descr: " Risorsa fondamentale per l'alimentazione di qualsiasi struttura. È\npossibile ricavarla attraverso i \"Pannelli solari\".\n\nNonostante le tempeste di sabbia l'energia solare è la soluzione più\nconveniente per marte rispetto al nucleare. L'irraggiamento solare è\ndi circa 500 W/m2, e i panneli solari ne possono convertire in energia\nelettrica fino al 25%\n[http://www.universetoday.com/21293/despite-dust-storms-solar-power-is-best-for-mars-colonies/]"
});

new ResourceType({
    name: "Acqua",
    symbol: "",
    visible: true,
    cost: 100,
    descr: "Risorsa necessaria per la sopravvivenza di astronauti e per\nl'alimentazione di \"Serre\" e dei \"Generatori di ossigeno\". Può essere\nricavata dall' \"Estrattore dell'acqua\" e dal \"Riciclatore dell'acqua\".\n\nL'acqua è un composto chimico di formula molecolare H2O, in cui i due\natomi di idrogeno sono legati all'atomo di ossigeno con legame\ncovalente polare. In condizioni di temperatura e pressione normali si\npresenta come un sistema bifase – costituito da un liquido incolore e\ninsapore (che viene chiamato \"acqua\" in senso stretto) e da un gas\nincolore (detto vapore acqueo) – ma anche come un solido (detto\nghiaccio) nel caso in cui la temperatura sia uguale o inferiore alla\ntemperatura di congelamento. [Wikipedia -\nhttps://it.wikipedia.org/wiki/Acqua]"
});

new ResourceType({
    name: "Cibo",
    symbol: "",
    visible: true,
    cost: 100,
    descr: "Risorsa importantissima per permettere la sopravvivenza degli\nastronauti.\n\nLa produzione di cibo localmente è necessaria per una possibile\ncolonizzazione del pianeta, e per rendere gli astronauti più\nindipendenti dalla terra\n[http://www.mars-one.com/faq/health-and-ethics/will-the-astronauts-have-enough-water-food-and-oxygen]"
});

new ResourceType({
    name: "Ossigeno",
    symbol: "",
    visible: true,
    cost: 100,
    descr: "Risorsa necessaria la sopravvivenza degli astronauti. L'ossigeno può\nessere prodotto separando l'acqua nelle sue componenti attraverso\nl'elettrolisi.\n\nThe oxygen will be used to provide a breathable atmosphere in the\nliving units, and a portion will be stored in reserve for conditions\nwhen there is less power available, for example at night, and during\ndust storms. The second major component of the living units'\natmosphere, nitrogen, will be extracted directly from the Martian\natmosphere by the life support\nunit. [http://www.mars-one.com/faq/health-and-ethics/will-the-astronauts-have-enough-water-food-and-oxygen] "
});

new ResourceType({
    name: "Ricambi",
    symbol: "",
    visible: true,
    descr: "Risorsa utile alle \"Officine\" per permettere le\nriparazioni delle varie strutture. Possono essere fornite soltanto\ndalla Terra. "
});

new ResourceType({
    name: "Astronauti",
    symbol: "",
    visible: true,
    descr: "Permettono di eseguire gli esperimenti e le\nriparazioni. Una persona in media consuma circa 800 kg di cibo e 800\nlitri di acqua all'anno.  "
});

new ResourceType({
    name: "Soldi",
    symbol: "",
    visible: true,
    descr: "I finanziamenti ottenunti per la missione. Aumentano di\nuna quantità fissa ogni anno e grazie agli esperimenti eseguiti.  ",
    restockable: false,
});

new ResourceType({
    name: "AcquaConsumata",
    symbol: "",
    restockable: false,
});


// Building types: these objects are automatically inserted in a global map
//                 upon construction

class Hub extends Building {
    constructor(args) {
        super(_.extend({
            name: "Hub",
            size: [2, 2],
            cost: 1500000,
            descr: "Il posto che permette agli Astronauti di vivere.\n\nUna possibile idea è di realizzare una struttura ricoperta\ndal terreno di Marte per migliorare la coibentazione e per\nmigliorare la protezione dalle radiazioni solari\n[https://en.wikipedia.org/wiki/Mars_habitat]\n[http://www.telegraph.co.uk/technology/picture-galleries/11896687/Top-10-Mars-habitats-from-NASA-space-habitat-challenge.html?frame=3456038]"
        }, args));

        this.population = 0;
        this.capacity = 10;
    }

    declareResources(game) {
        var ok = this.use(game, [
            ['Energia', 100 + 500 * this.population,
                `Human population in hub (${this.population})`],
            ['Acqua', 800 * this.population,
                `Human population in hub (${this.population})`],
            ['Cibo', 800 * this.population,
                `Human population in hub (${this.population})`],
            ['Ossigeno', 300 * this.population,
                `Human population in hub (${this.population})`]
        ]);

        if (!ok) {
            // Now I am become Death, destroyer of worlds.
            this.population = 0;
        }
    }

    declareStorage(game) {
        game.resources.Astronauta.addStorage(10);
    }

    store(stock) {
        var taken = Math.min(stock.Astronauta, this.capacity - this.population);
        this.population += stock.Astronauta;
        var remaining = _.clone(stock);
        remaining.Astronauta = stock.Astronauta - taken;
        return remaining;
    }
}


class Magazzino extends Building {
    constructor(args) {
        super(_.extend({
            name: "Magazzino",
            cost: 1000000,
            size: [3, 3],
            descr: " Il magazzino permette di immagazzinare le risorse\n(1000000 kWh di Energia, 10000 litri d'acqua, 10000 kg\ndi cibo, 10000 kg di ossigeno, 100000 $ di ricambi)"
        }, args));

        this.storage = {
            Energia: 0,
            Acqua: 0,
            Cibo: 0,
            Ossigeno: 0,
            Ricambi: 0
        };

        this.capacity = {
            Energia: 1000000,
            Acqua: 10000,
            Cibo: 10000,
            Ossigeno: 10000,
            Ricambi: 100000
        };
    }

    offerStorage(game) {
        for (var name in this.capacity) {
            var cap = this.capacity[name];
            game.resources[name].addStorage(cap);
        }
    }

    store(stock) {
        var remaining;
        for (var name in stock) {
            var in_storage = this.storage[name];
            var taken = 0;
            if (in_storage != null) {
                taken = Math.min(stock[name], this.capacity[name] - this.in_storage);
            }
            this.storage[name] += taken;
            remaining[name] = stock[name] - taken;
        }
        return remaining;
    }
}

class Officina extends Building {
    constructor(args) {
        super(_.extend({
            name: "Officina",
            cost: 1000000,
            size: [2, 1],
            descr: "The maintenance building allows for repairing various structures and buildings. Its operation requires an astronaut's presence, and allows for a maximum of $10000 of repairs per year"
        }, args));
    }

    declareResources(game) {
        this.use(game, 'Energia', 100);
    }
}

class PannelloSolare extends Building {
    constructor(args) {
        super(_.extend({
            name: "Pannello solare",
            cost: 10000,
            size: [1, 1],
            descr: "A single solar panel array may produce up to 500 kWh per year. Solar panels sent to Mars are of the highest possible efficieny, and need to resist Mars' sandstorms (laying sand on the panels). Depending on Mars' irradiation, the efficiency may get as high as 120 W/m^2. [http://www.universetoday.com/21293/despite-dust-storms-solar-power-is-best-for-mars-colonies/]"
        }, args));
    }

    declareResources(game) {
        this.provide(game, 'Energia', 5000);
    }
}

class EstrattoreAcqua extends Building {
    constructor(args) {
        super(_.extend({
            name: "Estrattore acqua",
            cost: 50000,
            size: [1, 1],
            descr: "A water extractor may extract as many as 100L of water per year. Water on Mars is frozen and mixed with soil. [http://www.astrocupola.it/2013/12/estrarre-lacqua-su-marte/]"
        }, args));
    }

    declareResources(game) {
        if (this.use(game, 'Energia', 100))
            this.provide(game, 'Acqua', 100);
    }
}

class RiciclatoreAcqua extends Building {
    constructor(args) {
        super(_.extend({
            name: "Riciclatore acqua",
            cost: 80000,
            size: [1, 1],
            descr: "The water recovery system may recycle up to 90% of the total collected water. An identical system is already being used on the ISS, allowing for recovery of water from sweat, urine, and much more. [http://www.focus.it/scienza/spazio/gli-astronauti-nasa-sulla-iss-bevono-urina-riciclata]"
        }, args));
    }

    declareResources(game) {
        var waste_qty = game.resources.AcquaConsumata.qty;
        if (this.use(game, 'Energia', 100))
            this.provide(game, 'Acqua', 0.9 * waste_qty);
    }
}

class Serra extends Building {
    constructor(args) {
        super(_.extend({
            name: "Serra",
            size: [2, 1],
            cost: 1000000,
            descr: "The greenhouse allows for planting and growing almost 1000kg of food for the astronauts, using 500L of water and 1000 kWh of energy. Food production may be optimized by introducing an aquaponic system.[https://it.wikipedia.org/wiki/Idroponica]"
        }, args));
    }

    declareResources(game) {
        var ok = this.use(game, [
            ['Acqua', 500],
            ['Energia', 1000],
        ]);
        if (ok) this.provide(game, 'Cibo', 1000);
    }
}

class Oxygenator extends Building {
    constructor(args) {
        super(_.extend({
            name: "Oxygenator",
            cost: 50000,
            size: [1, 1],
            descr: "The oxygenator uses water hydrolysis for producing oxygen. Using 500L of water and 100kWh of energy, it may roughly produce 400kg of oxygen. [https://it.wikipedia.org/wiki/Elettrolisi]"
        }, args));
    }

    declareResources(game) {
        if (this.use(game, [['Acqua', 500],
                            ['Energia', 1000]]))
            this.provide(game, 'Ossigeno', 1000);
    }
}

class EsperEcopoiesi extends Building {
    constructor(args) {
        super(_.extend({
            name: "Esperimento Ecopoiesi",
            cost: 1000000,
            size: [1, 1],
            descr: "Ecopoiesis is an experiment aiming to analyse the feasability of engineering an ecosystem on a dead planet. [https://www.nasa.gov/content/mars-ecopoiesis-test-bed/#.Vxul4TCLTIU]"
        }, args));
    }

    declareResources(game) {
        if (this.use(game, [['Acqua', 700],
                            ['Energia', 1000]]))
            this.provide(game, 'Soldi', 100000);
    }
}

class EsperTerreno extends Building {
    constructor(args) {
        super(_.extend({
            name: "Studio del terreno",
            size: [1, 1],
            cost: 500000,
            descr: "Soil analysis experiments are required to find out the chemical composition of the martian soil.[http://www.nasa.gov/feature/can-plants-grow-with-mars-soil]"
        }, args));
    }

    declareResources(game) {
        if (this.use(game, 'Energia', 1000))
            this.provide(game, 'Soldi', 50000);
    }
}

class EsperGenerico extends Building {
    constructor(args) {
        super(_.extend({
            name: "Esperimenti tecnologici e scientifici",
            size: [1, 1],
            cost: 200000,
            descr: "Many other experiments may be designed and carried out on Mars: its unique characteristics make it ideal for many different fields. [http://www.nasa.gov/mission_pages/msl/index.html]"
        }, args));
    }

    declareResources(game) {
        if (this.use(game, 'Energia', 500))
            this.provide(game, 'Soldi', 10000);
    }
}

registerBuildingTypes([
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
    EsperGenerico
]);

module.exports = {
    RESOURCE_TYPES: RESOURCE_TYPES,
    BUILDING_TYPES: BUILDING_TYPES,
    assert: assert,
    AssertionError: AssertionError,
    ResourceType: ResourceType,
    ResourceState: ResourceState,
    Building: Building,
    Map: Map,
    Game: Game,
    Hub: Hub,
    Magazzino: Magazzino,
    Officina: Officina,
    PannelloSolare: PannelloSolare,
    EstrattoreAcqua: EstrattoreAcqua,
    RiciclatoreAcqua: RiciclatoreAcqua,
    Serra: Serra,
    Oxygenator: Oxygenator,
    EsperEcopoiesi: EsperEcopoiesi,
    EsperTerreno: EsperTerreno,
    EsperGenerico: EsperGenerico,
};
