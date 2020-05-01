import { Subject } from './Subject';
import { subjTypeToPredArray, predIdToType, ont } from '../config/ontology';
import { Predicate } from './Predicate';
import { Node } from './interface';
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
class Graph {
  protected _id: string = '';
  protected _subjectMap = new Map<string, Subject>();
  protected _predicates: { [key: string]: Predicate } = {};

  constructor(id: string, turtle: string) {
    this._id = id;
    this.createPredicates();
    this._parseTurtle(turtle);
  }

  private createPredicates = () => {
    const predIdArray: string[] = subjTypeToPredArray;
    predIdArray.forEach(predId => {
      // const alias = predIdToAlias[predId];
      this._predicates[predId] = new Predicate(
        predId,
        predIdToType[predId],
        this._id,
      );
    });
  };

  private _parseTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === ont.rdf.type) {
        this.createSubject({
          id: quad.subject.id,
          type: quad.object.id, // TODO: should only createSubject for known types
          children: [], // TODO: this is a workaround to deceive the type check
        });
      }
    });

    // Should always create the root
    if (!this._subjectMap.get(this._id)) {
      this.createSubject({
        id: this._id,
        type: ont.sdoc.root,
        children: [],
      });
    }

    quads.forEach(quad => {
      // TODO: should it throw on an unknown subject?
      let subject = this.getSubject(quad.subject.id);
      subject.fromQuad(quad);
    });
  };

  public getRoot = (): Subject => {
    return this.getSubject(this._id);
  };

  public getSubject = (id: string): Subject => {
    const subject = this._subjectMap.get(id);
    if (!subject) {
      throw new Error('Subject not found: ' + id);
    }
    return subject;
  };

  public createSubject = (node: Node): Subject => {
    if (this._subjectMap.get(node.id)) {
      throw new Error('duplicated subject creation: ' + node.id);
    }
    let subject = new Subject(node.id, node.type, this._id, this._predicates);
    this._subjectMap.set(node.id, subject);
    return subject;
  };

  public getSparqlForUpdate(): string {
    let sparql = '';
    for (let subject of this._subjectMap.values()) {
      sparql += subject.getSparqlForUpdate();
    }
    return sparql;
  }

  public commit() {
    for (let [id, subject] of this._subjectMap.entries()) {
      if (subject.isDeleted()) {
        this._subjectMap.delete(id);
      } else {
        subject.commit();
      }
    }
  }

  public undo() {
    for (let [id, subject] of this._subjectMap.entries()) {
      if (subject.isInserted()) {
        this._subjectMap.delete(id);
      } else {
        subject.undo();
      }
    }
  }
}

export { Graph };
