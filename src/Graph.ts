import { Subject } from './Subject';
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
abstract class Graph {
  protected _uri: string
  protected _nodes: { [uri: string]: Subject } = {}
  protected _isReady: boolean

  constructor(uri: string) {
    this._uri = uri;
    this._isReady = false;
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

  public fromTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    this._addSubjects(quads);
    this._assignProperties(quads);
    this._isReady = true;
  }

  private _addSubjects = (quads: any) => {
    quads.forEach(quad=> {
      if (quad.predicate.id==='http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        this._nodes[quad.subject.id] || this._addPlaceHolder(quad.subject.id, quad.object.id);
      }
    })
  }

  private _assignProperties = (quads: any) => {
    quads.forEach(quad=> {
      this._nodes[quad.subject.id].fromQuad(quad);
    })
  }

  protected abstract _addPlaceHolder(uri: string, type: string): void

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

  protected _insertNodeAfter = (prev: Subject, curr: Subject) => {
    let next: Subject = this._getNext(prev)
    prev.setNext(curr)
    curr.setNext(next)
    return;
  }

  protected _insertNodeBelow = (parent: Subject, curr: Subject) => {
    let child: Subject = this._getChild(parent)
    parent.setChild(curr)
    curr.setNext(child)
    return;
  }

  protected _deleteNode = (curr: Subject) => {
    this._traversePreOrder(this._getRoot(), this._trimIfMatch, curr)
    this._traversePreOrder(curr, this._markAsDeleted);
  }

  protected _moveNode = (curr: Subject, preposition: string, relative: Subject) => {
    if (this._traversePreOrder(curr, this._findDescendent, relative)) {
      throw new Error('Trying to append the node to its decendent')
    }    this._traversePreOrder(this._getRoot(), this._trimIfMatch, curr)
    if (preposition === 'after') {
      this._insertNodeAfter(relative, curr)
    } else if (preposition === 'below') {
      this._insertNodeBelow(relative, curr)
    }
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

  private _findDescendent = (curr: Subject, target: Subject): boolean => {
    return (this._getChild(curr) === target)
  }

  public isReady = (): boolean => {
    return this._isReady;
  }
}

export { Graph }
