import { Property, NamedNodeProperty, TextProperty, JsonProperty } from './Property';
import { idToAlias } from '../config/ontology'
import { Element, Node } from './interface'

abstract class Subject {
  protected _id: string
  protected _predicates: { [key: string]: Property } = {}
  private _isDeleted: boolean
  private _isFromPod: boolean

  constructor(id: string) {
    this._id = id;
    this._isDeleted = false
    this._isFromPod = false
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode');
    this._predicates.option = new JsonProperty('http://www.solidoc.net/ontologies#option');
  }

  public fromQuad(quad: any) {
    let alias = idToAlias[quad.predicate.id];
    if (!alias || !this._predicates[alias]) {
      // console.log('Quad not matched: ' + JSON.stringify(quad));
      return;
    }
    this._predicates[alias].fromQuad(quad)
  }

  public toJson(): Node {
    let result = {
      id: this._id,
      type: this.get('type'),
      ...JSON.parse(this.get('option')),
    }

    Object.keys(this._predicates).forEach(alias => {
      ['next', 'firstChild', 'option', 'type'].includes(alias) || (result[alias] = this.get(alias));
    });

    return result;
  }

  public get = (alias: string): string => {
    if (alias === 'id') return this._id;
    if (!this._predicates[alias]) { // TODO: get from options?
      throw new Error('Try to get an unknown property: ' + this._id + alias)
    }
    return this._predicates[alias].get();
  }

  public set(node: Node, next?: Node) {
    if (this._isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._id);
    }

    let newOptions = {}
    Object.keys(node).forEach(alias => {
      if (alias === 'id' || alias === 'children') {
        //
      } else if (this._predicates[alias]) {
        this._predicates[alias].set(node[alias]);
      } else {
        newOptions[alias] = node[alias]
      }
    });
    (<JsonProperty>(this._predicates['option'])).set(newOptions);

    this._predicates['next'].set(next ? next.id : '')
  }

  public getSparqlForUpdate = (graphId: string): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
      return `WITH <${graphId}> DELETE { <${this._id}> ?p ?o } WHERE { <${this._id}> ?p ?o };\n`;
    } else {
      let sparql = '';
      Object.values(this._predicates).forEach(predicate => {
        sparql += predicate.getSparqlForUpdate(graphId, this._id);
      });
      return sparql;
    }
  }

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed')
    }
    Object.values(this._predicates).forEach(predicate => {
      predicate.commit();
    });
    this._isFromPod = true
  }

  public undo() {
    if (!this._isFromPod) {
      throw new Error('A non-persisted subject should not be undone')
    }
    this._isDeleted = false
    Object.values(this._predicates).forEach(predicate => {
      predicate.undo();
    });
  }

  public delete() {
    this._isDeleted = true
  }

  public isDeleted = (): boolean => {
    return this._isDeleted
  }

  public isFromPod = (): boolean => {
    return this._isFromPod
  }

  public setFromPod = () => {
    this._isFromPod = true
  }

}

class Branch extends Subject {

  constructor(id: string) {
    super(id);
    this._predicates.firstChild = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild');
  }

  public toJson(): Element {
    return {
      ...super.toJson(),
      children: [],
    }
  }

  public set(node: Element, next?: Node) {
    super.set(node, next);

    this._predicates['firstChild'].set(node.children[0] ? node.children[0].id : '')
  }
}

class Root extends Branch {
  constructor(id: string) {
    super(id);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title');
  }

  public fromQuad(quad: any) {
    if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
      throw new Error('fromQuad: The root may not have syblings: ' + this._id)
    }
    super.fromQuad(quad)
  }

  public set(node: Element, next?: Node) {
    if (next) {
      throw new Error('Cannot set "next" property for Root: ' + node._id);
    }
    super.set(node)
  }

  public delete() {
    throw new Error('The root is not removable :' + this._id);
  }

}

class Leaf extends Subject {
  constructor(id: string) {
    // TODO: using blank nodes
    super(id);
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text');
  }
}

const createSubject = (json: Node, subjectMap: Map<string, Subject>): Subject => {
  if (subjectMap.get(json.id)) {
    throw new Error('duplicated subject creation: ' + json.id)
  }
  let subject: Subject
  switch (json.type) {
    case 'http://www.solidoc.net/ontologies#Root':
      subject = new Root(json.id)
      break
    case 'http://www.solidoc.net/ontologies#Leaf':
      subject = new Leaf(json.id)
      break
    default:
      subject = new Branch(json.id)
      break
  }
  subject.set(json)
  subjectMap.set(json.id, subject)
  return subject
}

export { Subject, Branch, Root, Leaf, createSubject }
