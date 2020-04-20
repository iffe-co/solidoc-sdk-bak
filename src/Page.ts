import { Branch, Leaf } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Exec } from './Exec'
import { Path, Operation, Element, Node } from './interface'


class Page extends Graph {
  constructor(id: string, turtle: string) {
    super(id, turtle);
    this._assembleTree(this.getRoot(), this._nodeMap)
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

  private _getContextOf = (path: Path) => {
    const parent = this.getNode(path.parentId);
    if (!parent) {
      throw new Error('Cannot get parent: ' + path.parentId)
    }
    const curr = parent.getIndexedChild(path.offset)
    const prev = parent.getIndexedChild(path.offset - 1)
    const next = parent.getIndexedChild(path.offset + 1)

    return { parent, curr, prev, next }
  }

  private _insertNodeRecursive = (json: Node, path: Path) => {

    const { parent } = this._getContextOf(path)
    Exec.insert(parent, json, path.offset, this._nodeMap)

    const node = this.getNode(json.id)

    for (let i = 0; node instanceof Branch && i < json.children.length; i++) {
      this._insertNodeRecursive(json.children[i], {
        parentId: json.id,
        offset: i,
      });
    }

    return
  }

  private _deleteNodeRecursive = (node: Subject) => {
    for (let i = 0; node instanceof Branch && i < node.getChildrenNum(); i++) {
      let child = <Subject>node.getIndexedChild(i)
      this._deleteNodeRecursive(child)
      child.delete()
    }
  }

  public apply = (op: Operation) => {
    switch (op.type) {
      case 'insert_node': {
        this._insertNodeRecursive(op.node, op.path);
        break
      }

      case 'remove_node': {
        const { parent, curr } = this._getContextOf(op.path)
        if (!(curr instanceof Subject) && curr !== undefined) {
          throw new Error('Cannot remove')
        }

        Exec.remove(parent, op.path.offset, 1)
        curr && this._deleteNodeRecursive(curr)
        break
      }

      case 'move_node': {
        const { parent } = this._getContextOf(op.path)
        const { parent: newParent} = this._getContextOf(op.newPath)
        Exec.move(parent, op.path.offset, 1, newParent, op.newPath.offset)

        break
      }

      case 'merge_node': {
        const { parent, prev, curr } = this._getContextOf(op.path)
        if (!(curr instanceof Subject) || !(prev instanceof Subject)) {
          throw new Error('Cannot merge')
        }

        Exec.move(curr, 0, Infinity, prev, Infinity)


        Exec.remove(parent, op.path.offset, 1)

        break
      }

      case 'split_node': {
        const json = Exec.getProperties(op.path, op.properties, this._nodeMap)

        const { parent, curr } = this._getContextOf(op.path)

        if (!curr || !(curr instanceof Subject)) {
          throw new Error('Cannot split')
        }

        Exec.insert(parent, json, op.path.offset + 1, this._nodeMap);
        Exec.move(curr, op.position, Infinity, <Subject>curr.getNext(), 0)
        break
      }

      case 'set_node': {
        Exec.setProperties(op.path, op.newProperties, this._nodeMap)
        break
      }

      case 'insert_text': {
        const { curr } = this._getContextOf(op.path);
        if (!(curr instanceof Leaf)) {
          throw new Error('Not a Leaf node: ' + JSON.stringify(op.path))
        }
        Exec.insert(curr, op.text, op.offset)
        break
      }

      case 'remove_text': {
        const { curr } = this._getContextOf(op.path);
        if (!(curr instanceof Leaf)) {
          throw new Error('Not a Leaf node: ' + JSON.stringify(op.path))
        }
        Exec.remove(curr, op.offset, op.text.length)
        break
      }

      default: {
        break
      }

    }
  }
}

export { Page, Path, Operation }
