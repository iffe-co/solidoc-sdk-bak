import { Property } from './Property';

abstract class Subject {
  protected _uri: string
  protected _predicates: { [key: string]: Property } = {}
  public isDeleted: boolean

  constructor(uri: string) {
    this._uri = uri;
  }

  public fromQuad = (quad: any) => {
    let found = false;
    Object.keys(this._predicates).forEach(key => {
      if (this._predicates[key].id === quad.predicate.id) {
        this._predicates[key].fromQuad(quad);
        found = true;
      }
    });
    if (!found) {
      console.log('Quad not matched:');
      console.log(quad);
    }
  }

  public abstract toJson(): any

  public get = (key: string): string => {
    return this._predicates[key] ? this._predicates[key].get() : '';
  }

  public set = (options: any) => {
    if (this.isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._uri);
    }
    Object.keys(options).forEach(key => {
      key==='id' || key==='children' || this._predicates[key].set(options[key]);
    });
  }

  public setNext = (node: Subject) => {
    this.set({ next: node ? node._uri : '' })
  }

  public setChild = (node: Subject) => {
    this.set({ child: node ? node._uri : '' })
  }

  public abstract getSparqlForUpdate(graph: string): string

  public commit = () => {
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].commit();
    });
  }

  public undo = () => {
    this.isDeleted = false
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].undo();
    });
  }
}

export { Subject }