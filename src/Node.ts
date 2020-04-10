import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';

class Branch extends Subject {
  constructor(uri: string) {
    super(uri);
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
}

class Root extends Branch {
  constructor(uri) {
    super(uri);
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
  constructor(uri: string) {
    // TODO: remove uri property
    super(uri);
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
