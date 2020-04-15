import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';

class Branch extends Subject {
  private _children: Subject[] = [];

  constructor(uri: string) {
    super(uri);
    this._predicates.child = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'child');
  }

  public toJson = (): Element => {
    let option = JSON.parse(this.get('option') || '{}')
    return {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this.get('type'),
      children: [],
      ...option
    };
  }

  private setChild = (node: Subject | null) => {
    this.set({ child: node ? node.get('id') : '' })
  }

  public getChild = (offset: number): Subject => {
    if (offset < 0) {
      throw new Error(`Trying to getChild(${offset}) of ${this._uri}`);
    }
    (offset === Infinity) && (offset = this._children.length - 1);
    return this._children[offset]
  }

  public insertChild = (curr: Subject, offset: number) => {
    if (offset === 0) {
      this.setChild(curr)
    } else {
      let prev: Subject = this.getChild(offset - 1) || this.getChild(Infinity);
      prev.setNext(curr)
    }
    let next: Subject = this.getChild(offset)
    curr.setNext(next)
    this._children.splice(offset, 0, curr)
  }

  public removeChild = (offset: number): Subject => {
    let curr: Subject = this.getChild(offset);
    if (!curr) return curr
    let next: Subject = this.getChild(offset + 1);
    if (offset === 0) {
      this.setChild(next);
    } else {
      let prev: Subject = this.getChild(offset - 1);
      prev.setNext(next)
    }
    this._children.splice(offset, 1)
    return curr
  }

  public appendChildren = (curr: Subject) => {
    let last: Subject = this.getChild(Infinity)
    if (last) {
      last.setNext(curr)
    } else {
      this.setChild(curr)
    }
    this._children.push(curr)
    let node: Subject | null = curr.getNext()
    while (node) {
      this._children.push(node)
      node = node.getNext()
    }
  }

  public detachChildren = (offset: number): Subject => {
    if (offset === 0) {
      this.setChild(null);
    } else {
      let prev: Subject = this.getChild(offset - 1);
      prev.setNext(null)
    }
    let curr: Subject = this.getChild(offset);
    this._children = this._children.slice(0, offset)
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

  public toJson = (): Element => {
    let option = JSON.parse(this.get('option') || '{}')
    return {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this.get('type'),
      title: this.get('title'),
      children: [],
      ...option
    };
  }
}

class Leaf extends Subject {
  constructor(uri: string) {
    // TODO: using blank nodes
    super(uri);
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
  }

  public toJson = (): Text => {
    let option = JSON.parse(this.get('option') || '{}')
    return {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this.get('type'),
      text: this.get('text'),
      ...option
    };
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
  if (type === 'http://www.solidoc.net/ontologies#Root') {
    return new Root(uri)
  } else if (type === 'http://www.solidoc.net/ontologies#Leaf') {
    return new Leaf(uri)
  } else {
    return new Branch(uri)
  }
}

export { Branch, Root, Leaf, createNode }
