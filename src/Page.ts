import { Block, PageHead } from './Block';
import { Graph } from './Graph';

class Page extends Graph {
  constructor(uri: string) {
    super(uri);
    this._nodes[uri] = new PageHead(uri);
  }
  protected _addPlaceHolder = (uri: string) => {
    this._nodes[uri] || (this._nodes[uri] = new Block(uri));
  }

  public toJson = (): any => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for read`);
    }
    return this._getCascaded(this._uri)
  }

  private _getCascaded = (headUri: string): any => {
    let head: Block = this._nodes[headUri];
    const headJson = head.toJson();

    let blockUri = head.get('child');
    let block: Block = this._nodes[blockUri];

    while (block) {
      let blockJson = this._getCascaded(blockUri)
      headJson.children.push(blockJson)

      blockUri = block.get('next');
      block = this._nodes[blockUri];
    }

    return headJson
  }

  public insertBlockAfter = (prevUri: string, thisUri: string) => {
    this._insertBlockPreparation(prevUri, thisUri);
    const nextUri: string = this._nodes[prevUri].get('next');
    this._nodes[prevUri].set({ next: thisUri });
    this._nodes[thisUri].set({ next: nextUri });
    return;
  }

  public insertBlockBelow = (parentUri: string, thisUri: string) => {
    this._insertBlockPreparation(parentUri, thisUri);
    const childUri: string = this._nodes[parentUri].get('child');
    this._nodes[parentUri].set({ child: thisUri });
    this._nodes[thisUri].set({ next: childUri });
    return;
  }

  private _insertBlockPreparation = (relativeUri: string, thisUri: string) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert block`);
    } else if (this._nodes[thisUri] && !this._nodes[thisUri].isDeleted) {
      throw new Error('Trying to insert an existing block: ' + thisUri);
    } else if (!this._nodes[relativeUri] || this._nodes[relativeUri].isDeleted) {
      throw new Error('The relative block does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('To insert a block same as the relative: ' + relativeUri);
    }
    this._addPlaceHolder(thisUri);
    this._nodes[thisUri].isDeleted = false;
  }

  public deleteBlock = (thisUri: string) => {
    const headUri: string = this._uri;
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for delete block`);
    } else if (thisUri === headUri) {
      throw new Error('Trying to delete the head block: ' + thisUri);
    } else if (!this._nodes[thisUri]) {
      throw new Error('The block is already deleted: ' + thisUri);
    }
    this._disconnect(thisUri);
    this._traversePreOrder(thisUri, this._setDeleted, null);
  }

  private _disconnect = (thisUri: string) => {
    const headUri: string = this._uri;
    const nextUri: string = this._nodes[thisUri].get('next');
    let relative: Block = this._traversePreOrder(headUri, this._findRelative, thisUri)
    if (relative && relative instanceof Block && relative.get('next') === thisUri) {
      relative.set({ next: nextUri }); // the last block's next will be set as ''
    } else if (relative && relative.get('child') === thisUri) {
      relative.set({ child: nextUri }); // the last block's next will be set as ''
    }
  }

  private _traversePreOrder = (headUri: string, doSomething: (block: Block, param?: any) => any, param: any): any => {
    let head: Block = this._nodes[headUri];
    let res = doSomething(head, param);
    if (res) return res

    let blockUri = head.get('child');
    let block: Block = this._nodes[blockUri];

    while (block) {
      let res = this._traversePreOrder(blockUri, doSomething, param);
      if (res) return res
      blockUri = block.get('next');
      block = this._nodes[blockUri];
    }

    return undefined
  }

  private _findRelative = (block: Block, targetUri: string): Block | undefined => {
    if (block.get('child') === targetUri) return block
    if (block instanceof Block && block.get('next') === targetUri) return block
    return undefined
  }

  private _setDeleted = (block: Block): undefined => {
    block.isDeleted = true
    return undefined
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
    } else if (this._nodes[thisUri] && this._nodes[thisUri].isDeleted) {
      throw new Error('Trying to move a deleted block: ' + thisUri);
    } else if (!this._nodes[relativeUri] || this._nodes[relativeUri].isDeleted) {
      throw new Error('The relative block does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('The moving block is the same as the relative: ' + relativeUri);
    }

    let block: Block = this._traversePreOrder(thisUri, this._findRelative, relativeUri)
    if (block && block.get('next') !== relativeUri) { // TODO: ugly exception! The traverse will mostly find a decendent, unless the two blocks are neighboring brothers
      throw new Error('Trying to append the block to its decendent')
    }
    this._disconnect(thisUri);
    this._nodes[thisUri].isDeleted = true; // to avoid throw during insertion, will soon be set back
  }

}

export { Page }
