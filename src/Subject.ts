import { Property, NamedNodeProperty, TextProperty, JsonProperty } from './Property';
import { idToKey } from '../config/ontology'
import { Element, Text, Node } from './interface'

abstract class Subject {
  protected _id: string
  protected _predicates: { [key: string]: Property } = {}
  private _isDeleted: boolean
  private _isFromPod: boolean

  constructor(id: string) {
    this._id = id;
    this._isDeleted = false
    this._isFromPod = false
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode', 'next');
    this._predicates.option = new JsonProperty('http://www.solidoc.net/ontologies#option', 'option');
  }

  public fromQuad(quad: any) {
    let key = idToKey[quad.predicate.id];
    if (!key || !this._predicates[key]) {
      // console.log('Quad not matched: ' + JSON.stringify(quad));
      return;
    }
    this._predicates[key].fromQuad(quad)
  }

  public toJson(): any {
    let option = JSON.parse(this.get('option'))
    return {
      id: this._id,
      type: this.get('type'),
      ...option
    };
  }

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

  public getSparqlForUpdate = (graph: string): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
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
    this._isFromPod = true
  }

  public undo() {
    if (!this._isFromPod) {
      throw new Error('A non-persisted subject should not be undone')
    }
    this._isDeleted = false
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].undo();
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
    this._predicates.firstChild = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'firstChild');
  }

  public toJson(): Element {
    let result = super.toJson();
    result.children = []
    return result
  }

  public toJsonRecursive(subjectMap: Map<string, Subject>): Element {
    let result = this.toJson()

    let child = subjectMap.get(this.get('firstChild'))

    while (child) {
      if (child instanceof Branch) {
        result.children.push(child.toJsonRecursive(subjectMap))
      } else {
        result.children.push(child.toJson())
      }
      child = subjectMap.get(child.get('next'))
    }

    return result
  }

}

class Root extends Branch {
  constructor(id: string) {
    super(id);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
  }

  public toJson(): Element {
    return {
      ...super.toJson(),
      title: this.get('title')
    }
  }

  public fromQuad(quad: any) {
    if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
      throw new Error('fromQuad: The root may not have syblings: ' + this._id)
    }
    super.fromQuad(quad)
  }

  public set(props: any) {
    if (Object.keys(props).includes('next')) {
      throw new Error('Cannot set "next" property for Root: ' + this._id);
    }
    super.set(props)
  }

  public delete = () => {
    throw new Error('The root is not removable :' + this._id);
  }

}

class Leaf extends Subject {
  constructor(id: string) {
    // TODO: using blank nodes
    super(id);
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
  }

  public toJson = (): Text => {
    return {
      ...super.toJson(),
      text: this.get('text')
    }
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
