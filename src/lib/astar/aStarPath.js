import { areLinesEqual } from '../utils';
import Funnel from './funnel';

export default class AStarPath {

  /**
   * @constructor
   * @param {NavMeshPolygon[]} polygons
   * @param {Object} options
   */
  constructor(polygons = [], options = {}) {
    const { startPoint, endPoint, startPolygon, endPolygon, isConnected, midPointThreshold } = options;
    this.polygons = polygons;
    this.isConnected = isConnected;
    this.midPointThreshold = midPointThreshold;

    this.startPoint = startPoint;
    this.endPoint = endPoint;

    this.startPolygon = startPolygon;
    this.endPolygon = endPolygon;
    this.portals = [];

    this.initPortals();
    this.initFunnel();
  }

  /**
   * @method path
   */
  get path() {
    return this.funnel.path;
  }

  /**
   * @method initPortals
   * @description Find the matching portal lines that take the Actor from startPoint to endPoint
   */
  initPortals() {
    const { polygons } = this;
    const length = polygons.length;
    let i = 0;
    let node;
    let nextNode;
    let portal;

    this.portals = [];

    for (i; i < length; i++) {
      node = polygons[i];
      nextNode = polygons[i + 1];
      if (!nextNode) {
        continue;
      }

      // Find the matching Line segment in the next node along the path.
      portal = node.portals.find(portal => nextNode.portals.find(p => areLinesEqual(p, portal)));
      if (portal) {
        this.portals.push(portal);
      }
    }
    this.portals.reverse();
  }

  /**
   * @method initFunnel
   */
  initFunnel() {
    const { portals, startPoint, endPoint, midPointThreshold } = this;
    const length = portals.length;
    let i = 0;

    this.funnel = new Funnel(midPointThreshold);
    this.funnel.add(startPoint);

    for (i; i < length; i++) {
      this.funnel.add(portals[i].start, portals[i].end);
    }

    this.funnel.add(endPoint);
    this.funnel.update();
  }
}
