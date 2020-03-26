import Property from './Property';

// a subject could be a paragraph or a record
export default abstract class Subject {
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

  public toJson = (): any => {
    let result = { id: this._uri.substr(this._uri.indexOf('#') + 1) };
    Object.keys(this._predicates).forEach(key => {
      result = {
        ...result,
        ...this._predicates[key].toJson(),
      };
    });
    return result;
  }

  public get = (key: string): string => {
    return this._predicates[key].get();
  }

  public set = (options: any) => {
    Object.keys(options).forEach(key => {
      this._predicates[key].set(options[key]);
    });
  }

  public abstract getSparqlForUpdate (graph: string): string

  public commit = () => {
    Object.keys(this._predicates).forEach(key => {
      this._predicates[key].commit();
    });
  }
}
