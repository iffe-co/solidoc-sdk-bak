import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';
import { Graph } from './Graph'
import { Node } from './interface'

class Branch extends Subject {
  private _children: Subject[] = [];

  constructor(uri: string, graph: Graph) {
    super(uri, graph);
    this._predicates.child = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'child');
    this.isDeleted = false
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
    while (curr.getNext()) {
      curr = curr.getNext()
      this._children.push(curr)
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
  constructor(uri: string, graph: Graph) {
    super(uri, graph);
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
  constructor(uri: string, graph: Graph) {
    // TODO: remove uri property
    super(uri, graph);
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
    this.isDeleted = false
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

const Process = {
  toJson: (head: Subject): Node => {
    const headJson = head.toJson();

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      if (i == 0 && head.get('child') !== head.getChild(i).get('id')) {
        throw new Error('first child error')
      } else if (i < head.getChildrenNum() - 1 && head.getChild(i).get('next') !== head.getChild(i + 1).get('id')) {
        throw new Error('next error')
      }
      headJson.children.push(Process.toJson(head.getChild(i)))
    }

    return headJson
  },

  removeRecursive: (head: Subject) => {
    head.isDeleted = true

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      Process.removeRecursive(head.getChild(i))
    }
  },

  isAncestor: (from: Subject, to: Subject): boolean => {
    if (from === to) return true

    // TODO: use map??
    for (let i = 0; from instanceof Branch && i < from.getChildrenNum(); i++) {
      let curr = from.getChild(i)
      if (Process.isAncestor(curr, to)) return true
    }
    return false
  },
}

export { Branch, Root, Leaf, Process }
