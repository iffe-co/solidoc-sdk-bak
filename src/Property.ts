abstract class Property {
  id: string
  name: string
  value = ''
  uncommitted = ''

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
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
    if (this.uncommitted !== this.value && this.value) {
      sparql = `WITH <${graph}> DELETE WHERE { <${subject}> <${this.id}> ?o };\n`;
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
    if (this.uncommitted !== this.value && this.uncommitted) {
      let backSlashEscaped: string = this.uncommitted.replace(/\\/g, '\\\\');
      let doubleQuoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      sparql += `INSERT DATA { GRAPH <${graph}> { <${subject}> <${this.id}> "${doubleQuoteEscaped}"} };\n`;
    }
    return sparql;
  }
}

class JsonProperty extends TextProperty {
  options: any
  constructor(id: string, name: string) {
    super(id, name)
    this.value = this.uncommitted = '{}'
    this.options = {}
  }

  public set = (json: any) => {
    for (const key in json) {
      const value = json[key]

      if (value == null) {
        delete this.options[key]
      } else {
        this.options[key] = value
      }
    }

    this.uncommitted = JSON.stringify(this.options);
  }

  public fromQuad = (quad: any) => {
    const text: string = quad.object.id;
    this.value = text.substring(1, text.lastIndexOf('"'));
    this.uncommitted = this.value;
    this.options = JSON.parse(this.value)
  }

  protected _getSparqlForDeletion = (graph: string, subject: string): string => {
    let sparql: string = ''
    // TODO: could same object values be stringified to different strings?
    if (this.uncommitted !== this.value && this.value !== '{}') {
      sparql = `WITH <${graph}> DELETE WHERE { <${subject}> <${this.id}> ?o };\n`;
    }
    return sparql
  }

}

export { Property, NamedNodeProperty, TextProperty, JsonProperty }
