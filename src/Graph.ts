import { Subject } from './Subject';
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
abstract class Graph {
  protected _uri: string
  protected _nodes: { [uri: string]: Subject } = {}
  protected _isReady: boolean

  constructor(uri: string) {
    this._uri = uri;
    this._isReady = false;
  }

  public fromTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    this._addSubjects(quads);
    this._assignProperties(quads);
    this._isReady = true;
  }

  private _addSubjects = (quads: any) => {
    quads.forEach(quad=> {
      if (quad.predicate.id==='http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        this._nodes[quad.subject.id] || this._addPlaceHolder(quad.subject.id, quad.object.id);
      }
    })
  }

  private _assignProperties = (quads: any) => {
    quads.forEach(quad=> {
      this._nodes[quad.subject.id].fromQuad(quad);
    })
  }

  protected abstract _addPlaceHolder(uri: string, type: string): void

  public set = (nodeUri: string, options) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for write`);
    }
    this._nodes[nodeUri].set(options);
  }

  public getSparqlForUpdate = (): string => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for sparql`);
    }
    let sparql = '';
    Object.keys(this._nodes).forEach(uri => {
      sparql += this._nodes[uri].getSparqlForUpdate(this._uri);
    });
    return sparql;
  }

  public commit = () => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for commit`);
    }
    Object.keys(this._nodes).forEach(uri => {
      if (this._nodes[uri].isDeleted) {
        delete this._nodes[uri];
      } else {
        this._nodes[uri].commit();
      }
    });
  }

  public isReady = (): boolean => {
    return this._isReady;
  }
}

export { Graph }
