import * as _ from 'lodash';
import { predIdToLabel, predIdToRange, ont } from '../config/ontology';
import { Object } from './Subject';

class Predicate {
  private _id: string;
  private _range: string;
  private _label: string;
  private _graph: string;
  private _default: Object;

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

  public get default(): Object {
    return this._default;
  }

  public get label(): string {
    return this._label;
  }

  public get range(): string {
    return this._range;
  }

  public _setRange(range: string) {
    this._range = range;
    switch (this._range) {
      case ont.xsd.string:
        this._default = {
          value: '',
          type: this._range,
        };
        break;
      case ont.xsd.boolean:
        this._default = {
          value: false,
          type: this._range,
        };
        break;
      default:
        // NamedNode
        this._default = {
          value: undefined,
          type: this._range,
        };
        break;
    }
  }

  public getSparql(
    subject: string,
    updated: Object | undefined,
    initial: Object | undefined,
  ): string {
    return (
      this._deleteClause(subject, updated, initial) +
      this._insertClause(subject, updated, initial)
    );
  }

  private _deleteClause = (
    subject: string,
    updated: Object | undefined,
    initial: Object | undefined,
  ): string => {
    return this._shouldDelete(updated, initial)
      ? `DELETE WHERE { GRAPH <${this._graph}> { <${subject}> <${this.id}> ?o } };\n`
      : '';
  };

  private _insertClause = (
    subject: string,
    updated: Object | undefined,
    initial: Object | undefined,
  ): string => {
    return this._shouldInsert(updated, initial)
      ? `INSERT DATA { GRAPH <${this._graph}> { <${subject}> <${
          this.id
        }> ${this._escape(<Object>updated)}} };\n`
      : '';
  };

  private _shouldDelete(
    updated: Object | undefined,
    initial: Object | undefined,
  ): boolean {
    return !(
      _.isEqual(updated, initial) ||
      _.isEqual(initial, this._default) ||
      initial === undefined
    );
  }

  private _shouldInsert(
    updated: Object | undefined,
    initial: Object | undefined,
  ): boolean {
    return !(
      _.isEqual(updated, initial) ||
      _.isEqual(updated, this._default) ||
      updated === undefined
    );
  }

  // TODO: extract from Predicate
  private _escape(obj: Object): string {
    switch (obj.type) {
      case ont.xsd.anyURI:
        return `<${obj.value}>`;
      case ont.xsd.boolean:
        return `"${obj.value}"^^${ont.xsd.boolean}`;
      default:
        // xsd:string case
        const backSlashEscaped: string = (<string>obj.value).replace(
          /\\/g,
          '\\\\',
        );
        const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
        return `"${quoteEscaped}"`;
    }
  }

  // public fromQuad(quad: any): string {
  //   const value: string = quad.object.id;
  //   switch (this._range) {
  //     case ont.xsd.string:
  //       return value.substring(1, value.lastIndexOf('"'));
  //     // case 'Boolean':
  //     //   return value.startsWith(`"true"`);
  //     default:
  //       return value;
  //   }
  // }
}

export { Predicate };
