import { Property } from './Property';

// a subject could be a head or a block
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
    return this._predicates[key].get();
  }

  public set = (options: any) => {
    Object.keys(options).forEach(key => {
      this._predicates[key].set(options[key]);
    });
  }

  public abstract getSparqlForUpdate(graph: string): string

  public commit = () => {
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].commit();
    });
  }
}

export { Subject }