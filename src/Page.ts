import { Block, PageHead, Leaf } from './Block';
import { Subject } from './Subject';
import { Graph } from './Graph';

class Page extends Graph {
  // protected _nodes: { [uri: string]: Subject } = {}
  constructor(uri: string) {
    super(uri);
    this._nodes[uri] = new PageHead(uri);
    // this._nodes = this._nodes
  }

  protected _addPlaceHolder = (uri: string, type: string) => {
    this._nodes[uri] || (this._nodes[uri] = (type === 'http://www.solidoc.net/ontologies#Leaf') ? new Leaf(uri) : new Block(uri));
  }
  private _getRoot = (): Subject => {
    return this._nodes[this._uri];
  }
  private _getNext = (curr: Subject): Subject => {
    let nextUri: string = curr.get('next');
    return this._nodes[nextUri];
  }
  private _getChild = (curr: Subject): Subject => {
    let childUri: string = curr.get('child');
    return this._nodes[childUri];
  }

  public toJson = (): any => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for read`);
    }
    return this._getCascaded(this._getRoot())
  }

  private _getCascaded = (head: Subject): any => {
    const headJson = head.toJson();
    let curr: Subject = this._getChild(head);

    while (curr) {
      let nodeJson = this._getCascaded(curr)
      headJson.children.push(nodeJson)

      curr = this._getNext(curr);
    }

    return headJson
  }

  public insertNode = (node: any, preposition: string, relativeUri: string) => {
    let relative: Subject = this._nodes[relativeUri];
    let currUri: string = this._uri + '#' + node.id
    let curr: Subject = this._nodes[currUri];

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert node`);
    } else if (!relative || relative.isDeleted) {
      throw new Error('The relative node does not exist: ' + relativeUri);
    } else if (currUri === relativeUri) {
      throw new Error('To insert a node same as the relative: ' + relativeUri);
    } else if (curr && !curr.isDeleted) {
      throw new Error('Trying to insert an existing node: ' + currUri);
    } else if (curr) {
      this._nodes[currUri].isDeleted = false;
    } else {
      this._addPlaceHolder(currUri, node.type);
      curr = this._nodes[currUri];
    }

    if (preposition === 'after') {
      this._insertNodeAfter(relative, curr)
    } else if (preposition === 'below') {
      this._insertNodeBelow(relative, curr)
    }
    this.set(currUri, node)

    if (!node.children || node.children.length===0) return

    this.insertNode(node.children[0], 'below', currUri)
    for (let i=1; i<node.children.length; i++) {
      this.insertNode(node.children[i], 'after', node.children[i-1].id)
    }
  }

  private _insertNodeAfter = (prev: Subject, curr: Subject) => {
    let next: Subject = this._getNext(prev)
    prev.setNext(curr)
    curr.setNext(next)
    return;
  }

  private _insertNodeBelow = (parent: Subject, curr: Subject) => {
    let child: Subject = this._getChild(parent)
    parent.setChild(curr)
    curr.setNext(child)
    return;
  }

  public deleteNode = (thisUri: string) => {
    let curr: Subject = this._nodes[thisUri];

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for delete node`);
    } else if (thisUri === this._uri) {
      throw new Error('Trying to delete the head node: ' + thisUri);
    } else if (!this._nodes[thisUri]) {
      throw new Error('The node is already deleted: ' + thisUri);
    }

    this._traversePreOrder(this._getRoot(), this._trimIfMatch, curr)
    this._traversePreOrder(curr, this._markAsDeleted);
  }

  private _traversePreOrder = (head: Subject, doSomething: (curr: Subject, target?: any) => boolean, target?: any): boolean => {
    let res = doSomething(head, target);
    if (res) return res

    let curr: Subject = this._getChild(head);

    while (curr) {
      let res = this._traversePreOrder(curr, doSomething, target);
      if (res) return res
      curr = this._getNext(curr)
    }

    return res
  }

  private _trimIfMatch = (curr: Subject, target: Subject): boolean => {
    let nextNode: Subject = this._getNext(target)
    if (this._getChild(curr) === target) {
      curr.setChild(nextNode)
      return true
    } else if (this._getNext(curr) === target) {
      curr.setNext(nextNode)
      return true
    }
    return false
  }

  private _markAsDeleted = (curr: Subject): boolean => {
    curr.isDeleted = true
    return false
  }

  public moveNode = (thisUri: string, preposition: string, relativeUri: string) => {
    let curr: Subject = this._nodes[thisUri]
    let relative: Subject = this._nodes[relativeUri]

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert node`);
    } else if (curr && curr.isDeleted) {
      throw new Error('Trying to move a deleted node: ' + thisUri);
    } else if (!relative || relative.isDeleted) {
      throw new Error('The relative node does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('The moving node is the same as the relative: ' + relativeUri);
    } else if (this._traversePreOrder(curr, this._findDescendent, relative)) {
      throw new Error('Trying to append the node to its decendent')
    }

    this._traversePreOrder(this._getRoot(), this._trimIfMatch, curr)
    if (preposition === 'after') {
      this._insertNodeAfter(relative, curr)
    } else if (preposition === 'below') {
      this._insertNodeBelow(relative, curr)
    }
  }

  private _findDescendent = (curr: Subject, target: Subject): boolean => {
    return (this._getChild(curr) === target)
  }

}

export { Page }
