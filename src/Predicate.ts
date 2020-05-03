import * as _ from 'lodash';
import { predIdToAlias, predIdToType } from '../config/ontology';

class Predicate {
  private _id: string;
  private _type: 'NamedNode' | 'Text';
  private _alias: string;
  private _graph: string;
  private _default: string = '';

  constructor(id: string, graph: string) {
    this._id = id;
    this._graph = graph;
    this._alias = predIdToAlias[id];
    const type = predIdToType[id];
    this.setType(type);
  }

  public get id(): string {
    return this._id;
  }

  public get default(): string {
    return this._default;
  }

  public get alias(): string {
    return this._alias;
  }

  public setType(type: 'NamedNode' | 'Text') {
    this._type = type;
    this._default = '';
  }

  public getSparql(
    subject: string,
    updated: string | undefined,
    initial: string | undefined,
  ): string {
    return (
      this._deleteClause(subject, updated, initial) +
      this._insertClause(subject, updated, initial)
    );
  }

  private _deleteClause = (
    subject: string,
    updated: string | undefined,
    initial: string | undefined,
  ): string => {
    return this._shouldDelete(updated, initial)
      ? `DELETE WHERE { GRAPH <${this._graph}> { <${subject}> <${this._id}> ?o } };\n`
      : '';
  };

  private _insertClause = (
    subject: string,
    updated: string | undefined,
    initial: string | undefined,
  ): string => {
    return this._shouldInsert(updated, initial)
      ? `INSERT DATA { GRAPH <${this._graph}> { <${subject}> <${
          this._id
        }> ${this._escape(<string>updated)}} };\n`
      : '';
  };

  private _shouldDelete(
    updated: string | undefined,
    initial: string | undefined,
  ): boolean {
    return (
      updated !== initial && initial !== this._default && initial !== undefined
    );
  }

  private _shouldInsert(
    updated: string | undefined,
    initial: string | undefined,
  ): boolean {
    return (
      updated !== initial && updated !== this._default && updated !== undefined
    );
  }

  private _escape(value: string): string {
    if (this._type === 'Text') {
      const backSlashEscaped: string = value.replace(/\\/g, '\\\\');
      const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      return `"${quoteEscaped}"`;
    }
    return `<${value}>`;
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
