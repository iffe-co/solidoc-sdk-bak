import { NamedNodeProperty, TextProperty } from './Property';
import Paragraph from './Paragraph';
import Graph from './Graph';
import Subject from './Subject';

export class PageHead extends Subject {
  // TODO: add parent property
  constructor(uri) {
    super(uri);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
    this._predicates.next = new NamedNodeProperty('http://www.solidoc.net/ontologies#NextBlock', 'next');
  }
  public getSparqlForUpdate = (graph: string): string => {
    let sparql = '';
    Object.keys(this._predicates).forEach(key => {
      sparql += this._predicates[key].getSparqlForUpdate(graph, this._uri);
    });
    return sparql;
  }
}

export default class Page extends Graph {
  constructor(uri: string) {
    super(uri);
    this._nodes[uri] = new PageHead(uri);
  }
  protected _addPlaceHolder = (uri: string) => {
    this._nodes[uri] || (this._nodes[uri] = new Paragraph(uri));
  }
}
