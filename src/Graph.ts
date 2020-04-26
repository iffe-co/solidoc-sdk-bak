import { Subject } from './Subject'
import { createNode } from './Node'
import { Node } from './interface'
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
class Graph {
  protected _id: string
  protected _nodeMap = new Map<string, Subject>();

  constructor(id: string, turtle: string) {
    this._id = id;
    this._parseTurtle(turtle)
  }

  private _parseTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        let node = this.createNode({
          id: quad.subject.id,
          type: quad.object.id, // TODO: should only create node for known types
          children: [], // TODO: this is a workaround to deceive the type check
        });
        node.setFromPod();
      }
    })

    // Should always create the root
    if (!this.getRoot()) {
      let root = this.createNode({
        id: this._id,
        type: 'http://www.solidoc.net/ontologies#Root',
        children: [],
      });
      root.setFromPod()
    }

    quads.forEach(quad => {
      let node = this._nodeMap.get(quad.subject.id)
      node?.fromQuad(quad)
    })
  }

  public getRoot = (): Subject | undefined => {
    return this._nodeMap.get(this._id)
  }

  public getNode = (id: string): Subject | undefined => {
    return this._nodeMap.get(id)
  }

  public createNode = (json: Node): Subject => {
    return createNode(json, this._nodeMap)
  }

  public getSparqlForUpdate(): string {
    let sparql = '';
    for (let node of this._nodeMap.values()) {
      sparql += node.getSparqlForUpdate(this._id);
    }
    return sparql;
  }

  public commit() {
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
        node.undo();
      }
    }
  }
}

export { Graph }
