import { Branch, Root, Leaf, Node, Element } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation} from './operation'

class Page extends Graph {
  constructor(json: Element) {
    super(json.id);
    let head: Subject = this._addPlaceHolder(json.id);
    this._fillNode(head, json)
  }

  protected _addPlaceHolder = (uri: string, type?: string): Subject => {
    if (this._nodes[uri] && !this._nodes[uri].isDeleted) {
      throw new Error('Trying to add an existing node: ' + uri);
    }
    // even if a marked-removed node exists, it should be recreated
    if (uri === this._uri) {
      this._nodes[uri] = new Root(uri)
    } else if (type === 'http://www.solidoc.net/ontologies#Leaf') {
      this._nodes[uri] = new Leaf(uri)
    } else {
      this._nodes[uri] = new Branch(uri)
    }
    return this._nodes[uri];
  }
  private _fillNode = (node: Subject, json: Node) => {
    node.set(json);
    for (let i = 0; json.children && i < json.children.length; i++) {
      let path: Path = { parentUri: node.get('id'), offset: i }
      this._insertNode(path, json.children[i])
    }
  }

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
    } else if (!(node instanceof Branch)) {
      throw new Error('The request node is not a branch: ' + uri)
    }
    return node;
  }

  public toJson = (head?: Subject): Node => {
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

  private _insertNode = (path: Path, node: Node) => {
    let parent: Branch = this._getExistingBranch(path.parentUri);
    let currUri: string = this._uri + '#' + node.id
    let curr: Subject = this._addPlaceHolder(currUri, node.type);

    this._attach(curr, parent, path.offset);

    this._fillNode(curr, node);
  }

  public removeNode = (path: Path) => {
    let parent: Branch = this._getExistingBranch(path.parentUri);
    let curr: Subject = this._getChild(parent, path.offset);
    if (!curr) return

    this._detach(curr, parent, path.offset);
    this._traversePreOrder(curr, this._markAsRemoved);
  }

  private _attach = (curr: Subject, parent: Branch, offset: number) => {
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

  private _markAsRemoved = (curr: Subject): boolean => {
    curr.isDeleted = true
    return false
  }

  public moveNode = (oldPath: Path, newPath: Path) => {
    let oldParent: Branch = this._getExistingBranch(oldPath.parentUri);
    let newParent: Branch = this._getExistingBranch(newPath.parentUri);

    let curr: Subject = this._getChild(oldParent, oldPath.offset);
    if (!curr) return;

    if (curr === newParent || this._traversePreOrder(curr, this._findDescendent, newParent)) {
      throw new Error('Trying to append the node to itself or its descendent')
    }

    this._detach(curr, oldParent, oldPath.offset);

    if (oldParent === newParent && oldPath.offset < newPath.offset) {
      newPath.offset--;
    }
    this._attach(curr, newParent, newPath.offset);
  }

  private _findDescendent = (curr: Subject, target: Subject): boolean => {
    return (curr instanceof Branch) ? (this._getChild(curr, 0) === target) : false
  }

  public apply(op: Operation) {
    switch (op.type) {
      case 'insert_node': {
        this._insertNode(op.path, op.node)
        break
      }

      case 'insert_text': {

        break
      }

      case 'merge_node': {

        break
      }

      case 'move_node': {

        break
      }

      case 'remove_node': {

        break
      }

      case 'remove_text': {

        break
      }

      case 'set_node': {

        break
      }

      case 'set_selection': {

        break
      }

      case 'split_node': {

        break
      }
    }
  }
}

export { Page, Path, Operation }
