import { Subject } from './Subject';
import { Literal } from './Object';
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
    this._parseTurtle(turtle);
  }

  public createSubject = (subjectId: string): Subject => {
    let subject = this._subjectMap.get(subjectId);

    if (!subject) {
      subject = new Subject(subjectId, this._id);
      this._subjectMap.set(subjectId, subject);
    } else if (subject.isDeleted) {
      subject.isDeleted = false;
    } else {
      throw new Error('Duplicated subject creation: ' + subjectId);
    }
    return subject;
  };

  public getSubject = (subjectId: string): Subject => {
    const subject = this._subjectMap.get(subjectId);
    if (!subject) {
      throw new Error('Subject not found: ' + subjectId);
    }
    return subject;
  };

  public getRoot = (): Subject => {
    return this.getSubject(this._id);
  };

  public createPredicate = (predId: string): Predicate => {
    let predicate =
      this._predicateMap.get(predId) || new Predicate(predId, this._id);
    this._predicateMap.set(predId, predicate);
    return predicate;
  };

  public getPredicate = (predicateId: string): Predicate => {
    const predicate = this._predicateMap.get(predicateId);
    if (!predicate) {
      throw new Error('Predicate not found: ' + predicateId);
    }
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

      subject.fromQuad(predicate, quad.object);
    });
  };

  public getValue = (subjectId: string, predicateId: string): Literal => {
    const subject = this.getSubject(subjectId);
    const predicate = this.getPredicate(predicateId);
    return subject.getProperty(predicate);
  };

  public setValue = (
    subjectId: string,
    predicateId: string,
    value: Literal,
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
      subject.isDeleted ? this._subjectMap.delete(id) : subject.commit();
    }
  }

  public undo() {
    for (let [id, subject] of this._subjectMap.entries()) {
      subject.isInserted ? this._subjectMap.delete(id) : subject.undo();
    }
  }
}

export { Graph };
