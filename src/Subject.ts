import { Predicate } from './Predicate';
import {
  subjTypeToPredArray,
  predIdToAlias,
  ont,
  aliasToPredId,
} from '../config/ontology';
import { Node } from './interface';
import * as _ from 'lodash';

const createValueTemplate = () => {
  return {
    id: '',
    type: '',
  };
};

class Subject {
  protected _id: string;
  protected _type: string;
  protected _graph: string;
  protected _predicates: { [key: string]: Predicate };
  private _isDeleted: boolean = false;
  private _isInserted: boolean = false;

  protected _valuesUpdated: any = createValueTemplate();
  protected _valuesFromPod: any = createValueTemplate();

  constructor(
    id: string,
    type: string,
    graph: string,
    predicates: { [key: string]: Predicate },
  ) {
    this._id = id;
    this._type = type;
    this._graph = graph;
    this._valuesUpdated.id = this._valuesFromPod.id = id;
    this._predicates = predicates;
    this._assignInitValues();
  }

  private _assignInitValues = () => {
    const predIdArray: string[] = subjTypeToPredArray;
    predIdArray.forEach(predId => {
      // const alias = predIdToAlias[predId];

      // TODO: initial value set to default
      this._valuesFromPod[predId] = this._valuesUpdated[predId] = '';
    });
  };

  public fromQuad(quad: any) {
    if (!this._predicates[quad.predicate.id]) {
      return;
    }
    const value: string = this._predicates[quad.predicate.id].fromQuad(quad);
    this._valuesFromPod[quad.predicate.id] = value;
    this._valuesUpdated[quad.predicate.id] = value;
  }

  public toJson(): Node {
    let result = {
      id: this._id,
      type: this._type,
      children: [],
    };

    if (this._type === ont.sdoc.leaf) {
      delete result.children;
    }
    Object.keys(this._predicates).forEach(predId => {
      const alias = predIdToAlias[predId];
      [ont.sdoc.next, ont.sdoc.firstChild, ont.rdf.type].includes(predId) ||
        this.getProperty(predId) === '' ||
        (result[alias] = this.getProperty(predId));
    });

    return result;
  }

  public getProperty(predId: string): string {
    if (predId === 'id') {
      return this._id;
    }
    if (!this._predicates[predId]) {
      throw new Error('Try to get an unknown Predicate: ' + this._id + predId);
    }
    return this._valuesUpdated[predId];
  }

  public setProperty(predId: string, value: string) {
    if (!this._predicates[predId]) {
      throw new Error('Try to set an unknown Predicate: ' + this._id + predId);
    }
    // TODO: should throw on getting 'next' for Root?
    this._valuesUpdated[predId] = value;
  }

  public set(node: Node) {
    if (this._isDeleted) {
      throw new Error('Trying to update a deleted subject: ' + this._id);
    }

    Object.keys(node).forEach(alias => {
      if (alias === 'id' || alias === 'children') {
        //
      } else {
        const predId = aliasToPredId[alias];
        this.setProperty(predId, node[alias]);
      }
    });
  }

  public getSparqlForUpdate = (): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
      return `DELETE WHERE { GRAPH <${this._graph}> { <${this._id}> ?p ?o } };\n`;
    } else {
      let sparql = '';
      Object.keys(this._predicates).forEach(predId => {
        sparql += this._predicates[predId].getSparql(
          this._id,
          this._valuesUpdated[predId],
          this._valuesFromPod[predId],
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
    if (this._id === this._graph) {
      throw new Error('The root is not removable :' + this._id);
    }
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

export { Subject };
