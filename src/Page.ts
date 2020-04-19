import { Branch, Leaf, createNode } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation, Node, Element } from './interface'


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
    curr && head.insertChildren(curr, 0)

    while (curr) {
      this._assembleTree(curr, nodeMap);
      curr = curr.getNext()
    }
  }

  private _insert = (json: Node, parent: Branch, offset: number, nodeMap: Map<string, Subject>): Subject => {
    let curr: Subject = createNode(json, nodeMap)

    parent.insertChildren(curr, offset);

    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      this._insert(json.children[i], curr, i, nodeMap)
    }
    return curr
  }


  public apply = (op: Operation) => {
    switch (op.type) {
      case 'insert_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        this._insert(op.node, parent, op.path.offset, this._nodeMap)
        break
      }

      case 'remove_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject | undefined = parent.removeChildren(op.path.offset, 1);
        curr && curr.delete();
        break
      }

      case 'move_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const newParent: Branch = this._getBranchInstance(op.newPath.parentUri);

        const curr: Subject | undefined = parent.removeChildren(op.path.offset, 1);
        if (!curr) {
          throw new Error('No such node')
        }

        if (curr instanceof Branch && curr.isAncestor(newParent)) {
          parent.insertChildren(curr, op.path.offset);
          throw new Error('Trying to append the node to itself or its descendent')
        }

        newParent.insertChildren(curr, op.newPath.offset);
        break
      }

      case 'merge_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const prev: Subject | undefined = parent.getIndexedChild(op.path.offset - 1);
        const curr: Subject | undefined = parent.getIndexedChild(op.path.offset);

        if (prev instanceof Leaf && curr instanceof Leaf) {
          prev.insertText(Infinity, curr.get('text'));
        } else if (prev instanceof Branch && curr instanceof Branch) {
          let child: Subject | undefined = curr.removeChildren(0, Infinity)
          prev.insertChildren(child, Infinity)
        } else {
          throw new Error(`Cannot merge.`);
        }
        parent.removeChildren(op.path.offset, 1)
        break
      }

      case 'split_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject | undefined = parent.getIndexedChild(op.path.offset);
        let next = curr?.split(op.position, op.properties, this._nodeMap);
        parent.insertChildren(next, op.path.offset + 1);
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
