import { Branch, Leaf, createNodes } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation, Element } from './interface'


class Page extends Graph {
  constructor(uri: string, turtle: string) {
    super(uri, turtle);
    this._assembleTree(this.getRoot(), this._nodeMap)
  }

  private _getBranchInstance = (uri: string): Branch => {
    let node = this._nodeMap.get(uri);
    if (!node || node.isDeleted()) {
      throw new Error('The node does not exist: ' + uri);
    } else if (!(node instanceof Branch)) {
      throw new Error('The request node is not a branch: ' + uri)
    }
    return node;
  }
  private _getLeafInstance = (path: Path): Leaf => {
    let parent: Branch = this._getBranchInstance(path.parentUri);
    let node = parent.getIndexedChild(path.offset)
    if (!node || node.isDeleted()) {
      throw new Error('The node does not exist: ' + path.parentUri + ' offset = ' + path.offset);
    } else if (!(node instanceof Leaf)) {
      throw new Error('The request node is not a branch: ' + path.parentUri + ' offset = ' + path.offset)
    }
    return node;
  }

  public toJson = (): Element => {
    let head = this.getRoot();
    return head?.toJson()
  }

  private _assembleTree = (head: Subject | undefined, nodeMap: Map<string, Subject>) => {
    if (!(head instanceof Branch)) return

    let currUri = head.get('firstChild');
    let curr: Subject | undefined = nodeMap.get(currUri)
    curr && head.attachChildren(curr, 0)

    while (curr) {
      this._assembleTree(curr, nodeMap);
      curr = curr.getNext()
    }
  }

  public apply = (op: Operation) => {
    switch (op.type) {
      case 'insert_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr = createNodes(op.node, this._nodeMap);
        parent.attachChildren(curr, op.path.offset);
        break
      }

      case 'remove_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject | undefined = parent.detachChildren(op.path.offset, 1);
        curr && curr.delete();
        break
      }

      case 'move_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const newParent: Branch = this._getBranchInstance(op.newPath.parentUri);

        const curr: Subject | undefined = parent.detachChildren(op.path.offset, 1);
        if (!curr) {
          throw new Error('No such node')
        }

        if (curr instanceof Branch && curr.isAncestor(newParent)) {
          parent.attachChildren(curr, op.path.offset);
          throw new Error('Trying to append the node to itself or its descendent')
        }

        newParent.attachChildren(curr, op.newPath.offset);
        break
      }

      case 'merge_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const prev: Subject | undefined = parent.getIndexedChild(op.path.offset - 1);
        const curr = prev?.merge();
        parent.detachChildren(op.path.offset, 1)
        curr && curr.delete()
        break
      }

      case 'split_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject | undefined = parent.getIndexedChild(op.path.offset);
        const next = curr?.split(op.position, op.properties, this._nodeMap);
        parent.attachChildren(next, op.path.offset + 1);
        break
      }

      case 'set_node': {
        let curr: Subject | undefined
        if (op.path.parentUri) {
          const parent: Branch = this._getBranchInstance(op.path.parentUri);
          curr = parent.getIndexedChild(op.path.offset);
        } else {
          curr = this.getRoot()
        }
        // TODO: disallow setting id/text/children/next/option
        if (!curr) {
          throw new Error('No such node: ' + op.path.parentUri + op.path.offset)
        }

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
