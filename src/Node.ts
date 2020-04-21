import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';
import { Element, Node } from './interface'

class Branch extends Subject {
  private _children: Subject[] = [];

  constructor(id: string) {
    super(id);
    this._predicates.firstChild = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'firstChild');
  }

  public toJson(): Element {
    let result = super.toJson()

    result.children = []
    this._children.forEach(child => {
      result.children.push(child.toJson())
    })

    return result
  }

  public toBlankJson(): Element {
    return {
      ...super.toJson(),
      children: []
    }
  }

  private setFirstChild = (node: Subject | undefined) => {
    this.set({ firstChild: node ? node.get('id') : '' })
  }

  public getIndexedChild(offset: number): Subject | undefined {
    return this._children[offset]
  }
  public getLastChild = (): Subject | undefined => {
    return this._children[this._children.length - 1]
  }

  public attachChildren(curr: Subject | undefined, offset: number) {
    if (!curr) {
      throw new Error('Trying to insert a null subject')
    }

    offset = (offset < 0) ? 0 : offset

    let prev: Subject | undefined = (offset === 0) ? undefined : (this.getIndexedChild(offset - 1) || this.getLastChild());
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

  public detachChildren(offset: number, length: number): Subject | undefined {
    if (length <= 0) {
      // TODO: allow length === 0 ??
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

  public isAncestor = (to: Subject): boolean => {
    if (this === to) return true

    // TODO: use map??
    for (let i = 0; i < this.getChildrenNum(); i++) {
      let curr = this.getIndexedChild(i)
      if (curr instanceof Branch && curr.isAncestor(to)) return true
    }
    return false
  }

  public undo(nodeMap: Map<string, Subject>) {
    super.undo(nodeMap);
    this._children = []
  }

}

class Root extends Branch {
  constructor(id: string) {
    super(id);
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

  public fromQuad(quad: any, nodeMap: Map<string, Subject>) {
    if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
      throw new Error('fromQuad: The root node cannot have syblings: ' + this._id)
    }
    super.fromQuad(quad, nodeMap)
  }

  public setNext(node: Subject | undefined) {
    if (node) {
      throw new Error('setNext: The root node cannot have syblings: ' + this._id);
    }
    super.setNext(undefined)
  }

  public delete = () => {
    throw new Error('The root node is not removable :' + this._id);
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

  public toBlankJson(): Element {
    return {
      ...super.toJson(),
      text: ''
    }
  }

  public getIndexedChild(offset: number): string {
    return this.get('text').charAt(offset)
  }

  public attachChildren(text: string, offset: number) {
    const before = this.get('text').slice(0, offset);
    const after = this.get('text').slice(offset);
    this.set({ text: before + text + after });
  }

  public detachChildren(offset: number, length: number): string {
    const before = this.get('text').slice(0, offset);
    const removed = this.get('text').slice(offset, length);
    const after = this.get('text').slice(offset + length);
    this.set({ text: before + after });
    return removed
  }
}

const createNode = (json: Node, nodeMap: Map<string, Subject>): Subject => {
  let node: Subject
  switch (json.type) {
    case 'http://www.solidoc.net/ontologies#Root':
      node = new Root(json.id)
      break
    case 'http://www.solidoc.net/ontologies#Leaf':
      node = new Leaf(json.id)
      break
    default:
      node = new Branch(json.id)
      break
  }
  node.set(json)
  nodeMap.set(json.id, node)
  return node
}

export { Branch, Root, Leaf, createNode }
