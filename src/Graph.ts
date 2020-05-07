import { Subject } from './Subject';
import { subjTypeToPredArray } from '../config/ontology';
import { Predicate } from './Predicate';
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
class Graph {
  protected _id: string = '';
  protected _subjectMap = new Map<string, Subject>();
  protected _predicateMap = new Map<string, Predicate>();

  constructor(id: string, turtle: string) {
    this._id = id;
    this.createSubject(id);
    this.createAllPredicates();
    this._parseTurtle(turtle);
  }

  private createAllPredicates = () => {
    const predIdArray: string[] = subjTypeToPredArray;
    predIdArray.forEach(this.createPredicate);
  };

  public createPredicate = (predId: string): Predicate => {
    if (this._predicateMap.get(predId)) {
      throw new Error('duplicated predicate creation: ' + predId);
    }
    let predicate = new Predicate(predId, this._id);
    this._predicateMap.set(predId, predicate);
    return predicate;
  };

  private _parseTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      const subject =
        this._subjectMap.get(quad.subject.id) ||
        this.createSubject(quad.subject.id);
      const predicate =
        this._predicateMap.get(quad.predicate.id) ||
        this.createPredicate(quad.predicate.id);
      subject.fromQuad(predicate, quad);
    });
  };

  public getRoot = (): Subject => {
    return this.getSubject(this._id);
  };

  public getSubject = (subjectId: string): Subject => {
    const subject = this._subjectMap.get(subjectId);
    if (!subject) {
      throw new Error('Subject not found: ' + subjectId);
    }
    return subject;
  };

  public getPredicate = (predicateId: string): Predicate => {
    const predicate = this._predicateMap.get(predicateId);
    if (!predicate) {
      throw new Error('Predicate not found: ' + predicateId);
    }
    return predicate;
  };

  public createSubject = (subejectId: string): Subject => {
    if (this._subjectMap.get(subejectId)) {
      throw new Error('duplicated subject creation: ' + subejectId);
    }
    const subject = new Subject(subejectId, this._id);
    this._subjectMap.set(subejectId, subject);
    return subject;
  };

  public getValue = (subjectId: string, predicateId: string) => {
    const subject = this.getSubject(subjectId);
    const predicate = this.getPredicate(predicateId);
    return subject.getProperty(predicate);
  };

  public setValue = (
    subjectId: string,
    predicateId: string,
    value: string | boolean | undefined,
  ) => {
    const subject = this.getSubject(subjectId);
    const predicate = this.getPredicate(predicateId);
    return subject.setProperty(predicate, value);
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
      subject.isDeleted() ? this._subjectMap.delete(id) : subject.commit();
    }
  }

  public undo() {
    for (let [id, subject] of this._subjectMap.entries()) {
      subject.isInserted() ? this._subjectMap.delete(id) : subject.undo();
    }
  }
}

export { Graph };
