import { Branch, Root, Leaf } from './Block';
import { Subject } from './Subject';
import { Graph } from './Graph';

class Page extends Graph {
  constructor(uri: string) {
    super(uri);
    this._nodes[uri] = new Root(uri);
  }

  protected _addPlaceHolder = (uri: string, type: string) => {
    this._nodes[uri] || (this._nodes[uri] = (type === 'http://www.solidoc.net/ontologies#Leaf') ? new Leaf(uri) : new Branch(uri));
  }

  public insertNode = (node: any, preposition: string, relativeUri: string) => {
    let relative: Subject = this._nodes[relativeUri];
    let currUri: string = this._uri + '#' + node.id
    let curr: Subject = this._nodes[currUri];

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert node`);
    } else if (!relative || relative.isDeleted) {
      throw new Error('The relative node does not exist: ' + relativeUri);
    } else if (currUri === relativeUri) {
      throw new Error('To insert a node same as the relative: ' + relativeUri);
    } else if (curr && !curr.isDeleted) {
      throw new Error('Trying to insert an existing node: ' + currUri);
    } else if (curr) {
      this._nodes[currUri].isDeleted = false;
    } else {
      this._addPlaceHolder(currUri, node.type);
      curr = this._nodes[currUri];
    }

    if (preposition === 'after') {
      this._insertNodeAfter(relative, curr)
    } else if (preposition === 'below') {
      this._insertNodeBelow(relative, curr)
    }
    this.set(currUri, node)

    if (!node.children || node.children.length === 0) return

    this.insertNode(node.children[0], 'below', currUri)
    for (let i = 1; i < node.children.length; i++) {
      this.insertNode(node.children[i], 'after', this._uri + '#' + node.children[i - 1].id)
    }
  }

  public deleteNode = (thisUri: string) => {
    let curr: Subject = this._nodes[thisUri];

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for delete node`);
    } else if (thisUri === this._uri) {
      throw new Error('Trying to delete the root node: ' + thisUri);
    } else if (!this._nodes[thisUri]) {
      throw new Error('The node is already deleted: ' + thisUri);
    }

    this._deleteNode(curr)
  }

  public moveNode = (thisUri: string, preposition: string, relativeUri: string) => {
    let curr: Subject = this._nodes[thisUri]
    let relative: Subject = this._nodes[relativeUri]

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert node`);
    } else if (curr && curr.isDeleted) {
      throw new Error('Trying to move a deleted node: ' + thisUri);
    } else if (!relative || relative.isDeleted) {
      throw new Error('The relative node does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('The moving node is the same as the relative: ' + relativeUri);
    }

    this._moveNode(curr, preposition, relative);
  }
}

const fromTurtle = (uri: string, turtle: string): Page => {
  const page: Page = new Page(uri);
  page.fromTurtle(turtle);
  return page
}

const fromJson = (json: any): Page => {
  let pageUri: string = json.id
  const page: Page = new Page(pageUri)
  page.fromTurtle('')
  page.set(pageUri, { title: json.title });
  page.set(pageUri, { type: json.type });

  if (!json.children || json.children.length === 0) return page

  page.insertNode(json.children[0], 'below', pageUri)
  for (let i = 1; i < json.children.length; i++) {
    page.insertNode(json.children[i], 'after', pageUri + '#' + json.children[i - 1].id)
  }

  return page
}

export { Page, fromTurtle, fromJson }
