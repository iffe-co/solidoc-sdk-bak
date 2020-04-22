import { Subject } from './Subject'
import { createNode } from './Node'
import { Node } from './interface'
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
abstract class Graph {
  private _id: string
  protected _nodeMap = new Map<string, Subject>();

  constructor(id: string, turtle: string) {
    this._id = id;
    turtle = `<${id}> a <http://www.solidoc.net/ontologies#Root>.\n` + turtle
    this._parseTurtle(turtle)
  }

  private _parseTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        // TODO: only create node for known types
        let json: Node = {
          id: quad.subject.id,
          type: quad.object.id,
          children: [],   // TODO: might be leaf
        }    
        createNode(json, this._nodeMap);
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
    return this._nodeMap.get(this._id)
  }

  public getNode = (id: string): Subject | undefined => {
    return this._nodeMap.get(id)
  }

  public getSparqlForUpdate = (): string => {
    let sparql = '';
    for (let node of this._nodeMap.values()) {
      sparql += node.getSparqlForUpdate(this._id);
    }
    return sparql;
  }

  public commit = () => {
    for (let [id, node] of this._nodeMap.entries()) {
      if (node.isDeleted()) {
        this._nodeMap.delete(id);
      } else {
        node.commit();
      }
    }
  }

  public undo() {
    for (let [id, node] of this._nodeMap.entries()) {
      if (!node.isFromPod()) {
        this._nodeMap.delete(id)
      } else {
        node.undo(this._nodeMap);
      }
    }
  }
}

export { Graph }
