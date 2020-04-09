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
  // In case of no child, the function returns undefined
  // otherwise it return the offset-th child, or undefined if offset > length
  private _getChild = (curr: Branch, offset: number): Subject => {
    let childUri: string = curr.get('child');
    let child: Subject = this._nodes[childUri];
    while (offset > 0 && child) {
      child = this._getNext(child)
      offset--
    }
    return child;
  }
  private _getLastChild = (curr: Subject): Subject => {
    let childUri: string = curr.get('child');
    let child: Subject = this._nodes[childUri];
    while (this._getNext(child)) {
      child = this._getNext(child)
    }
    return child;
  }
  protected _getExistingBranch = (uri: string): Branch => {
    let node = this._nodes[uri];
    if (!node || node.isDeleted) {
      throw new Error('The node does not exist: ' + uri);
    } else if (!(node instanceof Branch) ) {
      throw new Error('The request node is not a branch: ' + uri)
    }
    return node;
  }

  public toJson = (head?: Subject ): any => {
    if (!head) head = this._getRoot();
    const headJson = head.toJson();
    let curr = (head instanceof Branch) ? this._getChild(head, 0) : undefined;

    while (curr) {
      let nodeJson = this.toJson(curr)
      headJson.children.push(nodeJson)

      curr = this._getNext(curr);
    }

    return headJson
  }

  public insertNode = (path: Path, node: any) => {
    let parent: Branch = this._getExistingBranch(path.parentUri);
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

  private _insertNode = (parent: Branch, offset: number, curr: Subject) => {
    if (offset === 0) {
      let child: Subject = this._getChild(parent, 0)
      parent.setChild(curr)
      curr.setNext(child)
    } else {
      let prev: Subject = this._getChild(parent, offset - 1) || this._getLastChild(parent);
      let next: Subject = this._getNext(prev)
      prev.setNext(curr)
      curr.setNext(next)
    }
  }

  public deleteNode = (path: Path) => {
    let parent: Branch = this._getExistingBranch(path.parentUri);

    this._deleteNode(parent, path.offset)
  }

  private _deleteNode = (parent: Branch, offset: number) => {
    let curr: Subject = this._getChild(parent, offset);
    if (!curr) return

    this._detach(curr, parent, offset);
    this._traversePreOrder(curr, this._markAsDeleted);
  }

  private _detach = (curr: Subject, parent: Branch, offset: number) => {
    let next: Subject = this._getNext(curr);
    if (offset === 0) {
      parent.setChild(next);
    } else {
      let prev: Subject = this._getChild(parent, offset - 1);
      prev.setNext(next)
    }
  }

  private _traversePreOrder = (head: Subject, doSomething: (curr: Subject, target?: any) => boolean, target?: any): boolean => {
    let res = doSomething(head, target);
    if (res) return res

    let curr = (head instanceof Branch) ? this._getChild(head, 0) : undefined;

    while (curr) {
      let res = this._traversePreOrder(curr, doSomething, target);
      if (res) return res
      curr = this._getNext(curr)
    }

    return res
  }

  private _markAsDeleted = (curr: Subject): boolean => {
    curr.isDeleted = true
    return false
  }

  public moveNode = (oldPath: Path, newPath: Path) => {
    let oldParent: Branch = this._getExistingBranch(oldPath.parentUri);
    let newParent: Branch = this._getExistingBranch(newPath.parentUri);

    this._moveNode(oldParent, oldPath.offset, newParent, newPath.offset);
  }

  private _moveNode = (oldParent: Branch, oldOffset: number, newParent: Branch, newOffset: number) => {
    let curr: Subject = this._getChild(oldParent, oldOffset);
    if (!curr) return;

    if (curr === newParent || this._traversePreOrder(curr, this._findDescendent, newParent)) {
      throw new Error('Trying to append the node to itself or its descendent')
    }

    this._detach(curr, oldParent, oldOffset);

    if (oldParent === newParent && oldOffset < newOffset) {
      newOffset = newOffset - 1;
    }
    this._insertNode(newParent, newOffset, curr);
  }

  private _findDescendent = (curr: Subject, target: Subject): boolean => {
    return (curr instanceof Branch) ? (this._getChild(curr, 0) === target) : false
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
