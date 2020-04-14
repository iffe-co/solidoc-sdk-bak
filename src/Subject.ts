import { Property, NamedNodeProperty, TextProperty } from './Property';
import { Graph } from './Graph'

abstract class Subject {
  protected _uri: string
  protected _graph: Graph
  protected _predicates: { [key: string]: Property } = {}
  protected _isDeleted: boolean

  constructor(uri: string, graph: Graph) {
    this._uri = uri;
    this._graph = graph;
    this._isDeleted = false
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode', 'next');
    this._predicates.option = new TextProperty('http://www.solidoc.net/ontologies#option', 'option');
  }

  public fromQuad = (quad: any) => {
    let found = false;
    // TODO: O(n^2) complexity
    Object.keys(this._predicates).forEach(key => {
      if (this._predicates[key].id === quad.predicate.id) {
        this._predicates[key].fromQuad(quad);
        found = true;
      }
    });
    if (!found) {
      console.log('Quad not matched:');
      console.log(quad);
    }
  }

  public abstract toJson(): any

  public get = (key: string): string => {
    if (key === 'id') return this._uri;
    return this._predicates[key] ? this._predicates[key].get() : '';
  }

  public set = (props: any) => {
    if (this._isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._uri);
    }
    let option: any = JSON.parse(this.get('option') || '{}')
    Object.keys(props).forEach(key => {
      if (key === 'id' || key === 'children') {
        //
      } else if (this._predicates[key]) {
        this._predicates[key].set(props[key]);
      } else if (props[key] === null) {
        delete option[key];
      } else {
        option[key] = props[key]
      }
    });
    this._predicates['option'].set(JSON.stringify(option));
  }

  public setNext = (node: Subject | null) => {
    this.set({ next: node ? node._uri : '' })
  }
  public getNext = (): Subject => {
    let nextUri: string = this.get('next');
    return this._graph.getSubject(nextUri);
  }

  public getSparqlForUpdate = (graph: string): string => {
    let sparql = '';
    if (this._isDeleted) {
      sparql += `WITH <${graph}> DELETE { <${this._uri}> ?p ?o } WHERE { <${this._uri}> ?p ?o };\n`;
    } else {
      Object.keys(this._predicates).forEach(key => {
        sparql += this._predicates[key].getSparqlForUpdate(graph, this._uri);
      });
    }
    return sparql;
  }

  public commit = () => {
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].commit();
    });
  }

  public undo = () => {
    this._isDeleted = false
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].undo();
    });
  }

  public delete = () => {
    this._isDeleted = true
  }

  public isDeleted = (): boolean => {
    return this._isDeleted
  }
}

export { Subject }