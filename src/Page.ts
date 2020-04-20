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
        const parent: Branch = this._getBranchInstance(op.path.parentId);
        const prev: Subject | undefined = parent.getIndexedChild(op.path.offset - 1);
        const curr: Subject | undefined = parent.getIndexedChild(op.path.offset);
        if (!prev || !curr) {
          throw new Error('Cannot merge')
        }
        let src: Path = {
          parentId: curr.get('id'),
          offset: 0
        }
        let dst: Path = {
          parentId: prev.get('id'),
          offset: Infinity
        }

        Exec.moveNode(src, Infinity, dst, this._nodeMap)
        Exec.removeNodeRecursive(op.path, this._nodeMap)
        break
      }

      case 'split_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentId);
        const curr: Subject | undefined = parent.getIndexedChild(op.path.offset);
        if (!curr) {
          throw new Error('Cannot split')
        }
        const json = {
          ...curr.toJson(),
          ...op.properties,
          children: [],
          text: ''
        }
        
        const next = Exec.insertNodeRecursive(json, {
          ...op.path,
          offset: op.path.offset+1
        }, this._nodeMap);

        let src: Path = {
          parentId: curr.get('id'),
          offset: op.position
        }
        let dst: Path = {
          parentId: next.get('id'),
          offset: 0
        }
        Exec.moveNode(src, Infinity, dst, this._nodeMap)
        break
      }

      case 'set_node': {
        let curr: Subject | undefined
        if (op.path.parentId) {
          const parent: Branch = this._getBranchInstance(op.path.parentId);
          curr = parent.getIndexedChild(op.path.offset);
        } else {
          curr = this.getRoot()
        }
        // TODO: disallow setting id/text/children/next/option
        if (!curr) {
          throw new Error('No such node: ' + op.path.parentId + op.path.offset)
        }

        curr.set(op.newProperties)
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
