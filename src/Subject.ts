import { Property } from './Property';
import { Graph } from './Graph'

abstract class Subject {
  protected _uri: string
  protected _graph: Graph
  protected _predicates: { [key: string]: Property } = {}
  public isDeleted: boolean

  constructor(uri: string, graph :Graph) {
    this._uri = uri;
    this._graph = graph;
  }

  public fromQuad = (quad: any) => {
    let found = false;
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

  public set = (options: any) => {
    if (this.isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._uri);
    }
    Object.keys(options).forEach(key => {
      key === 'id' || key === 'children' || this._predicates[key].set(options[key]);
    });
  }

  public setNext = (node: Subject) => {
    this.set({ next: node ? node._uri : '' })
  }
  public getNext = (): Subject => {
    let nextUri: string = this.get('next');
    return this._graph.getSubject(nextUri);
  }

  public getSparqlForUpdate = (graph: string): string => {
    let sparql = '';
    if (this.isDeleted) {
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
    this.isDeleted = false
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].undo();
    });
  }
}

export { Subject }