import * as _ from 'lodash';
import { idToLabel, predIdToRange, ont } from '../config/ontology';
import { Object } from './Object';

class Predicate {
  private _id: string;
  private _range: string;
  private _label: string;
  private _graph: string;
  private _default: Object;

  constructor(id: string, graph: string) {
    this._id = id;
    this._graph = graph;
    this._label = idToLabel[id];
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
      case ont.xsd.dateTime:
        this._default = {
          value: new Date(0),
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
        }> ${Object.escape(<Object>updated)}} };\n`
      : '';
  };

  private _shouldDelete(
    updated: Object | undefined,
    initial: Object | undefined,
  ): boolean {
    return !_.isEqual(updated, initial) && initial !== undefined;
  }

  private _shouldInsert(
    updated: Object | undefined,
    initial: Object | undefined,
  ): boolean {
    return !_.isEqual(updated, initial) && updated !== undefined;
  }
}

export { Predicate };
