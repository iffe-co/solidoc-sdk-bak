import { Branch, Leaf } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Exec } from './Exec'
import { Path, Operation, Element } from './interface'


class Page extends Graph {
  constructor(id: string, turtle: string) {
    super(id, turtle);
    this._assembleTree(this.getRoot(), this._nodeMap)
  }

  private _getBranchInstance = (id: string): Branch => {
    let node = this._nodeMap.get(id);
    if (!node || node.isDeleted()) {
      throw new Error('The node does not exist: ' + id);
    } else if (!(node instanceof Branch)) {
      throw new Error('The request node is not a branch: ' + id)
    }
    return node;
  }
  private _getLeafInstance = (path: Path): Leaf => {
    let parent: Branch = this._getBranchInstance(path.parentId);
    let node = parent.getIndexedChild(path.offset)
    if (!node || node.isDeleted()) {
      throw new Error('The node does not exist: ' + path.parentId + ' offset = ' + path.offset);
    } else if (!(node instanceof Leaf)) {
      throw new Error('The request node is not a branch: ' + path.parentId + ' offset = ' + path.offset)
    }
    return node;
  }

  public toJson = (): Element => {
    let head = this.getRoot();
    return head?.toJson()
  }

  private _assembleTree = (head: Subject | undefined, nodeMap: Map<string, Subject>) => {
    if (!(head instanceof Branch)) return

    let currId = head.get('firstChild');
    let curr: Subject | undefined = nodeMap.get(currId)
    curr && head.attachChildren(curr, 0)

    while (curr) {
      this._assembleTree(curr, nodeMap);
      curr = curr.getNext()
    }
  }

  public apply = (op: Operation) => {
    switch (op.type) {
      case 'insert_node': {
        Exec.insertNodeRecursive(op.node, op.path, this._nodeMap);
        break
      }

      case 'remove_node': {
        Exec.removeNodeRecursive(op.path, this._nodeMap)
        break
      }

      case 'move_node': {
        Exec.moveNode(op.path, 1, op.newPath, this._nodeMap)
        break
      }

      case 'merge_node': {
        const prevPath: Path = Exec.getBrotherPath(op.path, -1)

        const srcPath: Path = Exec.getChildPath(op.path, 0, this._nodeMap)
        const dstPath: Path = Exec.getChildPath(prevPath, Infinity, this._nodeMap)

        Exec.moveNode(srcPath, Infinity, dstPath, this._nodeMap)

        Exec.removeNodeRecursive(op.path, this._nodeMap)
        break
      }

      case 'split_node': {
        const json = Exec.getProperties(op.path, op.properties, this._nodeMap)
        const nextPath: Path = Exec.getBrotherPath(op.path, +1)

        Exec.insertNodeRecursive(json, nextPath, this._nodeMap);

        const srcPath: Path = Exec.getChildPath(op.path, op.position, this._nodeMap);
        const dstPath: Path = Exec.getChildPath(nextPath, 0, this._nodeMap);

        Exec.moveNode(srcPath, Infinity, dstPath, this._nodeMap)
        break
      }

      case 'set_node': {
        Exec.setProperties(op.path, op.newProperties, this._nodeMap)
        break
      }

      case 'insert_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.attachChildren(op.text, op.offset)
        break
      }

      case 'remove_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.detachChildren(op.offset, op.text.length);
        break
      }

      default: {
        break
      }

    }
  }
}

export { Page, Path, Operation }
