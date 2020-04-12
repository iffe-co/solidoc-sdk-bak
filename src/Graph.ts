import { Subject } from './Subject';
import { Branch } from './Node'
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
  public getSubject = (uri: string): Subject => {
    return this._nodes[uri];
  }
  public fromTurtle = (turtle: string) => {
    this._flush();
    const quads: any[] = parser.parse(turtle);
    this._addSubjects(quads);
    this._assignProperties(quads);
    this._makeChildren(this._getRoot());
  }

  private _flush = () => {
    Object.keys(this._nodes).forEach(uri => {
      delete this._nodes[uri];
    });
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

  private _makeChildren = (head?: Subject) => {
    if (!(head instanceof Branch)) return

    let currUri = head.get('child');
    let curr: Subject = this._nodes[currUri]
    let offset = 0;

    while (curr) {
      head.children[offset] = curr
      this._makeChildren(curr);
      curr = this._nodes[curr.get('next')];
      offset ++
    }
  }

  protected abstract _addPlaceHolder(uri: string, type: string): Subject

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
