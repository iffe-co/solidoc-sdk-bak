import { Subject } from './Subject'
import { createNode } from './Node'
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
abstract class Graph {
  private _uri: string
  protected _nodeMap = new Map<string, Subject>();

  constructor(uri: string, turtle: string) {
    this._uri = uri;
    this._parseTurtle(uri, turtle)
  }

  private _parseTurtle = (uri: string, turtle: string) => {
    createNode(uri, 'http://www.solidoc.net/ontologies#Root', this._nodeMap);

    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && quad.subject.id !== uri) {
        // TODO: only create node for known types
        createNode(quad.subject.id, quad.object.id, this._nodeMap);
      }
    })

    quads.forEach(quad => {
      let node = this._nodeMap.get(quad.subject.id)
      if (!node) {
        throw new Error('Node does not exist: ' + quad.subject.id)
      }
      node.fromQuad(quad, this._nodeMap)
    })
  }

  public getRoot = (): Subject | undefined => {
    return this._nodeMap.get(this._uri)
  }

  public getSparqlForUpdate = (): string => {
    let sparql = '';
    for (let node of this._nodeMap.values()) {
      sparql += node.getSparqlForUpdate(this._uri);
    }
    return sparql;
  }

  public commit = () => {
    for (let [uri, node] of this._nodeMap.entries()) {
      if (node.isDeleted()) {
        this._nodeMap.delete(uri);
      } else {
        node.commit();
      }
    }
  }

  public undo = () => {
    for (let node of this._nodeMap.values()) {
      node.undo();
    }
  }
}

export { Graph }
