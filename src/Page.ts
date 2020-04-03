import { Block, PageHead } from './Block';
import { Graph } from './Graph';

class Page extends Graph {
  protected _blocks: { [uri: string]: Block } = {}
  constructor(uri: string) {
    super(uri);
    this._blocks[uri] = new PageHead(uri);
    this._nodes = this._blocks
  }

  protected _addPlaceHolder = (uri: string) => {
    this._blocks[uri] || (this._blocks[uri] = new Block(uri));
  }
  private _getHead = (): Block => {
    return this._blocks[this._uri];
  }
  private _getNext = (curr: Block): Block => {
    let nextUri: string = curr.get('next');
    return this._blocks[nextUri];
  }
  private _getChild = (curr: Block): Block => {
    let childUri: string = curr.get('child');
    return this._blocks[childUri];
  }

  public toJson = (): any => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for read`);
    }
    return this._getCascaded(this._getHead())
  }

  private _getCascaded = (head: Block): any => {
    const headJson = head.toJson();
    let curr: Block = this._getChild(head);

    while (curr) {
      let blockJson = this._getCascaded(curr)
      headJson.children.push(blockJson)

      curr = this._getNext(curr);
    }

    return headJson
  }

  public insertBlock = (thisUri: string, preposition: string, relativeUri: string) => {
    let relative: Block = this._blocks[relativeUri];
    let curr: Block = this._blocks[thisUri];

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert block`);
    } else if (!relative || relative.isDeleted) {
      throw new Error('The relative block does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('To insert a block same as the relative: ' + relativeUri);
    } else if (curr && !curr.isDeleted) {
      throw new Error('Trying to insert an existing block: ' + thisUri);
    } else if (curr) {
      this._blocks[thisUri].isDeleted = false;
    } else {
      this._addPlaceHolder(thisUri);
      curr = this._blocks[thisUri];
    }

    if (preposition === 'after') {
      this._insertBlockAfter(relative, curr)
    } else if (preposition === 'below') {
      this._insertBlockBelow(relative, curr)
    }
  }

  private _insertBlockAfter = (prev: Block, curr: Block) => {
    let next: Block = this._getNext(prev)
    prev.setNext(curr)
    curr.setNext(next)
    return;
  }

  private _insertBlockBelow = (parent: Block, curr: Block) => {
    let child: Block = this._getChild(parent)
    parent.setChild(curr)
    curr.setNext(child)
    return;
  }

  public deleteBlock = (thisUri: string) => {
    let curr: Block = this._blocks[thisUri];

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for delete block`);
    } else if (thisUri === this._uri) {
      throw new Error('Trying to delete the head block: ' + thisUri);
    } else if (!this._blocks[thisUri]) {
      throw new Error('The block is already deleted: ' + thisUri);
    }

    this._traversePreOrder(this._getHead(), this._trimIfMatch, curr)
    this._traversePreOrder(curr, this._markAsDeleted);
  }

  private _traversePreOrder = (head: Block, doSomething: (curr: Block, target?: any) => boolean, target?: any): boolean => {
    let res = doSomething(head, target);
    if (res) return res

    let curr: Block = this._getChild(head);

    while (curr) {
      let res = this._traversePreOrder(curr, doSomething, target);
      if (res) return res
      curr = this._getNext(curr)
    }

    return res
  }

  private _trimIfMatch = (curr: Block, target: Block): boolean => {
    let nextBlock: Block = this._getNext(target)
    if (this._getChild(curr) === target) {
      curr.setChild(nextBlock)
      return true
    } else if (this._getNext(curr) === target) {
      curr.setNext(nextBlock)
      return true
    }
    return false
  }

  private _markAsDeleted = (curr: Block): boolean => {
    curr.isDeleted = true
    return false
  }

  public moveBlock = (thisUri: string, preposition: string, relativeUri: string) => {
    let curr: Block = this._blocks[thisUri]
    let relative: Block = this._blocks[relativeUri]

    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert block`);
    } else if (curr && curr.isDeleted) {
      throw new Error('Trying to move a deleted block: ' + thisUri);
    } else if (!relative || relative.isDeleted) {
      throw new Error('The relative block does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('The moving block is the same as the relative: ' + relativeUri);
    } else if (this._traversePreOrder(curr, this._findDescendent, relative)) {
      throw new Error('Trying to append the block to its decendent')
    }

    this._traversePreOrder(this._getHead(), this._trimIfMatch, curr)
    if (preposition === 'after') {
      this._insertBlockAfter(relative, curr)
    } else if (preposition === 'below') {
      this._insertBlockBelow(relative, curr)
    }
  }

  private _findDescendent = (curr: Block, target: Block): boolean => {
    return (this._getChild(curr) === target)
  }

}

export { Page }
