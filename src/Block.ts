import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';

class Block extends Subject {
  constructor(uri: string) {
    super(uri);
    // TODO: type/next can be extract to Subject super()
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextBlock', 'next');
    this._predicates.child = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'child');
    this._predicates.content = new TextProperty('http://www.solidoc.net/ontologies#content', 'content');
    this.isDeleted = false
  }

  public toJson = (): any => {
    let result:any = { id: this._uri.substr(this._uri.indexOf('#') + 1) };
    Object.keys(this._predicates).forEach(key => {
      result = {
        ...result,
        ...this._predicates[key].toJson(),
      };
    });
    if (result.child) result.children = []
    delete result.next
    delete result.child
    return result;
  }

  public getSparqlForUpdate = (graph: string): string => {
    let sparql = '';
    if (this.isDeleted) {
      sparql += `WITH <${graph}> DELETE { <${this._uri}> ?p ?o } WHERE { <${this._uri}> ?p ?o };\n`;
    } else {
      Object.keys(this._predicates).forEach(key => {
        sparql += this._predicates[key].getSparqlForUpdate(graph, this._uri);
      });
    }
    return sparql;
  }
}

class PageHead extends Subject {
  // TODO: add parent property
  constructor(uri) {
    super(uri);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
    this._predicates.child = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'child');
  }
  public toJson = (): any => {
    let result:any = { id: this._uri.substr(this._uri.indexOf('#') + 1) };
    Object.keys(this._predicates).forEach(key => {
      result = {
        ...result,
        ...this._predicates[key].toJson(),
      };
    });
    if (result.child) result.children = []
    delete result.child
    return result;
  }
  public getSparqlForUpdate = (graph: string): string => {
    let sparql = '';
    Object.keys(this._predicates).forEach(key => {
      sparql += this._predicates[key].getSparqlForUpdate(graph, this._uri);
    });
    return sparql;
  }
}

export {Block, PageHead}
