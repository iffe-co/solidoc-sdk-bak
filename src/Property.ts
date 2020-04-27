import { idToType } from '../config/ontology'
import * as _ from 'lodash'

abstract class Property {
  protected id: string
  protected graph: string
  protected subject: string
  protected value = ''
  protected uncommitted = ''
  protected nullValue = ''

  constructor(id: string, graph: string, subject: string) {
    this.id = id;
    this.graph = graph;
    this.subject = subject;
  }

  public abstract fromQuad(quad: any): void

  public set = (value: string) => {
    this.uncommitted = value;
  }
  public get = (): string => {
    return this.uncommitted;
  }

  protected _deletionClause = (): string => {
    let sparql: string = ''
    if (this.uncommitted !== this.value && this.value !== this.nullValue) {
      sparql = `DELETE WHERE { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> ?o } };\n`;
    }
    return sparql
  }
  protected abstract _insertionClause(): string

  public getSparqlForUpdate = (): string => {
    return this._deletionClause() + this._insertionClause()
  }

  public commit = () => {
    this.value = this.uncommitted;
  }

  public undo = () => {
    this.uncommitted = this.value;
  }
}

class NamedNodeProperty extends Property {
  public fromQuad = (quad: any) => {
    this.value = quad.object.id;
    this.uncommitted = this.value;
  }
  protected _insertionClause = (): string => {
    let sparql = ''
    if (this.uncommitted !== this.value && this.uncommitted) {
      sparql += `INSERT DATA { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> <${this.uncommitted}>} };\n`;
    }
    return sparql;
  }
}

class TextProperty extends Property {
  public fromQuad = (quad: any) => {
    const text: string = quad.object.id;
    this.value = text.substring(1, text.lastIndexOf('"'));
    this.uncommitted = this.value;
  }
  protected _insertionClause = (): string => {
    let sparql = ''
    if (this.uncommitted !== this.value && this.uncommitted !== this.nullValue) {
      let backSlashEscaped: string = this.uncommitted.replace(/\\/g, '\\\\');
      let doubleQuoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      sparql += `INSERT DATA { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> "${doubleQuoteEscaped}"} };\n`;
    }
    return sparql;
  }
}

class JsonProperty extends TextProperty {
  constructor(id: string, graph: string, subject: string) {
    super(id, graph, subject)
    this.value = this.uncommitted = this.nullValue = '{}'
  }

  public set = (value: string) => {
    let json = JSON.parse(value);
    if (!_.isEqual(json, JSON.parse(this.uncommitted))) {
      this.uncommitted = value;
    }
  }

}

const Prop = {
  create: (id: string, graph: string, subject: string): Property => {
    const type = idToType[id]
    switch (type) {
      case 'NamedNode':
        return new NamedNodeProperty(id, graph, subject);
      case 'Text':
        return new TextProperty(id, graph, subject);
      case 'Json':
        return new JsonProperty(id, graph, subject);
      default:
        throw new Error('Unknown property type: ' + type)
    }
  },

  commit: (prop: Property) => {
    prop.commit();
  },

  undo: (prop: Property) => {
    prop.undo();
  },

  getSparql: (sparql: string, prop: Property): string => {
    return sparql + prop.getSparqlForUpdate()
  }
}

export { Property, NamedNodeProperty, TextProperty, JsonProperty, Prop }
