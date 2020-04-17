import { Branch, Leaf } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation, Element } from './interface'
import { Process, nodes } from './Process'

class Page extends Graph {
  constructor(uri: string, turtle: string) {
    super(uri, turtle);
    Process.assembleTree(nodes.get(uri), this)
  }

  private _getBranchInstance = (uri: string): Branch => {
    let node = nodes.get(uri);
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
    let head = nodes.get(this.getUri());
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
        const curr: Subject | undefined = parent.removeChildren(op.path.offset, 1);
        curr && Process.removeRecursive(curr);
        break
      }

      case 'move_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const newParent: Branch = this._getBranchInstance(op.newPath.parentUri);

        const curr: Subject | undefined = parent.removeChildren(op.path.offset, 1);
        if (!curr) {
          throw new Error('No such node')
        }

        if (Process.isAncestor(curr, newParent)) {
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
        if (curr instanceof Leaf) {
          let clipped: string = curr.removeText(op.position, Infinity);
          let json = {
            ...Process.toJson(curr),
            ...op.properties,
            text: clipped
          }
          Process.insertRecursive(json, this, parent, op.path.offset + 1)
        } else {
          let child: Subject | undefined = (<Branch>curr).removeChildren(op.position, Infinity);
          if (!child) {
            throw new Error('No such child')
          }
          let json = {
            ...Process.toJson(curr),
            ...op.properties,
            children: []
          }
          let next: Subject = Process.insertRecursive(json, this, parent, op.path.offset + 1);
          (<Branch>next).insertChildren(child, 0)
        }
        break
      }

      case 'set_node': {
        let curr: Subject | undefined
        if (op.path.parentUri) {
          const parent: Branch = this._getBranchInstance(op.path.parentUri);
          curr = parent.getIndexedChild(op.path.offset);
        } else {
          curr = nodes.get(this.getUri())
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
