import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';
import { Graph } from './Graph'

class Branch extends Subject {
  private _children: Subject[] = [];

  constructor(uri: string, graph: Graph) {
    super(uri, graph);
    this._predicates.firstChild = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'firstChild');
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

  private setFirstChild = (node: Subject | undefined) => {
    this.set({ firstChild: node ? node.get('id') : '' })
  }

  public getIndexedChild = (offset: number): Subject | undefined=> {
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
    if (offset === 0 || !prev) {
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
      throw new Error('Remove children length = ' + length)
    }

    let next: Subject | undefined = this.getIndexedChild(offset + length);
    let prev: Subject | undefined = this.getIndexedChild(offset - 1);
    if (offset === 0 || !prev) {
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

  public fromQuad(quad: any) {
    if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
      throw new Error('fromQuad: The root node cannot have syblings: ' + this._uri)
    }
    super.fromQuad(quad)
  }

  public set(props: any) {
    if (Object.keys(props).includes('next')) {
      throw new Error('set: The root node cannot have syblings: ' + this._uri);
    }
    super.set(props)
  }

  public setNext = (node: Subject | undefined) => {
    throw new Error('setNext: The root node cannot have syblings: ' + this._uri + node?.get('id'));
  }

  public delete = () => {
    throw new Error('The root node is not removable :' + this._uri);
  }

}

class Leaf extends Subject {
  constructor(uri: string, graph: Graph) {
    // TODO: using blank nodes
    super(uri, graph);
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



export { Branch, Root, Leaf }
