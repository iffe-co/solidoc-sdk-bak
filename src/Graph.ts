import { Subject } from './Subject'

// a graph could be a page or a database
abstract class Graph {
  private _uri: string
  protected _nodeMap = new Map<string, Subject>();

  constructor(uri: string) {
    this._uri = uri;
  }

  public abstract createNode(uri: string, type: string): Subject

  public getUri = (): string => {
    return this._uri
  }

  public getNode = (uri: string): Subject | undefined => {
    return this._nodeMap.get(uri)
  }

  public getRoot = (): Subject | undefined => {
    return this._nodeMap.get(this._uri)
  }

  public getSparqlForUpdate = (): string => {
    let sparql = '';
    for(let node of this._nodeMap.values()) {
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
