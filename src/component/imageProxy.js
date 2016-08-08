ymaps.modules.define('heatmap.component.ImageProxy', [
    'util.imageLoader', 'vow'
], function (provide, imageLoader, vow) {

    var lookupStorage = {};

    imageLoader.proxy.add({
        matchUrl: function (url) {
            if (url && url.indexOf('ym-heatmap') === 0) {
                return 1;
            }
        },
        load: function (url, request) {
            var params = {};
            url.split('/').forEach(function (row) {
                var line = row.split('=');
                params[line[0]] = line[1];
            });
            if (params.mid && lookupStorage[params.mid]) {
                return vow.resolve(lookupStorage[params.mid].getTileImage([+params.x, +params.y], +params.z));
            } else {
                return vow.reject();
            }

        }
    });

    provide({
        lookup: lookupStorage
    });
}); 