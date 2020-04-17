import { Property, NamedNodeProperty, JsonProperty } from './Property';
import { uriToKey } from '../config/ontology'
import { nodeMap } from './Node'

abstract class Subject {
  protected _uri: string
  protected _predicates: { [key: string]: Property } = {}
  protected _isDeleted: boolean

  constructor(uri: string) {
    this._uri = uri;
    this._isDeleted = false
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode', 'next');
    this._predicates.option = new JsonProperty('http://www.solidoc.net/ontologies#option', 'option');
  }

  public fromQuad(quad: any) {
    let key = uriToKey[quad.predicate.id];
    if (!key || !this._predicates[key]) {
      console.log('Quad not matched: ' + JSON.stringify(quad));
      return;
    }
    this._predicates[key].fromQuad(quad)
  }

  public abstract toJson(): any

  public get = (key: string): string => {
    if (key === 'id') return this._uri;
    if (!this._predicates[key]) {
      throw new Error('Try to get an unknown property: ' + this._uri + key)
    }
    return this._predicates[key].get();
  }

  public set(props: any) {
    if (this._isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._uri);
    }
    let option = {}
    Object.keys(props).forEach(key => {
      if (key === 'id' || key === 'children') {
        //
      } else if (this._predicates[key]) {
        this._predicates[key].set(props[key]);
      } else {
        option[key] = props[key]
      }
    });
    (<JsonProperty>(this._predicates['option'])).set(option);
  }

  public setNext = (node: Subject | undefined) => {
    this.set({ next: node ? node._uri : '' })
  }
  public getNext = (): Subject | undefined => {
    return nodeMap.get(this.get('next'))
  }

  public getSparqlForUpdate = (graph: string): string => {
    if (this._isDeleted) {
      return `WITH <${graph}> DELETE { <${this._uri}> ?p ?o } WHERE { <${this._uri}> ?p ?o };\n`;
    } else {
      let sparql = '';
      Object.keys(this._predicates).forEach(key => {
        sparql += this._predicates[key].getSparqlForUpdate(graph, this._uri);
      });
      return sparql;
    }
  }

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed')
    }
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