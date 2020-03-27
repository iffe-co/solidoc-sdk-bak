import { NamedNodeProperty, TextProperty } from './Property';
import Subject from './Subject';

export default class Block extends Subject {
  constructor(uri: string) {
    super(uri);
    // TODO: type/next can be extract to Subject super()
    this._predicates.type = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#nextBlock', 'next');
    this._predicates.content = new TextProperty('http://www.solidoc.net/ontologies#content', 'content');
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
