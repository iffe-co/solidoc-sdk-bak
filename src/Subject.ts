import { Property, NamedNodeProperty, JsonProperty } from './Property';
import { idToKey } from '../config/ontology'

abstract class Subject {
  protected _id: string
  protected _predicates: { [key: string]: Property } = {}
  private _isDeleted: boolean
  private _isPersisted: boolean
  private _next: Subject | undefined

  constructor(id: string) {
    this._id = id;
    this._isDeleted = false
    this._isPersisted = false
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode', 'next');
    this._predicates.option = new JsonProperty('http://www.solidoc.net/ontologies#option', 'option');
  }

  public fromQuad(quad: any, nodeMap: Map<string, Subject>) {
    let key = idToKey[quad.predicate.id];
    if (!key || !this._predicates[key]) {
      console.log('Quad not matched: ' + JSON.stringify(quad));
      return;
    }
    if (key == 'next') {
      let next = nodeMap.get(quad.object.id)
      if (!next || next._id != quad.object.id) {
        throw new Error('#nextNode inconsistency: ' + quad.object.id)
      }
      this.setNext(next)
    }
    this._predicates[key].fromQuad(quad)
    this._isPersisted = true
  }

  public toJson(): any {
    let option = JSON.parse(this.get('option'))
    return {
      id: this._id,
      type: this.get('type'),
      ...option
    };
  }
  public abstract toBlankJson(): any

  public get = (key: string): string => {
    if (key === 'id') return this._id;
    if (!this._predicates[key]) {
      throw new Error('Try to get an unknown property: ' + this._id + key)
    }
    return this._predicates[key].get();
  }

  public set(props: any) {
    if (this._isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._id);
    }

    if (Object.keys(props).includes('next')) {
      throw new Error('The "next" property may not be set: ' + this._id);
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

  public setNext(node: Subject | undefined) {
    let nextId = node ? node._id : '';
    this._predicates['next'].set(nextId);
    this._next = node;
  }
  public getNext(): Subject | undefined {
    return this._next
  }

  public getSparqlForUpdate = (graph: string): string => {
    if (this._isDeleted) {
      return `WITH <${graph}> DELETE { <${this._id}> ?p ?o } WHERE { <${this._id}> ?p ?o };\n`;
    } else {
      let sparql = '';
      Object.keys(this._predicates).forEach(key => {
        sparql += this._predicates[key].getSparqlForUpdate(graph, this._id);
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
    this._isPersisted = true
  }

  public undo(nodeMap: Map<string, Subject>) {
    if (!this._isPersisted) {
      throw new Error('A non-persisted subject should not be undone')
    }
    this._isDeleted = false
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].undo();
    });
    this._next = nodeMap.get(this.get('next'))
  }

  public delete() {
    this._isDeleted = true
  }

  public isDeleted = (): boolean => {
    return this._isDeleted
  }

  public isPersisted = (): boolean => {
    return this._isPersisted
  }

  public abstract attachChildren(curr: Subject | string | undefined, offset: number)
  public abstract detachChildren(offset: number, length: number): Subject | string | undefined
}

export { Subject }