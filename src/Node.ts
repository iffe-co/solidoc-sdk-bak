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

  public getChild = (offset: number): Subject => {
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
    const after = this.get('text').slice(offset + length);
    this.set({ text: before + after });
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

export { Branch, Root, Leaf, Text, Element, Node }
