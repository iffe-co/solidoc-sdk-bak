import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';
import { Graph } from './Graph'

class Branch extends Subject {
  public children: Subject[] = []; // TODO: make it private

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

  private setChild = (node: Subject) => {
    this.set({ child: node ? node.get('id') : '' })
  }

  public getChild = (offset: number): Subject => {
    if (offset < 0) {
      throw new Error(`Trying to getChild(${offset}) of ${this._uri}`);
    }
    (offset === Infinity) && (offset = this.children.length - 1);
    return this.children[offset]
  }

  public attach = (curr: Subject, offset: number) => {
    if (offset === 0) {
      this.setChild(curr)
    } else {
      let prev: Subject = this.getChild(offset - 1) || this.getChild(Infinity);
      prev.setNext(curr)
    }
    let next: Subject = this.getChild(offset)
    curr.setNext(next)
    this.children.splice(offset, 0, curr)
  }

  public detach = (offset: number): Subject => {
    let curr: Subject = this.getChild(offset);
    if (!curr) return curr
    let next: Subject = this.getChild(offset + 1);
    if (offset === 0) {
      this.setChild(next);
    } else {
      let prev: Subject = this.getChild(offset - 1);
      prev.setNext(next)
    }
    this.children.splice(offset, 1)
    return curr
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
  removeRecursive: (head: Subject) => {
    head.isDeleted = true

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.children.length; i++) {
      Process.removeRecursive(head.children[i])
    }
  },

  isAncestor: (from: Subject, to: Subject): boolean => {
    if (from === to) return true

    // TODO: use map??
    for (let i = 0; from instanceof Branch && i < from.children.length; i++) {
      let curr = from.children[i]
      if (Process.isAncestor(curr, to)) return true
    }
    return false
  },
}

export { Branch, Root, Leaf, Process }
