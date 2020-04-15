import { Branch, Root, Leaf, Process } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation, Element } from './interface'

class Page extends Graph {
  constructor(json: Element) {
    super(json.id);
    let curr: Subject = new Root(json.id, this)
    curr.set(json);
    this.registerNode(curr);

    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      Process.insertRecursive(json.children[i], this, curr, i)
    }
  }

  protected _addPlaceHolder = (uri: string, type?: string): Subject => {
    if (this._nodes[uri] && !this._nodes[uri].isDeleted()) {
      throw new Error('Trying to add an existing node: ' + uri);
    }
    // even if a marked-removed node exists, it should be recreated
    if (uri === this.getUri()) {
      this._nodes[uri] = new Root(uri, this)
    } else if (type === 'http://www.solidoc.net/ontologies#Leaf') {
      this._nodes[uri] = new Leaf(uri, this)
    } else {
      this._nodes[uri] = new Branch(uri, this)
    }
    return this._nodes[uri];
  }

  private _getBranchInstance = (uri: string): Branch => {
    let node = this._nodes[uri];
    if (!node || node.isDeleted()) {
      throw new Error('The node does not exist: ' + uri);
    } else if (!(node instanceof Branch)) {
      throw new Error('The request node is not a branch: ' + uri)
    }
    return node;
  }
  private _getLeafInstance = (path: Path): Leaf => {
    let parent: Branch = this._getBranchInstance(path.parentUri);
    let node = parent.getChild(path.offset)
    if (!node || node.isDeleted()) {
      throw new Error('The node does not exist: ' + path.parentUri + ' offset = ' + path.offset);
    } else if (!(node instanceof Leaf)) {
      throw new Error('The request node is not a branch: ' + path.parentUri + ' offset = ' + path.offset)
    }
    return node;
  }

  public toJson = (): Element => {
    let head = this._getRoot();
    return <Element>(Process.toJson(head))
  }

  public apply = (op: Operation) => {
    switch (op.type) {
      case 'insert_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        Process.insertRecursive(op.node, this, parent, op.path.offset)
        break
      }

      case 'remove_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject = parent.removeChild(op.path.offset);
        curr && Process.removeRecursive(curr);
        break
      }

      case 'move_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const newParent: Branch = this._getBranchInstance(op.newPath.parentUri);

        const curr: Subject = parent.removeChild(op.path.offset);

        if (Process.isAncestor(curr, newParent)) {
          parent.insertChild(curr, op.path.offset);
          throw new Error('Trying to append the node to itself or its descendent')
        }

        newParent.insertChild(curr, op.newPath.offset);
        break
      }

      case 'merge_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const prev: Subject = parent.getChild(op.path.offset - 1);
        const curr: Subject = parent.getChild(op.path.offset);

        if (prev instanceof Leaf && curr instanceof Leaf) {
          prev.insertText(Infinity, curr.get('text'));
        } else if (prev instanceof Branch && curr instanceof Branch) {
          let child: Subject = curr.detachChildren(0);
          prev.appendChildren(child)
        } else {
          throw new Error(`Cannot merge.`);
        }
        parent.removeChild(op.path.offset)
        break
      }

      case 'split_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject = parent.getChild(op.path.offset);
        if (curr instanceof Leaf) {
          let clipped: string = curr.removeText(op.position, Infinity);
          let json = {
            ...Process.toJson(curr),
            ...op.properties,
            text: clipped
          }
          Process.insertRecursive(json, this, parent, op.path.offset + 1)
        } else {
          let child: Subject = (<Branch>curr).detachChildren(op.position);
          let json = {
            ...Process.toJson(curr),
            ...op.properties,
            children: []
          }
          let next: Subject = Process.insertRecursive(json, this, parent, op.path.offset + 1);
          (<Branch>next).appendChildren(child)
        }
        break
      }

      case 'set_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject = parent.getChild(op.path.offset);
        // TODO: disallow setting id/text/children/next
        curr.set(op.newProperties)
        break
      }

      case 'insert_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.insertText(op.offset, op.text)
        break
      }

      case 'remove_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.removeText(op.offset, op.text.length);
        break
      }

      default: {
        break
      }

    }
  }
}

export { Page, Path, Operation }
