import { Property, Prop } from './Property';
import { ont, idToAlias } from '../config/ontology'
import { Element, Node } from './interface'

class Subject {
  protected _id: string
  protected _graph: string
  protected _predicates: { [key: string]: Property } = {}
  private _isDeleted: boolean
  private _isFromPod: boolean
  public _next: Subject | undefined // TODO: not to use public

  constructor(id: string, graph: string) {
    this._id = id;
    this._graph = graph
    this._isDeleted = false
    this._isFromPod = false
    this._predicates.type = Prop.create(ont.rdf.type, this._graph, this._id);
    this._predicates.option = Prop.create(ont.sdoc.option, this._graph, this._id);
  }

  public fromQuad(quad: any, subjectMap: Map<string, Subject>) {
    let alias = idToAlias[quad.predicate.id];
    if (!alias || !this._predicates[alias]) {
      return;
    }
    this._predicates[alias].fromQuad(quad)
    if (quad.predicate.id === ont.sdoc.next) {
      this._next = subjectMap.get(quad.object.id)
    }
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

  public set(node: Node, next?: Subject, _firstChild?: Subject) {
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
    this._predicates['option'].set(JSON.stringify(newOptions));

    this._predicates['next'].set(next ? next._id : '')
    this._next = next
  }

  public getSparqlForUpdate = (): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
      return `DELETE WHERE { GRAPH <${this._graph}> { <${this._id}> ?p ?o } };\n`;
    } else {
      return Object.values(this._predicates).reduce(Prop.getSparql, '');
    }
  }

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed')
    }

    Object.values(this._predicates).map(Prop.commit)

    this._isFromPod = true
  }

  public undo() {
    if (!this._isFromPod) {
      throw new Error('A non-persisted subject should not be undone')
    }

    Object.values(this._predicates).map(Prop.undo);

    this._isDeleted = false
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

  protected _firstChild: Subject | undefined

  constructor(id: string, graph: string) {
    super(id, graph);
    this._predicates.firstChild = Prop.create(ont.sdoc.firstChild, this._graph, this._id);
    this._predicates.next = Prop.create(ont.sdoc.next, this._graph, this._id);
  }

  public toJson(): Element {
    const result: Element = {
      ...super.toJson(),
      children: [],
    }

    let child: Subject | undefined = this._firstChild

    while (child) {
      result.children.push(child.toJson())
      child = child._next
    }

    return result
  }

  public fromQuad(quad: any, subjectMap: Map<string, Subject>) {
    if (quad.predicate.id === ont.sdoc.firstChild) {
      this._firstChild = subjectMap.get(quad.object.id)
      // this._predicates['firstChild'].set(this._firstChild ? this._firstChild.get('id') : '')
    }
    super.fromQuad(quad, subjectMap)
  }

  public set(node: Element, next?: Subject, firstChild?: Subject) {
    super.set(node, next);

    this._predicates['firstChild'].set(firstChild ? firstChild.get('id') : '')
    this._firstChild = firstChild;
  }
}

class Root extends Branch {
  constructor(id: string, graph: string) {
    super(id, graph);
    this._predicates.title = Prop.create(ont.dct.title, this._graph, this._id);
  }

  public fromQuad(quad: any, subjectMap: Map<string, Subject>) {
    if (quad.predicate.id === ont.sdoc.next) {
      throw new Error('fromQuad: The root may not have syblings: ' + this._id)
    }
    super.fromQuad(quad, subjectMap)
  }

  public set(node: Element, next?: Subject, firstChild?: Subject) {
    if (next) {
      throw new Error('Cannot set "next" property for Root: ' + node._id);
    }
    super.set(node, undefined, firstChild)
  }

  public delete() {
    throw new Error('The root is not removable :' + this._id);
  }

}

class Leaf extends Subject {
  constructor(id: string, graph: string) {
    // TODO: using blank nodes
    super(id, graph);
    this._predicates.text = Prop.create(ont.sdoc.text, this._graph, this._id);
    this._predicates.next = Prop.create(ont.sdoc.next, this._graph, this._id);
  }
}

const createSubject = (json: Node, graph: string): Subject => {

  let subject: Subject
  switch (json.type) {
    case 'http://www.solidoc.net/ontologies#Root':
      subject = new Root(json.id, graph)
      break
    case 'http://www.solidoc.net/ontologies#Leaf':
      subject = new Leaf(json.id, graph)
      break
    default:
      subject = new Branch(json.id, graph)
      break
  }
  subject.set(json)

  return subject
}

export { Subject, Branch, Root, Leaf, createSubject }
