import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';

class Block extends Subject {
  constructor(uri: string) {
    super(uri);
    // TODO: type/next can be extract to Subject super()
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextBlock', 'next');
    this._predicates.child = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'child');
    this.isDeleted = false
  }

  public toJson = (): any => {
    let result: any = {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this._predicates['type'].get(),
      children: []
    };
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

class PageHead extends Block {
  // TODO: add parent property
  constructor(uri) {
    super(uri);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
  }

  public toJson = (): any => {
    let result: any = {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      title: this._predicates['title'].get(),
      children: []
    };
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

class Leaf extends Subject {
  constructor(uri: string) {
    // TODO: remove uri property
    super(uri);
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextBlock', 'next');
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
    this.isDeleted = false
  }

  public toJson = (): any => {
    let result: any = {
      id: this._uri.substr(this._uri.indexOf('#') + 1),
      type: this._predicates['type'].get(),
      text: this._predicates['text'].get(),
    };
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

export { Block, PageHead, Leaf }
