import * as _ from 'lodash'

abstract class Property {
  id: string
  alias: string
  value = ''
  uncommitted = ''
  nullValue = ''

  constructor(id: string, alias: string) {
    this.id = id;
    this.alias = alias;
  }

  public abstract fromQuad(quad: any): void

  public set = (value: string) => {
    this.uncommitted = value;
  }
  public get = (): string => {
    return this.uncommitted;
  }

  protected _getSparqlForDeletion = (graph: string, subject: string): string => {
    let sparql: string = ''
    if (this.uncommitted !== this.value && this.value !== this.nullValue) {
      sparql = `DELETE WHERE { GRAPH <${graph}> { <${subject}> <${this.id}> ?o } };\n`;
    }
    return sparql
  }
  protected abstract _getSparqlForInsertion(graph: string, subject: string): string

  public getSparqlForUpdate = (graph: string, subject: string): string => {
    return this._getSparqlForDeletion(graph, subject) + this._getSparqlForInsertion(graph, subject)
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
  protected _getSparqlForInsertion = (graph: string, subject: string): string => {
    let sparql = ''
    if (this.uncommitted !== this.value && this.uncommitted) {
      sparql += `INSERT DATA { GRAPH <${graph}> { <${subject}> <${this.id}> <${this.uncommitted}>} };\n`;
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
  protected _getSparqlForInsertion = (graph: string, subject: string): string => {
    let sparql = ''
    if (this.uncommitted !== this.value && this.uncommitted !== this.nullValue) {
      let backSlashEscaped: string = this.uncommitted.replace(/\\/g, '\\\\');
      let doubleQuoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      sparql += `INSERT DATA { GRAPH <${graph}> { <${subject}> <${this.id}> "${doubleQuoteEscaped}"} };\n`;
    }
    return sparql;
  }
}

class JsonProperty extends TextProperty {
  json: any
  constructor(id: string, alias: string) {
    super(id, alias)
    this.value = this.uncommitted = this.nullValue = '{}'
  }

  public set = (json: any) => {
    if (!_.isEqual(json, JSON.parse(this.uncommitted))) {
      this.uncommitted = JSON.stringify(json);
    }
  }

}

export { Property, NamedNodeProperty, TextProperty, JsonProperty }
