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
}

export { Page }
