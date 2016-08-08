/**
 * Heatmap tiles generator module.
 * @module heatmap.component.TileUrlsGenerator
 * @requires option.Manager
 * @requires heatmap.component.Canvas
 */
ymaps.modules.define('heatmap.component.TileUrlsGenerator', [
    'option.Manager',
    'heatmap.component.Canvas',
    'heatmap.component.ImageProxy'
], function (provide,
             OptionManager,
             HeatmapCanvas,
             ImageProxy) {
    /**
     * Heatmap tile size.
     */
    var TILE_SIZE = [256, 256],
        heatMapID = 0;

    var dataLookup = ImageProxy.lookup;
    /**
     * @public
     * @function TileUrlsGenerator
     * @description Heatmap tiles generator constructor.
     *
     * @param {IProjection} projection Projection.
     * @param {Number[][]} points Points provided as geographical coordinates.
     */
    var TileUrlsGenerator = function (projection, points) {
        this._projection = projection;
        this.heatMapID = heatMapID++;
        dataLookup[this.heatMapID] = this;

        this._canvas = new HeatmapCanvas(TILE_SIZE);
        this.options = new OptionManager({});
        this._canvas.options.setParent(this.options);

        this.setPoints(points || []);
    };

    /**
     * @public
     * @function setPoints
     * @description Sets array points to render.
     *
     * @param {Number[][]} points Array of points provided as geographical coordinates.
     * @returns {TileUrlsGenerator} Tile URLs generator.
     */
    TileUrlsGenerator.prototype.setPoints = function (points) {
        this._points = [];

        var weights = [];
        for (var i = 0, length = points.length; i < length; i++) {
            this._points.push({
                coordinates: this._projection.toGlobalPixels(points[i].coordinates, 0),
                weight: points[i].weight
            });
            weights.push(points[i].weight);
        }
        this._canvas.options.set('medianaOfWeights', findMediana(weights));

        return this;
    };

    /**
     * @public
     * @function getPoints
     * @description Returns points.
     *
     * @returns {Number[][]} points Points provided as geographical coordinates.
     */
    TileUrlsGenerator.prototype.getPoints = function () {
        var points = [];
        for (var i = 0, length = this._points.length; i < length; i++) {
            points.push({
                coordinates: this._projection.fromGlobalPixels(this._points[i].coordinates, 0),
                weight: this._points[i].weight
            });
        }
        return points;
    };

    /**
     * @public
     * @function getTileUrl
     * @description Returns tile URL according to given number and zoom level.
     *
     * @param {Number[]} tileNumber Tile number [x, y].
     * @param {Number} zoom Zoom level.
     * @returns {String} Data URL.
     */
    TileUrlsGenerator.prototype.getTileUrl = function (tileNumber, zoom) {
        var rnd = Math.round(+(new Date())/1000)
        return 'ym-heatmap://mid=' + this.heatMapID + '/x=' + tileNumber[0]+'/y='+tileNumber[1] + '/z=' + zoom+'/rnd='+rnd;
    };

    TileUrlsGenerator.prototype.getTileImage = function (tileNumber, zoom) {
        return this._canvas.generateDataURLHeatmap(this.getTileData(tileNumber, zoom));
    };

    TileUrlsGenerator.prototype.getTileData = function (tileNumber, zoom) {
        var radiusFactor = this._canvas.options.get('radiusFactor');
        if (this.options.get('dissipating')) {
            if (radiusFactor != zoom) {
                this._canvas.options.set('radiusFactor', zoom / 10);
            }
        } else if (radiusFactor) {
            this._canvas.options.unset('radiusFactor');
        }

        var zoomFactor = Math.pow(2, zoom),

            tileBounds = [[
                tileNumber[0] * TILE_SIZE[0] / zoomFactor,
                tileNumber[1] * TILE_SIZE[1] / zoomFactor
            ], [
                (tileNumber[0] + 1) * TILE_SIZE[0] / zoomFactor,
                (tileNumber[1] + 1) * TILE_SIZE[1] / zoomFactor
            ]],
            tileMargin = this._canvas.getBrushRadius() / zoomFactor,

            points = [];
        for (var i = 0, length = this._points.length, point; i < length; i++) {
            point = this._points[i].coordinates;
            if (this._contains(tileBounds, point, tileMargin)) {
                points.push({
                    coordinates: [
                        (point[0] - tileBounds[0][0]) * zoomFactor,
                        (point[1] - tileBounds[0][1]) * zoomFactor
                    ],
                    weight: this._points[i].weight
                })
            }
        }
        return points;
    };

    /**
     * @public
     * @function destroy
     * @description Destroys generator.
     */
    TileUrlsGenerator.prototype.destroy = function () {
        this._canvas.destroy();
        this._canvas = null;

        this._projection = null;
        delete dataLookup[this.heatMapID];
    };

    /**
     * @private
     * @function _isPointInBounds
     * @description Checks whether point is located inside given area.
     *
     * @param {Number[][]} bounds Area.
     * @param {Number[]} point Point.
     * @param {Number} margin Area extension.
     * @returns {Boolean} True - point lies inside area, false - otherwise.
     */
    TileUrlsGenerator.prototype._contains = function (bounds, point, margin) {
        return (point[0] >= bounds[0][0] - margin) &&
            (point[0] <= bounds[1][0] + margin) &&
            (point[1] >= bounds[0][1] - margin) &&
            (point[1] <= bounds[1][1] + margin);
    };

    /**
     * @function findMediana
     * @description Calculates a median of provided array of data.
     */
    function findMediana (selection) {
        var sortSelection = selection.sort(comparator),
            center = sortSelection.length / 2;
        if (center !== Math.floor(center)) {
            return sortSelection[Math.floor(center)];
        } else {
            return (sortSelection[center - 1] + sortSelection[center]) / 2;
        }
    }

    /**
     * @function comparator
     * @description Compares two numbers.
     */
    function comparator (a, b) {
        return a - b;
    }

    provide(TileUrlsGenerator);
});
