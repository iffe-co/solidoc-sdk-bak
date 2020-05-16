import { Predicate as Pred } from './Predicate';
import { Object as Obj, Literal } from './Object';
import { myNode as Node } from './interface';
import * as _ from 'lodash';
import { ont, defaultJson, idToLabel, labelToId } from '../config/ontology';

class Subject {
  private _id: string;
  private _type: string;
  private _graph: string;
  private _isDeleted: boolean = false;
  private _isInserted: boolean = false;

  private _valuesUpdated = new Map<Pred, Obj>();
  private _valuesFromPod = new Map<Pred, Obj>();

  constructor(id: string, graph: string) {
    this._id = id;
    this._graph = graph;
  }

  public get id(): string {
    return this._id;
  }

  public get type(): string {
    return this._type;
  }

  public fromQuad(pred: Pred, obj: any) {
    const result = Obj.fromQuad(obj);

    this._valuesFromPod.set(pred, { ...result });

    pred.id === ont.rdf.type && this._setType(result);
  }

  private _setType(typeObj: Obj) {
    const typeId = <string>Obj.getValue(typeObj);
    this._type = idToLabel[typeId];
  }

  public getProperty(pred: Pred): Literal {
    const obj: Obj = this._valuesFromPod.get(pred) || pred.default;
    return Obj.getValue(obj);
  }

  public setProperty(pred: Pred, value: Literal) {
    const obj = Obj.fromValue(pred.range, value);
    this._valuesUpdated.set(pred, obj);

    pred.id === ont.rdf.type && this._setType(obj);
  }

  public toJson(): Node {
    const result = defaultJson(this.id, this.type);

    for (let pred of this._valuesFromPod.keys()) {
      switch (pred.id) {
        case ont.sdoc.next:
        case ont.sdoc.firstChild:
        case ont.rdf.type:
          break;
        default:
          result[pred.label] = this.getProperty(pred);
      }
    }

    return result;
  }

  public fromJson(node: Node, predMap: Map<string, Pred>) {
    let pred: Pred | undefined;
    let value: Literal;

    Object.keys(node).forEach(label => {
      switch (label) {
        case 'id':
        case 'children':
          break;
        case 'type':
          pred = predMap.get(ont.rdf.type);
          value = labelToId[node[label]];
          pred && this.setProperty(pred, value);
          break;
        default:
          pred = predMap.get(labelToId[label]);
          value = <Literal>node[label];
          pred && this.setProperty(pred, value);
      }
    });
  }

  public getSparqlForUpdate = (): string => {
    let allPred = new Set<Pred>([
      ...this._valuesFromPod.keys(),
      ...this._valuesUpdated.keys(),
    ]);

    let sparql = '';
    for (let pred of allPred) {
      const initial = this._valuesFromPod.get(pred);
      const updated = this._valuesUpdated.get(pred);
      sparql += pred.getSparql(this._id, updated, initial);
    }
    return sparql;
  };

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed');
    }

    this._valuesFromPod = _.cloneDeep(this._valuesUpdated);
    this._valuesUpdated.clear();

    this._isInserted = false;
  };

  public undo() {
    if (this._isInserted) {
      throw new Error('A non-persisted subject should not be undone');
    }

    this._valuesUpdated.clear();

    this._isDeleted = false;
  }

  public set isDeleted(val: boolean) {
    if (this._id === this._graph && val === true) {
      throw new Error('The root is not removable :' + this._id);
    }
    this._isDeleted = val;

    val === true && this._valuesUpdated.clear();
  }

  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public get isInserted(): boolean {
    return this._isInserted;
  }

  public set isInserted(val: boolean) {
    this._isInserted = val;
  }
}

export { Subject };
