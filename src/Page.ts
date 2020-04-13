import { Branch, Root, Leaf, Process } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation, Node, Element } from './interface'

class Page extends Graph {
  constructor(json: Element) {
    super(json.id);
    this._insertRecursive(json);
  }

  private _insertRecursive = (json: Node, parent?: Branch, offset?: number): Subject => {
    let currUri: string = (parent) ? this._uri + '#' + json.id : json.id
    let curr: Subject = this._addPlaceHolder(currUri, json.type);
    curr.set(json);

    parent && parent.attach(curr, <number>offset);

    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      this._insertRecursive(json.children[i], curr, i)
    }
    return curr
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

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.children.length; i++) {
      if (i == 0 && head.get('child') !== head.children[i].get('id')) {
        throw new Error('first child error')
      } else if (i < head.children.length - 1 && head.children[i].get('next') !== head.children[i+1].get('id')) {
        throw new Error('next error')
      }
      headJson.children.push(this.toJson(head.children[i]))
    }

    return headJson
  }

  public apply(op: Operation) {
    switch (op.type) {
      case 'insert_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        this._insertRecursive(op.node, parent, op.path.offset)
        break
      }

      case 'remove_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject = parent.detach(op.path.offset);
        curr && Process.removeRecursive(curr);
        break
      }

      case 'move_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const newParent: Branch = this._getBranchInstance(op.newPath.parentUri);

        const curr: Subject = parent.detach(op.path.offset);

        if (Process.isAncestor(curr, newParent)) {
          parent.attach(curr, op.path.offset);
          throw new Error('Trying to append the node to itself or its descendent')
        }

        if (parent === newParent && op.path.offset < op.newPath.offset) {
          op.newPath.offset--;
        }
        newParent.attach(curr, op.newPath.offset);
        break
      }

      case 'merge_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const prev: Subject = parent.getChild(op.path.offset - 1);
        const curr: Subject = parent.getChild(op.path.offset);

        if (prev instanceof Leaf && curr instanceof Leaf) {
          prev.insertText(Infinity, curr.get('text'));
        } else if (prev instanceof Branch && curr instanceof Branch) {
          // TODO: use move_node
          let child: Subject = curr.detach(0);
          prev.attach(child, Infinity)
        } else {
          throw new Error(`Cannot merge.`);
        }
        parent.detach(op.path.offset)
        break
      }

      case 'split_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject = parent.getChild(op.path.offset);
        if (curr instanceof Leaf) {
          let clipped: string = curr.removeText(op.position, Infinity);
          let json = {
            ...this.toJson(curr),
            ...op.properties,
            text: clipped
          }
          this._insertRecursive(json, parent, op.path.offset + 1)
        } else {
          // TODO: use move_node
          let child: Subject = (<Branch>curr).detach(op.position);
          let json = {
            ...this.toJson(curr),
            ...op.properties,
            children: []
          }
          let next: Subject = this._insertRecursive(json, parent, op.path.offset + 1);
          (<Branch>next).attach(child, 0)
        }
        break
      }

      case 'set_node': {
        const parent: Branch = this._getBranchInstance(op.path.parentUri);
        const curr: Subject = parent.getChild(op.path.offset);
        // TODO: disallow setting id/text/children
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
