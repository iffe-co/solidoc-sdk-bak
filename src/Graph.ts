import Subject from './Subject';
import Block from './Block'
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
export default abstract class Graph {
  protected _uri: string
  protected _nodes: { [uri: string]: Subject } = {}
  private _isReady: boolean

  constructor(uri: string) {
    this._uri = uri;
    this._isReady = false;
  }

  public fromTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      this._nodes[quad.subject.id] || this._addPlaceHolder(quad.subject.id);
      this._nodes[quad.subject.id].fromQuad(quad);
    });
    this._isReady = true;
  }

  protected abstract _addPlaceHolder(uri: string): void

  public toJson = (): any => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for read`);
    }
    return this._getCascaded(this._uri)
  }

  private _getCascaded = (nodeUri: string): any => {
    const nodeJson = this._nodes[nodeUri].toJson();
    if (nodeJson.child) {
      nodeJson.children = this._getChildrenOf(nodeJson)
    }
    delete nodeJson.child
    return nodeJson
  }

  private _getChildrenOf = (parentJson: any): any[] => {
    const children: any[] = []

    let nextNodeUri = parentJson.child;
    while (nextNodeUri) {
      const nodeJson = this._getCascaded(nextNodeUri);
      nextNodeUri = nodeJson.next;
      delete nodeJson.next;
      children.push(nodeJson);
    }
    return children
  }

  public set = (nodeUri: string, options) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for write`);
    }
    this._nodes[nodeUri].set(options);
  }

  public getSparqlForUpdate = (): string => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for sparql`);
    }
    let sparql = '';
    Object.keys(this._nodes).forEach(uri => {
      sparql += this._nodes[uri].getSparqlForUpdate(this._uri);
    });
    return sparql;
  }

  public commit = () => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for commit`);
    }
    Object.keys(this._nodes).forEach(uri => {
      if (this._nodes[uri].isDeleted) {
        delete this._nodes[uri];
      } else {
        this._nodes[uri].commit();
      }
    });
  }

  public insertNodeAfter = (prevUri: string, thisUri: string) => {
    this._insertNodePreparation(thisUri, prevUri);
    const nextUri: string = this._nodes[prevUri].get('next');
    this._nodes[prevUri].set({ next: thisUri });
    this._nodes[thisUri].set({ next: nextUri });
    return;
  }

  public insertNodeBelow = (parentUri: string, thisUri: string) => {
    this._insertNodePreparation(thisUri, parentUri);
    const childUri: string = this._nodes[parentUri].get('child');
    this._nodes[parentUri].set({ child: thisUri });
    this._nodes[thisUri].set({ next: childUri });
    return;
  }

  private _insertNodePreparation = (thisUri: string, relativeUri: string) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert node`);
    } else if (this._nodes[thisUri] && !this._nodes[thisUri].isDeleted) {
      throw new Error('Trying to insert an existing node: ' + thisUri);
    } else if (!this._nodes[relativeUri] || this._nodes[relativeUri].isDeleted) {
      throw new Error('The prev node does not exist: ' + relativeUri);
    } else if (thisUri === relativeUri) {
      throw new Error('To insert a node same as the relative: ' + relativeUri);
    }
    this._addPlaceHolder(thisUri);
    this._nodes[thisUri].isDeleted = false;
  }

  public deleteNode = (thisUri: string) => {
    const headUri: string = this._uri;
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for delete node`);
    } else if (thisUri === headUri) {
      throw new Error('Trying to delete the head node: ' + thisUri);
    } else if (!this._nodes[thisUri] || this._nodes[thisUri].isDeleted) {
      return; // keep deletion idempotent
    }

    let relative: Subject = this._traversePreOrder(headUri, this._findRelative, thisUri)
    if (relative && relative instanceof Block && relative.get('next') === thisUri) {
      const nextUri: string = this._nodes[thisUri].get('next');
      relative.set({ next: nextUri }); // the last node's next will be set as ''
    } else if (relative && relative.get('child') === thisUri) {
      const nextUri: string = this._nodes[thisUri].get('next');
      relative.set({ child: nextUri }); // the last node's next will be set as ''
    }

    this._traversePreOrder(thisUri, this._setDeleted, null);
    this._nodes[thisUri].isDeleted = true;
  }

  private _traversePreOrder = (headUri: string, doSomething: (node: Subject, param?: any) => any, param: any): any => {
    let head: Subject = this._nodes[headUri];
    let res = doSomething(head, param);
    if (res) return res

    let nodeUri = head.get('child');
    let node: Subject = this._nodes[nodeUri];

    while (node) {
      let res = doSomething(node, param);
      if (res) return res

      if (node.get('child')) {
        this._traversePreOrder(nodeUri, doSomething, param);
      }
      let nextUri = node.get('next');
      node = this._nodes[nextUri];
    }
    return undefined
  }

  private _findRelative = (node: Subject, targetUri: string): Subject | undefined => {
    if (node.get('child') === targetUri) return node
    if (node instanceof Block && node.get('next') === targetUri) return node
    return undefined
  }

  private _setDeleted = (node: Subject): undefined => {
    node.isDeleted = true
    return undefined
  }

  public moveNodeAfter = (newPrevUri: string, thisUri: string) => {
    this.deleteNode(thisUri);
    this.insertNodeAfter(newPrevUri, thisUri);
  }

  public moveNodeBelow = (newParentUri: string, thisUri: string) => {
    this.deleteNode(thisUri);
    this.insertNodeBelow(newParentUri, thisUri);
  }

  public isReady = (): boolean => {
    return this._isReady;
  }
}
