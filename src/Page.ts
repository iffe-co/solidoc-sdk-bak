import { Branch, Root, Leaf } from './Block';
import { Subject } from './Subject';
import { Graph } from './Graph';

interface Path {
  parentUri: string,
  offset: number
}

class Page extends Graph {
  constructor(uri: string) {
    super(uri);
    this._nodes[uri] = new Root(uri);
  }

  protected _addPlaceHolder = (uri: string, type: string) => {
    this._nodes[uri] || (this._nodes[uri] = (type === 'http://www.solidoc.net/ontologies#Leaf') ? new Leaf(uri) : new Branch(uri));
  }

  public insertNode = (path: Path, node: any) => {
    let parent: Subject = this._getExisting(path.parentUri);
    let currUri: string = this._uri + '#' + node.id
    let curr: Subject = this._nodes[currUri];

    if (currUri === path.parentUri) {
      throw new Error('To insert a node same as the relative: ' + path.parentUri);
    } else if (curr && !curr.isDeleted) {
      throw new Error('Trying to insert an existing node: ' + currUri);
    } else if (curr) {
      this._nodes[currUri].isDeleted = false;
    } else {
      this._addPlaceHolder(currUri, node.type);
      curr = this._nodes[currUri];
    }

    this._insertNode(parent, path.offset, curr);
    this.set(currUri, node)

    for (let i = 0; node.children && i < node.children.length; i++) {
      path = {parentUri: currUri, offset: i};
      this.insertNode(path, node.children[i])
    }
  }

  public deleteNode = (path: Path) => {
    let parent: Subject = this._getExisting(path.parentUri);


    this._deleteNode(parent, path.offset)
  }

  public moveNode = (thisUri: string, preposition: string, relativeUri: string) => {
    let curr: Subject = this._getExisting(thisUri)
    let relative: Subject = this._getExisting(relativeUri)

    if (thisUri === relativeUri) {
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

  for (let i = 0; json.children && i < json.children.length; i++) {
    let path: Path = {parentUri: pageUri, offset: i}
    page.insertNode(path, json.children[i])
  }

  return page
}

export { Page, fromTurtle, fromJson }
