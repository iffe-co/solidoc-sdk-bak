import { Predicate } from './Predicate';
import {
  ont,
  subjTypeToPredArray,
  predIdToAlias,
  predIdToType,
} from '../config/ontology';
import { Element, Node } from './interface';
import * as _ from 'lodash';

const createValueTemplate = () => {
  return {
    id: '',
    type: '',
    options: '{}',
  };
};

class Subject {
  protected _id: string;
  protected _type: string;
  protected _graph: string;
  protected _predicates: { [key: string]: Predicate } = {};
  private _isDeleted: boolean = false;
  private _isInserted: boolean = false;

  protected _valuesUpdated: any = createValueTemplate();
  protected _valuesFromPod: any = createValueTemplate();

  constructor(id: string, type: string, graph: string) {
    this._id = id;
    this._type = type;
    this._graph = graph;
    this._valuesUpdated.id = this._valuesFromPod.id = id;
    this._createPredicates();
  }

  private _createPredicates() {
    const predIdArray: string[] = subjTypeToPredArray[this._type];
    this._predicates = {};
    predIdArray.forEach(predId => {
      const alias = predIdToAlias[predId];
      this._valuesFromPod[alias] = this._valuesUpdated[alias] =
        predIdToType[predId] === 'Json' ? '{}' : '';
      this._predicates[alias] = new Predicate(
        predId,
        predIdToType[predId],
        this._graph,
        this._id,
      );
    });
  }

  public fromQuad(quad: any) {
    const alias = predIdToAlias[quad.predicate.id];
    if (!alias || !this._predicates[alias]) {
      return;
    }
    const value: string = this._predicates[alias].fromQuad(quad);
    this._valuesFromPod[alias] = this._valuesUpdated[alias] = value;
  }

  public toJson(): Node {
    let result = {
      id: this._id,
      type: this.getProperty('type'),
      ...JSON.parse(this.getProperty('options')),
    };

    Object.keys(this._predicates).forEach(alias => {
      ['next', 'firstChild', 'options', 'type'].includes(alias) ||
        (result[alias] = this.getProperty(alias));
    });

    return result;
  }

  public getProperty(alias: string): string {
    if (alias !== 'id' && !this._predicates[alias]) {
      // TODO: get from options?
      throw new Error('Try to get an unknown Predicate: ' + this._id + alias);
    }
    return this._valuesUpdated[alias];
  }

  public setProperty(alias: string, value: string) {
    if (!this._predicates[alias]) {
      // TODO: get from options?
      throw new Error('Try to get an unknown Predicate: ' + this._id + alias);
    }
    this._valuesUpdated[alias] = value;
  }

  public set(node: Node) {
    if (this._isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._id);
    }

    const newOptions = {};
    Object.keys(node).forEach(alias => {
      if (alias === 'id' || alias === 'children') {
        //
      } else if (this._predicates[alias]) {
        this.setProperty(alias, node[alias]);
      } else {
        newOptions[alias] = node[alias];
      }
    });
    this.setProperty('options', JSON.stringify(newOptions));
  }

  public getSparqlForUpdate = (): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
      return `DELETE WHERE { GRAPH <${this._graph}> { <${this._id}> ?p ?o } };\n`;
    } else {
      let sparql = '';
      Object.keys(this._predicates).forEach(alias => {
        sparql += this._predicates[alias].getSparql(
          this._valuesUpdated[alias],
          this._valuesFromPod[alias],
        );
      });
      return sparql;
    }
  };

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed');
    }

    this._valuesFromPod = _.cloneDeep(this._valuesUpdated);

    this._isInserted = false;
  };

  public undo() {
    if (this._isInserted) {
      throw new Error('A non-persisted subject should not be undone');
    }

    this._valuesUpdated = _.cloneDeep(this._valuesFromPod);

    this._isDeleted = false;
  }

  public delete() {
    this._isDeleted = true;
  }

  public isDeleted = (): boolean => {
    return this._isDeleted;
  };

  public isInserted = (): boolean => {
    return this._isInserted;
  };

  public insert = () => {
    this._isInserted = true;
  };
}

class Branch extends Subject {
  public toJson(): Element {
    return {
      ...super.toJson(),
      children: [],
    };
  }
}

class Root extends Branch {
  /**
   * Override to reject #nextNode Predicate
   */
  public fromQuad(quad: any) {
    if (quad.predicate.id === ont.sdoc.next) {
      throw new Error('fromQuad: The root may not have syblings: ' + this._id);
    }
    super.fromQuad(quad);
  }

  /**
   * Override to prevent setting "next"
   */
  public setProperty(alias: string, value: string) {
    if (alias === 'next') {
      throw new Error(
        'setProperty: The root may not have syblings: ' + this._id,
      );
    }
    super.setProperty(alias, value);
  }

  /**
   * Override to prevent deletion
   */
  public delete() {
    throw new Error('The root is not removable :' + this._id);
  }
}

const createSubject = (json: Node, graph: string): Subject => {
  let subject: Subject;
  switch (json.type) {
    case ont.sdoc.root:
      subject = new Root(json.id, json.type, graph);
      break;
    case ont.sdoc.leaf:
      subject = new Subject(json.id, json.type, graph);
      break;
    default:
      subject = new Branch(json.id, json.type, graph);
      break;
  }
  // subject.set(json)

  return subject;
};

export { Subject, Branch, Root, createSubject };
