import Subject from './Subject';
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
    const headJson = this._nodes[this._uri].toJson();
    let nextNodeUri = headJson.next;
    delete headJson.next;

    const blocks: any[] = [];
    while (nextNodeUri) {
      const nodeJson = this._nodes[nextNodeUri].toJson();
      nextNodeUri = nodeJson.next;
      delete nodeJson.next;
      blocks.push(nodeJson);
    }
    return { ...headJson, blocks };
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

  public insertNode = (thisUri: string, prevUri: string) => {
    if (!this._isReady) {
      throw new Error(`the graph ${this._uri} is not ready for insert node`);
    } else if (this._nodes[thisUri] && !this._nodes[thisUri].isDeleted) {
      throw new Error('Trying to insert an existing node: ' + thisUri);
    } else if (!this._nodes[prevUri] || this._nodes[prevUri].isDeleted) {
      throw new Error('The prev node does not exist: ' + prevUri);
    } else if (thisUri === prevUri) {
      throw new Error('To insert a node same as the prev: ' + prevUri);
    }
    this._addPlaceHolder(thisUri);
    // this._nodes[thisUri].set(options);
    this._nodes[thisUri].isDeleted = false;

    // prevUri || (prevUri = this._uri)
    const nextUri: string = this._nodes[prevUri].get('next');
    this._nodes[prevUri].set({ next: thisUri });
    this._nodes[thisUri].set({ next: nextUri });

    return;
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

    let prev: Subject = this._nodes[headUri];
    while (prev && prev.get('next') !== thisUri) {
      prev = this._nodes[(prev.get('next'))];
    }
    // the last node's next will be set as ''
    const nextUri: string = this._nodes[thisUri].get('next');
    prev && prev.set({ next: nextUri });
    this._nodes[thisUri].isDeleted = true;
  }

  public moveNode = (thisUri: string, newPrevUri: string) => {
    this.deleteNode(thisUri);
    this.insertNode(thisUri, newPrevUri);
  }

  public isReady = (): boolean => {
    return this._isReady;
  }
}
