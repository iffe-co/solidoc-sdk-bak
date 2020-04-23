import { Root, Branch, Leaf } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation, Element } from './interface'


class Page extends Graph {
  constructor(id: string, turtle: string) {
    super(id, turtle);
    (<Root>this.getRoot()).assembleChlildren(this._nodeMap)
  }

  public toJson = (): Element => {
    let head = this.getRoot();
    return head?.toJson()
  }

  public undo() {
    super.undo();
    (<Root>this.getRoot()).assembleChlildren(this._nodeMap)
  }

  private _getContextOf = (path: Path) => {
    const parent = this.getNode(path.parentId);
    if (!parent) {
      throw new Error('Cannot get parent: ' + path.parentId)
    }
    const curr = (parent instanceof Branch) ? parent.getIndexedChild(path.offset) : undefined
    const prev = (parent instanceof Branch) ? parent.getIndexedChild(path.offset - 1) : undefined
    const next = (parent instanceof Branch) ? parent.getIndexedChild(path.offset + 1) : undefined

    return { parent, curr, prev, next }
  }

  public apply = (op: Operation) => {
    switch (op.type) {
      case 'insert_node': {
        const { parent } = this._getContextOf(op.path);
        if (!(parent instanceof Branch)) {
          throw new Error('Cannot insert')
        }
        parent.insertRecursive(op.node, op.path.offset, this._nodeMap)
        break
      }

      case 'remove_node': {
        const { parent, curr } = this._getContextOf(op.path)
        if (!(parent instanceof Branch)) {
          throw new Error('Cannot remove')
        }

        parent.detachChildren(op.path.offset, 1);

        curr && curr.delete()

        break
      }

      case 'move_node': {
        const { parent, curr } = this._getContextOf(op.path)
        const { parent: newParent } = this._getContextOf(op.newPath)

        if (!curr || (curr instanceof Branch && curr.isAncestor(newParent))) {
          throw new Error('Cannot move')
        }

        parent.detachChildren(op.path.offset, 1);

        newParent.attachChildren(curr, op.newPath.offset);

        break
      }

      case 'merge_node': {
        const { parent, prev, curr } = this._getContextOf(op.path)
        if (!(curr instanceof Subject) || !(prev instanceof Subject)) {
          throw new Error('Cannot merge')
        }

        const child = curr.detachChildren(0, Infinity);

        prev.attachChildren(child, Infinity);

        parent.detachChildren(op.path.offset, 1);

        curr.delete()

        break
      }

      case 'split_node': {
        const { parent, curr } = this._getContextOf(op.path)

        if (!curr || !(curr instanceof Subject)) {
          throw new Error('Cannot split')
        }

        const json = {
          ...curr.toBlankJson(),
          ...op.properties,
        }

        const newNext = this.createNode(json);

        parent.attachChildren(newNext, op.path.offset + 1)

        const children = curr.detachChildren(op.position, Infinity);

        newNext.attachChildren(children, 0);

        break
      }

      case 'set_node': {
        const { curr } = this._getContextOf(op.path)

        if (!curr || !(curr instanceof Subject)) {
          throw new Error('Cannot get path')
        }

        curr.set(op.newProperties)

        break
      }

      case 'insert_text': {
        const { curr } = this._getContextOf(op.path);
        if (!(curr instanceof Leaf)) {
          throw new Error('Not a Leaf node: ' + JSON.stringify(op.path))
        }
        curr.attachChildren(op.text, op.offset)
        break
      }

      case 'remove_text': {
        const { curr } = this._getContextOf(op.path);
        if (!(curr instanceof Leaf)) {
          throw new Error('Not a Leaf node: ' + JSON.stringify(op.path))
        }
        curr.detachChildren(op.offset, op.text.length);
        break
      }

      default: {
        break
      }

    }
  }
}

export { Page, Path, Operation }
