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

  public toJson = (): any => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for read`);
    }
    return this._getCascaded(this._getHead())
  }

  private _getCascaded = (head: Block): any => {
    const headJson = head.toJson();
    let block: Block = this._getChild(head);

    while (block) {
      let blockJson = this._getCascaded(block)
      headJson.children.push(blockJson)

      block = this._getNext(block);
    }

    return headJson
  }

  private _getHead = (): Block => {
    return this._blocks[this._uri];
  }
  private _getNext = (block: Block): Block => {
    let nextUri: string = block.get('next');
    return this._blocks[nextUri];
  }
  private _getChild = (block: Block): Block => {
    let childUri: string = block.get('child');
    return this._blocks[childUri];
  }

  public insertBlockAfter = (prevUri: string, thisUri: string) => {
    this._insertBlockPreparation(prevUri, thisUri);
    let prev: Block = this._blocks[prevUri]
    let curr: Block = this._blocks[thisUri]
    let next: Block = this._getNext(prev)
    prev.setNext(curr)
    curr.setNext(next)
    return;
  }

  public insertBlockBelow = (parentUri: string, thisUri: string) => {
    this._insertBlockPreparation(parentUri, thisUri);
    let parent: Block = this._blocks[parentUri]
    let curr: Block = this._blocks[thisUri]
    let child: Block = this._getChild(parent)
    parent.setChild(curr)
    curr.setNext(child)
    return;
  }

  private _insertBlockPreparation = (relativeUri: string, thisUri: string) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert block`);
    } else if (this._blocks[thisUri] && !this._blocks[thisUri].isDeleted) {
      throw new Error('Trying to insert an existing block: ' + thisUri);
    } else if (!this._blocks[relativeUri] || this._blocks[relativeUri].isDeleted) {
      throw new Error('The relative block does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('To insert a block same as the relative: ' + relativeUri);
    }
    this._addPlaceHolder(thisUri);
    this._blocks[thisUri].isDeleted = false;
  }

  public deleteBlock = (thisUri: string) => {
    const headUri: string = this._uri;
    if (!this._isReady) {
      throw new Error(`the graph ${headUri} is not ready for delete block`);
    } else if (thisUri === headUri) {
      throw new Error('Trying to delete the head block: ' + thisUri);
    } else if (!this._blocks[thisUri]) {
      throw new Error('The block is already deleted: ' + thisUri);
    }
    let block: Block = this._blocks[thisUri];
    this._traversePreOrder(this._getHead(), this._trimIfMatch, block)
    this._traversePreOrder(block, this._markAsDeleted);
  }

  private _traversePreOrder = (head: Block, doSomething: (block: Block, target?: any) => boolean, target?: any): boolean => {
    let res = doSomething(head, target);
    if (res) return res

    let block: Block = this._getChild(head);

    while (block) {
      let res = this._traversePreOrder(block, doSomething, target);
      if (res) return res
      block = this._getNext(block)
    }

    return res
  }

  private _trimIfMatch = (block: Block, target: Block): boolean => {
    let next: Block = this._getNext(target)
    if (this._getChild(block) === target) {
      block.setChild(next)
      return true
    } else if (this._getNext(block) === target) {
      block.setNext(next)
      return true
    }
    return false
  }

  private _markAsDeleted = (block: Block): boolean => {
    block.isDeleted = true
    return false
  }

  public moveBlockAfter = (newPrevUri: string, thisUri: string) => {
    this._moveBlockPreparation(newPrevUri, thisUri)
    this.insertBlockAfter(newPrevUri, thisUri);
  }

  public moveBlockBelow = (newParentUri: string, thisUri: string) => {
    this._moveBlockPreparation(newParentUri, thisUri)
    this.insertBlockBelow(newParentUri, thisUri);
  }

  private _moveBlockPreparation = (relativeUri: string, thisUri: string) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert block`);
    } else if (this._blocks[thisUri] && this._blocks[thisUri].isDeleted) {
      throw new Error('Trying to move a deleted block: ' + thisUri);
    } else if (!this._blocks[relativeUri] || this._blocks[relativeUri].isDeleted) {
      throw new Error('The relative block does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('The moving block is the same as the relative: ' + relativeUri);
    }

    let block: Block = this._blocks[thisUri]
    let relative: Block = this._blocks[relativeUri]
    if (this._traversePreOrder(block, this._findDescendent, relative)) {
      throw new Error('Trying to append the block to its decendent')
    }
    this._traversePreOrder(this._getHead(), this._trimIfMatch, block)
    block.isDeleted = true; // to avoid throw during insertion, will soon be set back
  }

  private _findDescendent = (block: Block, target: Block): boolean => {
    return (this._getChild(block) === target)
  }

}

export { Page }
