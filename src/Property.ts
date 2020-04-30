import * as _ from 'lodash';

class Property {
  private _id: string;
  private _type: 'NamedNode' | 'Text' | 'Json';
  private _graph: string;
  private _subject: string;
  private _default: string = '';

  constructor(
    id: string,
    type: 'NamedNode' | 'Text' | 'Json',
    graph: string,
    subject: string,
  ) {
    this._id = id;
    this._graph = graph;
    this._subject = subject;
    this.setType(type);
  }

  public setType(type: 'NamedNode' | 'Text' | 'Json') {
    this._type = type;
    this._default = this._type === 'Json' ? '{}' : '';
  }

  public getSparql(updated, initial): string {
    return (
      this._deleteClause(updated, initial) +
      this._insertClause(updated, initial)
    );
  }

  private _deleteClause = (updated: string, initial: string): string => {
    return updated === initial || initial === this._default
      ? ''
      : `DELETE WHERE { GRAPH <${this._graph}> { <${this._subject}> <${this._id}> ?o } };\n`;
  };

  private _insertClause = (updated: string, initial: string): string => {
    const escaped: string = this._escape(updated);
    return updated === initial || updated === this._default
      ? ''
      : `INSERT DATA { GRAPH <${this._graph}> { <${this._subject}> <${this._id}> "${escaped}"} };\n`;
  };

  private _escape(value: string): string {
    if (this._type === 'Text' || this._type === 'Json') {
      const backSlashEscaped: string = value.replace(/\\/g, '\\\\');
      const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      return quoteEscaped;
    }
    return value;
  }

  public fromQuad(quad: any): string {
    if (this._type === 'NamedNode') {
      return quad.object.id;
    }
    const text: string = quad.object.id;
    return text.substring(1, text.lastIndexOf('"'));
  }
}

export { Property };
