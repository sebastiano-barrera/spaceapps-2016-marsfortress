$(document).ready(function() {
    var game = require('/game.js');

    var g = new game.Game();

    var serra = g.build('Serra', [5, 5]);

    serra.type.image = 'serra';

    loadImage(serra.type.name, 5, 5, serra.type.size[0], serra.type.size[1]);

});
