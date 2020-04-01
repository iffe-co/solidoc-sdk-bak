export default abstract class Property {
  id: string
  name: string
  value = ''
  uncommitted = ''

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public abstract fromQuad (quad: any): void

  public set = (value: string) => {
    this.uncommitted = value;
  }
  public get = (): string => {
    return this.uncommitted;
  }

  public toJson = (): any => {
    const json: any = {};
    json[this.name] = this.value;
    return json;
  }

  public abstract getSparqlForUpdate (graph: string, subject: string): string

  public commit = () => {
    this.value = this.uncommitted;
  }

  // TODO: undo
}

export class NamedNodeProperty extends Property {
  public fromQuad = (quad: any) => {
    this.value = quad.object.id;
    this.uncommitted = this.value;
  }
  public getSparqlForUpdate = (graph: string, subject: string): string => {
    let sparql = '';
    // TODO: multi-value case?
    if (this.uncommitted !== this.value) {
      if (this.value) {
        sparql += `WITH <${graph}> DELETE { <${subject}> <${this.id}> ?o } WHERE { <${subject}> <${this.id}> ?o };\n`;
      }
      if (this.uncommitted) {
        sparql += `INSERT DATA { GRAPH <${graph}> { <${subject}> <${this.id}> <${this.uncommitted}>} };\n`;
      }
    }
    return sparql;
  }
}

export class TextProperty extends Property {
  public fromQuad = (quad: any) => {
    const text: string = quad.object.id;
    this.value = text.substring(1, text.lastIndexOf('"'));
    this.uncommitted = this.value;
  }
  public getSparqlForUpdate = (graph: string, subject: string): string => {
    let sparql = '';
    if (this.uncommitted !== this.value) {
      if (this.value) {
        sparql += `WITH <${graph}> DELETE { <${subject}> <${this.id}> ?o } WHERE { <${subject}> <${this.id}> ?o };\n`;
      }
      if (this.uncommitted) {
        sparql += `INSERT DATA { GRAPH <${graph}> { <${subject}> <${this.id}> "${this.uncommitted}"} };\n`;
      }
    }
    return sparql;
  }
}
