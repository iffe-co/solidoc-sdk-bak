import { Subject } from './Subject';
import { Process } from './Process'

// a graph could be a page or a database
abstract class Graph {
  private _uri: string
  protected _nodes: { [uri: string]: Subject } = {}

  constructor(uri: string, turtle: string) {
    this._uri = uri;
    Process.parseTurtle(turtle, this)
  }

  public getUri = (): string => {
    return this._uri
  }
  public getNode = (uri: string): Subject => {
    return this._nodes[uri];
  }
  public setNode = (node: Subject) => {
    this._nodes[node.get('id')] = node;
  }

  public getSparqlForUpdate = (): string => {
    let sparql = '';
    Object.keys(this._nodes).forEach(uri => {
      sparql += this._nodes[uri].getSparqlForUpdate(this._uri);
    });
    return sparql;
  }

  public commit = () => {
    Object.keys(this._nodes).forEach(uri => {
      if (this._nodes[uri].isDeleted()) {
        delete this._nodes[uri];
      } else {
        this._nodes[uri].commit();
      }
    });
  }

  public undo = () => {
    Object.keys(this._nodes).forEach(uri => {
      this._nodes[uri].undo();
    });
  }
}

export { Graph }
