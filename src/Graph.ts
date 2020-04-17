import { Process } from './Process'
import { nodeMap } from './Node'

// a graph could be a page or a database
abstract class Graph {
  private _uri: string

  constructor(uri: string, turtle: string) {
    this._uri = uri;
    Process.parseTurtle(uri, turtle)
  }

  public getUri = (): string => {
    return this._uri
  }

  public getSparqlForUpdate = (): string => {
    let sparql = '';
    for(let node of nodeMap.values()) {
      sparql += node.getSparqlForUpdate(this._uri);
    }
    return sparql;
  }

  public commit = () => {
    for (let [uri, node] of nodeMap.entries()) {
      if (node.isDeleted()) {
        nodeMap.delete(uri);
      } else {
        node.commit();
      }
    }
  }

  public undo = () => {
    for (let node of nodeMap.values()) {
        node.undo();
    }
  }
}

export { Graph }
