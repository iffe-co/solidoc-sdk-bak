import { Process, nodes } from './Process'

// a graph could be a page or a database
abstract class Graph {
  private _uri: string

  constructor(uri: string, turtle: string) {
    this._uri = uri;
    Process.parseTurtle(turtle)
  }

  public getUri = (): string => {
    return this._uri
  }


  public getSparqlForUpdate = (): string => {
    let sparql = '';
    for(let node of nodes.values()) {
      sparql += node.getSparqlForUpdate(this._uri);
    }
    return sparql;
  }

  public commit = () => {
    for (let [uri, node] of nodes.entries()) {
      if (node.isDeleted()) {
        nodes.delete(uri);
      } else {
        node.commit();
      }
    }
  }

  public undo = () => {
    for (let node of nodes.values()) {
        node.undo();
    }
  }
}

export { Graph }
