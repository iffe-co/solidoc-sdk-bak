import { Subject, createSubject } from './Subject'
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
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        let subject = this.createSubject({
          id: quad.subject.id,
          type: quad.object.id, // TODO: should only createSubject for known types
          children: [], // TODO: this is a workaround to deceive the type check
        });
        subject.setFromPod();
      }
    })

    // Should always create the root
    if (!this.getRoot()) {
      let root = this.createSubject({
        id: this._id,
        type: 'http://www.solidoc.net/ontologies#Root',
        children: [],
      });
      root.setFromPod()
    }

    quads.forEach(quad => {
      let subject = this._subjectMap.get(quad.subject.id)
      subject?.fromQuad(quad)
    })
  }

  public getRoot = (): Subject | undefined => {
    return this._subjectMap.get(this._id)
  }

  public getSubject = (id: string): Subject | undefined => {
    return this._subjectMap.get(id)
  }

  public createSubject = (json: Node): Subject => {
    return createSubject(json, this._subjectMap)
  }

  public getSparqlForUpdate(): string {
    let sparql = '';
    for (let subject of this._subjectMap.values()) {
      sparql += subject.getSparqlForUpdate(this._id);
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
      if (!subject.isFromPod()) {
        this._subjectMap.delete(id)
      } else {
        subject.undo();
      }
    }
  }
}

export { Graph }
