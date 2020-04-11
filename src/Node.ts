import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';
import { Graph } from './Graph'

class Branch extends Subject {
  constructor(uri: string, graph: Graph) {
    super(uri, graph);
    // TODO: type/next can be extract to Subject super()
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode', 'next');
    this._predicates.child = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'child');
    this.isDeleted = false
  }

  public toJson = (): Element => {
    return {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this._predicates['type'].get(),
      children: []
    };
  }

  public setChild = (node: Subject) => {
    this.set({ child: node ? node.get('id') : '' })
  }

  // offset === Infinity => return the last child
  public getChild = (offset: number): Subject => {
    if (offset < 0) {
      throw new Error(`Trying to getChild(${offset}) of ${this._uri}`);
    }

    let childUri: string = this.get('child');
    let child: Subject = this._graph.getSubject(childUri);

    if (offset < Infinity) {
      while (offset > 0 && child) {
        child = child.getNext()
        offset--
      }
    } else {
      while (child.getNext()) {
        child = child.getNext()
      }
    }
    return child;
  }
}

class Root extends Branch {
  constructor(uri: string, graph: Graph) {
    super(uri, graph);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
  }

  public toJson = (): Element => {
    return {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this._predicates['type'].get(),
      title: this._predicates['title'].get(),
      children: []
    };
  }
}

class Leaf extends Subject {
  constructor(uri: string, graph: Graph) {
    // TODO: remove uri property
    super(uri, graph);
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextNode', 'next');
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
    this.isDeleted = false
  }

  public toJson = (): Text => {
    return {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this._predicates['type'].get(),
      text: this._predicates['text'].get(),
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

interface Text {
  text: string
  [key: string]: any
}
interface Element {
  children: Node[]
  [key: string]: any
}
type Node = Text | Element

const Process = {
  attach: (curr: Subject, parent: Branch, offset: number) => {
    if (offset === 0) {
      let child: Subject = parent.getChild(0)
      parent.setChild(curr)
      curr.setNext(child)
    } else {
      let prev: Subject = parent.getChild(offset - 1) || parent.getChild(Infinity);
      let next: Subject = prev.getNext()
      prev.setNext(curr)
      curr.setNext(next)
    }
  },

  detach: (parent: Branch, offset: number): Subject => {
    let curr: Subject = parent.getChild(offset);
    if (!curr) return curr
    if (offset === 0) {
      parent.setChild(curr.getNext());
    } else {
      // TODO: traversed twice
      let prev: Subject = parent.getChild(offset - 1);
      prev.setNext(curr.getNext())
    }
    return curr
  },

  removeRecursive: (head: Subject) => {
    head.isDeleted = true

    let curr = (head instanceof Branch) ? head.getChild(0) : undefined;
    while (curr) {
      Process.removeRecursive(curr);
      curr = curr.getNext()
    }
  },

  isAncestor: (from: Subject, to: Subject): boolean => {
    if (from === to) return true

    let curr = (from instanceof Branch) ? from.getChild(0) : undefined;
    while (curr) {
      if (Process.isAncestor(curr, to)) return true
      curr = curr.getNext();
    }
    return false
  },
}

export { Branch, Root, Leaf, Text, Element, Node, Process }
