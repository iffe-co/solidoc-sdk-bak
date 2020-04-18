import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';

class Branch extends Subject {
  private _children: Subject[] = [];

  constructor(uri: string) {
    super(uri);
    this._predicates.firstChild = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'firstChild');
  }

  public toJson(): Element {
    let result = super.toJson()
    return {
      ...result,
      children: []
    }
  }

  private setFirstChild = (node: Subject | undefined) => {
    this.set({ firstChild: node ? node.get('id') : '' })
  }

  public getIndexedChild = (offset: number): Subject | undefined => {
    return this._children[offset]
  }
  public getLastChild = (): Subject | undefined => {
    return this._children[this._children.length - 1]
  }

  public insertChildren = (curr: Subject | undefined, offset: number) => {
    if (!curr) {
      throw new Error('Trying to insert a null subject')
    }

    let prev: Subject | undefined = this.getIndexedChild(offset - 1) || this.getLastChild();
    if (!prev) {
      this.setFirstChild(curr)
    } else {
      prev.setNext(curr)
    }

    let next: Subject | undefined = this.getIndexedChild(offset)
    this._children.splice(offset, 0, curr)
    while (curr.getNext()) {
      offset++
      curr = <Subject>(curr.getNext())
      this._children.splice(offset, 0, curr)
    }

    curr.setNext(next)
  }

  public removeChildren = (offset: number, length: number): Subject | undefined => {
    if (length <= 0) {
      throw new Error(`Remove children: offset = ${offset}, length = ${length}`)
    }

    let next: Subject | undefined = this.getIndexedChild(offset + length);
    let prev: Subject | undefined = this.getIndexedChild(offset - 1);
    if (!prev) {
      this.setFirstChild(next);
    } else {
      prev.setNext(next)
    }

    let lastToRemove = this.getIndexedChild(offset + length - 1);
    lastToRemove && lastToRemove.setNext(undefined)

    let curr: Subject | undefined = this.getIndexedChild(offset);
    this._children.splice(offset, length)
    return curr
  }

  public getChildrenNum = (): number => {
    return this._children.length
  }
}

class Root extends Branch {
  constructor(uri: string) {
    super(uri);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
  }

  public toJson(): Element {
    let result = super.toJson();
    let titleJson = { title: this.get('title') }
    return {
      ...result,
      ...titleJson
    }
  }

  public fromQuad(quad: any) {
    if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
      throw new Error('fromQuad: The root node cannot have syblings: ' + this._uri)
    }
    super.fromQuad(quad)
  }

  public setNext(node: Subject | undefined) {
    if (node) {
      throw new Error('setNext: The root node cannot have syblings: ' + this._uri);
    }
    super.setNext(undefined)
  }

  public delete = () => {
    throw new Error('The root node is not removable :' + this._uri);
  }

}

class Leaf extends Subject {
  constructor(uri: string) {
    // TODO: using blank nodes
    super(uri);
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
  }

  public toJson = (): Text => {
    let result = super.toJson();
    return {
      ...result,
      text: this.get('text')
    }
  }

  public insertText = (offset: number, text: string) => {
    const before = this.get('text').slice(0, offset);
    const after = this.get('text').slice(offset);
    this.set({ text: before + text + after });
  }

  public removeText = (offset: number, length: number) => {
    const before = this.get('text').slice(0, offset);
    const removed = this.get('text').slice(offset, length);
    const after = this.get('text').slice(offset + length);
    this.set({ text: before + after });
    return removed
  }
}

const createNode = (uri: string, type: string): Subject => {
  let node: Subject
  if (type === 'http://www.solidoc.net/ontologies#Root') {
    node = new Root(uri)
  } else if (type === 'http://www.solidoc.net/ontologies#Leaf') {
    node = new Leaf(uri)
  } else {
    node = new Branch(uri)
  }
  node.set({ type: type })
  return node
}

export { Branch, Root, Leaf, createNode }
