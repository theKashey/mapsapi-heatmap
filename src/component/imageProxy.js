ymaps.modules.define('heatmap.component.ImageProxy', [
    'util.imageLoader', 'vow'
], function (provide, imageLoader, vow) {

    imageLoader.proxy.add({
        matchUrl: function (url) {
            if (url && url.ym_heatmap) {
                return 1;
            }
        },
        load: function (url, request) {
            return vow.resolve(url.canvas.generateDataURLHeatmap(url.points));
        }
    }); 

    provide(true);
}); 