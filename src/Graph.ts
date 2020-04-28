import { Subject, createSubject } from './Subject'
import { ont } from '../config/ontology'
import { Node } from './interface'
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
class Graph {
  protected _id: string
  protected _subjectMap = new Map<string, Subject>();

  constructor(id: string, turtle: string) {
    this._id = id;
    this._parseTurtle(turtle)
  }

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
    })

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
      let subject = this.getSubject(quad.subject.id)
      subject.fromQuad(quad)
    })
  }

  public getRoot = (): Subject => {
    return this.getSubject(this._id)
  }

  public getSubject = (id: string): Subject => {
    const subject = this._subjectMap.get(id)
    if (!subject) {
      throw new Error('Subject not found: ' + id)
    }
    return subject
  }

  public createSubject = (json: Node): Subject => {
    if (this._subjectMap.get(json.id)) {
      throw new Error('duplicated subject creation: ' + json.id)
    }
    let subject = createSubject(json, this._id)
    this._subjectMap.set(json.id, subject)
    return subject
  }

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
        this._subjectMap.delete(id)
      } else {
        subject.undo();
      }
    }
  }
}

export { Graph }
