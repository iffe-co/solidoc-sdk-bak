import { Branch, Leaf, createNode } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
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

  public undo() {
    super.undo()
    this._assembleTree(this.getRoot(), this._nodeMap);
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

    const node = createNode(json, this._nodeMap);

    parent.attachChildren(node, path.offset)

    for (let i = 0; node instanceof Branch && i < json.children.length; i++) {
      this._insertNodeRecursive(json.children[i], {
        parentId: json.id,
        offset: i,
      });
    }

    return
  }

  private _deleteNodeRecursive = (node: Subject) => {
    node.delete();

    for (let i = 0; node instanceof Branch && i < node.getChildrenNum(); i++) {
      let child = <Subject>node.getIndexedChild(i)
      this._deleteNodeRecursive(child)
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

        parent.detachChildren(op.path.offset, 1);

        curr && this._deleteNodeRecursive(curr)

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

        const node = createNode(json, this._nodeMap);

        parent.attachChildren(node, op.path.offset + 1)

        const child = curr.detachChildren(op.position, Infinity);

        node.attachChildren(child, 0);

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
