import * as _ from 'lodash';
import { predIdToLabel, predIdToRange } from '../config/ontology';

class Predicate {
  private _id: string;
  private _range: 'NamedNode' | 'Text';
  private _label: string;
  private _graph: string;
  private _default: string | undefined;

  constructor(id: string, graph: string) {
    this._id = id;
    this._graph = graph;
    this._label = predIdToLabel[id];
    const range = predIdToRange[id];
    this._setRange(range);
  }

  public get id(): string {
    return this._id;
  }

  public get default(): string | undefined {
    return this._default;
  }

  public get label(): string {
    return this._label;
  }

  public _setRange(range: 'NamedNode' | 'Text') {
    this._range = range;
    switch (this._range) {
      case 'Text':
        this._default = '';
        break;
      // case 'Boolean':
      //   this._default = false;
      //   break;
      default:
        this._default = undefined;
        break;
    }
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
      ? `DELETE WHERE { GRAPH <${this._graph}> { <${subject}> <${this.id}> ?o } };\n`
      : '';
  };

  private _insertClause = (
    subject: string,
    updated: string | undefined,
    initial: string | undefined,
  ): string => {
    return this._shouldInsert(updated, initial)
      ? `INSERT DATA { GRAPH <${this._graph}> { <${subject}> <${
          this.id
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
    if (this._range === 'Text') {
      const backSlashEscaped: string = value.replace(/\\/g, '\\\\');
      const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      return `"${quoteEscaped}"`;
    }
    return `<${value}>`;
  }

  public fromQuad(quad: any): string {
    const value: string = quad.object.id;
    switch (this._range) {
      case 'Text':
        return value.substring(1, value.lastIndexOf('"'));
      // case 'Boolean':
      //   return value.startsWith(`"true"`);
      default:
        return value;
    }
  }
}

export { Predicate };
