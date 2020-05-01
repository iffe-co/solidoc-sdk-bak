import * as _ from 'lodash';

class Predicate {
  private _id: string;
  private _type: 'NamedNode' | 'Text';
  private _graph: string;
  private _default: string = '';

  constructor(id: string, type: 'NamedNode' | 'Text', graph: string) {
    this._id = id;
    this._graph = graph;
    this.setType(type);
  }

  public setType(type: 'NamedNode' | 'Text') {
    this._type = type;
    this._default = '';
  }

  public getSparql(subject: string, updated: string, initial: string): string {
    return (
      this._deleteClause(subject, updated, initial) +
      this._insertClause(subject, updated, initial)
    );
  }

  private _deleteClause = (
    subject: string,
    updated: string,
    initial: string,
  ): string => {
    return this._equal(updated, initial) || this._equal(initial, this._default)
      ? ''
      : `DELETE WHERE { GRAPH <${this._graph}> { <${subject}> <${this._id}> ?o } };\n`;
  };

  private _insertClause = (
    subject: string,
    updated: string,
    initial: string,
  ): string => {
    return this._equal(updated, initial) || this._equal(updated, this._default)
      ? ''
      : `INSERT DATA { GRAPH <${this._graph}> { <${subject}> <${
          this._id
        }> ${this._escape(updated)}} };\n`;
  };

  private _escape(value: string): string {
    if (this._type === 'Text') {
      const backSlashEscaped: string = value.replace(/\\/g, '\\\\');
      const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      return `"${quoteEscaped}"`;
    }
    return `<${value}>`;
  }

  private _equal(a: string, b: string): boolean {
    return a === b;
  }

  public fromQuad(quad: any): string {
    if (this._type === 'NamedNode') {
      return quad.object.id;
    }
    const text: string = quad.object.id;
    return text.substring(1, text.lastIndexOf('"'));
  }
}

export { Predicate };
