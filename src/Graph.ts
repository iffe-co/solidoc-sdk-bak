import { Subject } from './Subject';
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
abstract class Graph {
  protected _uri: string
  protected _nodes: { [uri: string]: Subject } = {}

  constructor(uri: string) {
    this._uri = uri;
  }

  protected _getRoot = (): Subject => {
    return this._nodes[this._uri];
  }
  protected _getNext = (curr: Subject): Subject => {
    // TODO: prevent throwing
    let nextUri: string = curr.get('next');
    return this._nodes[nextUri];
  }
  public fromTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    this._addSubjects(quads);
    this._assignProperties(quads);
  }

  private _addSubjects = (quads: any) => {
    quads.forEach(quad => {
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        this._nodes[quad.subject.id] || this._addPlaceHolder(quad.subject.id, quad.object.id);
      }
    })
  }

  private _assignProperties = (quads: any) => {
    quads.forEach(quad => {
      this._nodes[quad.subject.id].fromQuad(quad);
    })
  }

  protected abstract _addPlaceHolder(uri: string, type: string): void

  public set = (nodeUri: string, options) => {
    this._nodes[nodeUri].set(options);
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
      if (this._nodes[uri].isDeleted) {
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
