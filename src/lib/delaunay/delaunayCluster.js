import cdt2d from 'cdt2d';

/**
 * @class DelaunayCluster
 * @description Takes a suite of edges & calculates Constrained Delaunay triangles based on provided gen. options
 */
export default class DelaunayCluster {
  /**
   * @constructor
   * @param {Phaser.Line[]} edges
   * @param {Phaser.Line[]} parentEdges
   * @param {Phaser.Line[]} allChildEdges
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {Object} options
   */
  constructor(edges = [], parentEdges = [], allChildEdges = [], tileWidth, tileHeight, options = {}) {
    this.points = [];
    this.edges = [];
    this.polygons = [];

    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.options = options;

    this.generate(edges, parentEdges, allChildEdges);
  }

  /**
   * @method addPoint
   * @description Adds new vertex point to Array. Returns index of newly pushed point, or existin
   * @param {Number} x
   * @param {Number} y
   * @return {Number}
   */
  addPoint(x, y) {
    const { points, tileWidth, tileHeight } = this;

    const index = points.findIndex(p => p[0] === x * tileWidth && p[1] === y * tileHeight);
    if (index !== -1) {
      return index;
    }

    points.push([ x * tileWidth, y * tileHeight ]);
    return points.length - 1;
  }

  /**
   * @method generate
   * @param {Phaser.Line[]} polygonEdges
   * @param {Phaser.Line[]} parentEdges
   * @param {Phaser.Line[]} childClusterEdge
   */
  generate(polygonEdges, parentEdges, childClusterEdge) {
    const { edges, points, options } = this;
    let startIndex;
    let endIndex;

    const addEdgeToPoints = edge => {
      startIndex = this.addPoint(edge.start.x, edge.start.y);
      endIndex = this.addPoint(edge.end.x, edge.end.y);
    };

    parentEdges.forEach(addEdgeToPoints, this);

    childClusterEdge.forEach(edge => {
      addEdgeToPoints(edge);
      edges.push([ startIndex, endIndex ]);
    });

    polygonEdges.forEach(edge => {
      addEdgeToPoints(edge);
      edges.push([ startIndex, endIndex ]);
    });


    const delaunay = cdt2d(points, edges, options) ||  [];
    this.polygons = delaunay.map(triangle => triangle.map(index => points[index]));
  }
}