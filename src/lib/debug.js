const types = [
  'hulls',
  'hullBounds',
  'navMesh',
  'navMeshNodes',
  'polygonBounds',
  'aStarPath'
];

const DEBUG_DIAMETER = 10;
const DEBUG_COLOUR_YELLOW = 0xffff00;
const DEBUG_COLOUR_ORANGE = 0xffa500;
const DEBUG_COLOUR_GREEN = 0x33ff33;
const DEBUG_COLOUR_RED = 0xC83E30;
const DEBUG_PORTAL_WIDTH = 2;

const defaultOptions = {};
types.forEach(type => defaultOptions[type] = false);

class Debug {
  constructor(options = {}) {
    this.set(null, null, options);
  }

  /**
   * @method draw
   */
  draw({ delaunay, aStarPath }) {
    const { settings } = this;
    const { hulls, hullBounds, navMesh, navMeshNodes, polygonBounds } = settings;
    this.initGraphics();

    if ((hulls || hullBounds || navMesh || navMeshNodes || polygonBounds) && delaunay) {
      this.drawDelaunay(delaunay);
    }

    if (settings.aStarPath && aStarPath) {
      this.drawAStarPath(aStarPath);
    }
  }

  /**
   * @method tileDimensions
   */
  get tileDimensions() {
    const { data } = this.tileLayer.layer;
    const tile = data[0][0];
    const { width, height } = tile;

    return { width, height };
  }

  /**
   * @method getWorldXY
   * @param {Phaser.Point|Object} point
   */
  getWorldXY(point) {
    const { width, height } = this.tileDimensions;
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

  /**
   * @method drawAStarPath
   */
  drawAStarPath(aStarPath) {
    const gfx = this.gfx;
    const { startPoint, endPoint } = aStarPath;

    gfx.clear();
    gfx.beginFill(DEBUG_COLOUR_ORANGE, 1);
    gfx.lineStyle(DEBUG_PORTAL_WIDTH, DEBUG_COLOUR_ORANGE, 1);
    aStarPath.polygons.forEach(poly =>
      gfx.drawCircle(poly.centroid.x, poly.centroid.y, DEBUG_DIAMETER));
    aStarPath.portals.forEach(portal => {
      gfx.moveTo(portal.start.x, portal.start.y);
      gfx.lineTo(portal.end.x, portal.end.y);
    });
    gfx.endFill();

    gfx.lineStyle(0, 0xffffff, 1);
    gfx.beginFill(DEBUG_COLOUR_RED, 1);
    gfx.drawCircle(startPoint.x, startPoint.y, DEBUG_DIAMETER);
    gfx.endFill();

    gfx.lineStyle(0, 0xffffff, 1);
    gfx.beginFill(DEBUG_COLOUR_GREEN, 1);
    gfx.drawCircle(endPoint.x, endPoint.y, DEBUG_DIAMETER);
    gfx.endFill();
  }

  /**
   * @method drawDelaunay
   */
  drawDelaunay(delaunay) {
    const { gfx, settings } = this;
    const { polygons } = delaunay;
    const { clusters } = delaunay.hulls;
    gfx.clear();

    function drawCluster(cluster) {
      gfx.beginFill(DEBUG_COLOUR_RED, 0.6);
      gfx.drawPolygon(cluster.polygon.points.map(this.getWorldXY, this));
      gfx.endFill();
      const [startEdge, ...otherEdges] = cluster.edges;
      const startEdgeStart = this.getWorldXY(startEdge.start);
      const startEdgeEnd = this.getWorldXY(startEdge.end);

      gfx.lineStyle(2, DEBUG_COLOUR_YELLOW);
      gfx.moveTo(startEdgeStart.x, startEdgeStart.y);
      gfx.lineTo(startEdgeEnd.x, startEdgeEnd.y);

      otherEdges.forEach(edge => {
        const start = this.getWorldXY(edge.start);
        const end = this.getWorldXY(edge.end);

        gfx.moveTo(start.x, start.y);
        gfx.lineTo(end.x, end.y);
      });
      gfx.lineStyle(0);

      if (cluster.children.length) {
        cluster.children.forEach(drawCluster, this);
      }
    }

    function drawClusterBounds(cluster) {
      const { bounds } = cluster;
      const coordinates = this.getWorldXY(bounds);
      const { width, height } = this.tileDimensions;
      const boundsWidth = bounds.width * width;
      const boundsHeight = bounds.height * height;

      gfx.beginFill(DEBUG_COLOUR_GREEN, 0.6);
      gfx.drawRect(coordinates.x, coordinates.y, boundsWidth, boundsHeight);
      gfx.endFill();

      if (cluster.children.length) {
        cluster.children.forEach(drawClusterBounds, this);
      }
    }

    if (settings.hullBounds) {
      clusters.forEach(drawClusterBounds, this);
    }

    /**
     * @description Render the hulls found using the Marching Squares algorithm
     */
    if (settings.hulls) {
      clusters.forEach(drawCluster, this);
    }

    /**
     * @method Render the Delaunay triangles generated...
     */
    if (settings.navMesh) {
      gfx.beginFill(0xff33ff, 0.6);
      gfx.lineStyle(1, 0xffffff, 1);
      polygons.forEach(poly => gfx.drawPolygon(poly.points));
      gfx.endFill();
    }

    /**
     * @description Render the connecting NavMesh nodes between triangles
     */
    if (settings.navMeshNodes) {
      const lineWidth = 3;

      gfx.lineStyle(lineWidth, 0x00b2ff, 0.5);
      polygons.forEach((poly) => {
        poly.neighbors.forEach((neighbour) => {
          gfx.moveTo(poly.centroid.x, poly.centroid.y);
          gfx.lineTo(neighbour.centroid.x, neighbour.centroid.y);
        });

        gfx.beginFill(0xffffff);
        gfx.drawCircle(poly.centroid.x, poly.centroid.y, DEBUG_DIAMETER);
        gfx.endFill();
      });
    }

    /**
     * @description Render the bounding circles of each NavMesh triangle
     */
    if (settings.polygonBounds) {
      polygons.forEach(polygon => {
        gfx.lineStyle(2, DEBUG_COLOUR_YELLOW, 1);
        gfx.drawCircle(polygon.centroid.x, polygon.centroid.y, polygon.boundsRadius * 2)
      });
      gfx.lineStyle(0, 0xffffff);
    }
  }

  /**
   * @method initGraphics
   */
  initGraphics() {
    const { game } = this;
    if (!this.gfx) {
      this.gfx = game.add.graphics(0, 0);
    }
  }

  /**
   * @set
   * @param {Phaser.Game} game
   * @param {Phaser.TilemapLayer} tileLayer
   * @param {Object} options
   */
  set(game, tileLayer, options = {}) {
    this.game = game;
    this.tileLayer = tileLayer;
    this.settings = Object.assign({}, defaultOptions, options);
    if (game) {
      this.initGraphics();
    }

    return this.settings;
  }
}

export default new Debug()