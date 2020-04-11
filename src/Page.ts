import { Branch, Root, Leaf, Node, Element, Process } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation } from './operation'

class Page extends Graph {
  constructor(json: Element) {
    super(json.id);
    this._insertNodeCascaded(json);
  }

  private _insertNodeCascaded = (json: Node, parent?: Branch, offset?: number) => {
    let currUri: string = (parent) ? this._uri + '#' + json.id : json.id
    let curr: Subject = this._addPlaceHolder(currUri, json.type);
    curr.set(json);

    parent && Process.attach(curr, parent, <number>offset);

    // TODO: this is O(n^2) complexity since attach() is O(n)
    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      this._insertNodeCascaded(json.children[i], curr, i)
    }
  }

  protected _addPlaceHolder = (uri: string, type?: string): Subject => {
    if (this._nodes[uri] && !this._nodes[uri].isDeleted) {
      throw new Error('Trying to add an existing node: ' + uri);
    }
    // even if a marked-removed node exists, it should be recreated
    if (uri === this._uri) {
      this._nodes[uri] = new Root(uri, this)
    } else if (type === 'http://www.solidoc.net/ontologies#Leaf') {
      this._nodes[uri] = new Leaf(uri, this)
    } else {
      this._nodes[uri] = new Branch(uri, this)
    }
    return this._nodes[uri];
  }

  protected _getBranchInstance = (uri: string): Branch => {
    let node = this._nodes[uri];
    if (!node || node.isDeleted) {
      throw new Error('The node does not exist: ' + uri);
    } else if (!(node instanceof Branch)) {
      throw new Error('The request node is not a branch: ' + uri)
    }
    return node;
  }
  protected _getLeafInstance = (path: Path): Leaf => {
    let parent: Branch = this._getBranchInstance(path.parentUri);
    let node = parent.getChild(path.offset)
    if (!node || node.isDeleted) {
      throw new Error('The node does not exist: ' + path.parentUri + ' offset = ' + path.offset);
    } else if (!(node instanceof Leaf)) {
      throw new Error('The request node is not a branch: ' + path.parentUri + ' offset = ' + path.offset)
    }
    return node;
  }

  public toJson = (head?: Subject): Node => {
    if (!head) head = this._getRoot();
    const headJson = head.toJson();
    let curr = (head instanceof Branch) ? head.getChild(0) : undefined;

    while (curr) {
      let nodeJson = this.toJson(curr)
      headJson.children.push(nodeJson)

      curr = curr.getNext()
    }

    return headJson
  }

  private _removeNode = (path: Path) => {
    let parent: Branch = this._getBranchInstance(path.parentUri);
    let curr: Subject = parent.getChild(path.offset);
    if (!curr) return

    Process.detach(curr, parent, path.offset);
    this._traversePreOrder(curr, this._markAsRemoved);
  }

  private _traversePreOrder = (head: Subject, doSomething: (curr: Subject, target?: any) => boolean, target?: any): boolean => {
    let res = doSomething(head, target);
    if (res) return res

    let curr = (head instanceof Branch) ? head.getChild(0) : undefined;

    while (curr) {
      let res = this._traversePreOrder(curr, doSomething, target);
      if (res) return res
      curr = curr.getNext()
    }

    return res
  }

  private _markAsRemoved = (curr: Subject): boolean => {
    curr.isDeleted = true
    return false
  }

  private _moveNode = (oldPath: Path, newPath: Path) => {
    let oldParent: Branch = this._getBranchInstance(oldPath.parentUri);
    let newParent: Branch = this._getBranchInstance(newPath.parentUri);

    let curr: Subject = oldParent.getChild(oldPath.offset);
    if (!curr) return;

    if (curr === newParent || this._traversePreOrder(curr, this._findDescendent, newParent)) {
      throw new Error('Trying to append the node to itself or its descendent')
    }

    Process.detach(curr, oldParent, oldPath.offset);

    if (oldParent === newParent && oldPath.offset < newPath.offset) {
      newPath.offset--;
    }
    Process.attach(curr, newParent, newPath.offset);
  }

  private _findDescendent = (curr: Subject, target: Subject): boolean => {
    return (curr instanceof Branch) ? (curr.getChild(0) === target) : false
  }

  public apply(op: Operation) {
    switch (op.type) {
      case 'insert_node': {
        let parent: Branch = this._getBranchInstance(op.path.parentUri);
        this._insertNodeCascaded(op.node, parent, op.path.offset)
        break
      }

      case 'insert_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.insertText(op.offset, op.text)
        break
      }

      case 'merge_node': {

        break
      }

      case 'move_node': {
        this._moveNode(op.path, op.newPath)
        break
      }

      case 'remove_node': {
        this._removeNode(op.path)
        break
      }

      case 'remove_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.removeText(op.offset, op.text.length);
        break
      }

      case 'set_node': {

        break
      }

      case 'split_node': {

        break
      }

      default: {
        break
      }

    }
  }
}

export { Page, Path, Operation }
