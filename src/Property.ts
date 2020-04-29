import { idToType, idToAlias } from '../config/ontology';
import * as _ from 'lodash';

abstract class Property {
  protected id: string;
  protected graph: string;
  protected subject: string;
  protected value = '';
  protected uncommitted = '';
  protected nil = '';

  constructor(id: string, graph: string, subject: string) {
    this.id = id;
    this.graph = graph;
    this.subject = subject;
  }

  public fromQuad(_quad: any, valuesUpdated?: any, valuesFromPod?: any) {
    const alias = idToAlias[this.id];
    if (valuesFromPod && valuesUpdated) {
      valuesFromPod[alias] = valuesUpdated[alias] = this.value;
    }
  }

  public set = (value: string) => {
    this.uncommitted = value;
  };
  public get = (): string => {
    return this.uncommitted;
  };

  protected _deletionClause = (
    valuesUpdated?: any,
    valuesFromPod?: any,
  ): string => {
    let sparql: string = '';
    let alias = idToAlias[this.id];

    if (
      valuesUpdated[alias] !== valuesFromPod[alias] &&
      valuesFromPod[alias] !== this.nil
    ) {
      sparql = `DELETE WHERE { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> ?o } };\n`;
    }
    return sparql;
  };
  protected abstract _insertionClause(valuesUpdated, valuesFromPod): string;

  public getSparqlForUpdate = (
    valuesUpdated: any,
    valuesFromPod: any,
  ): string => {
    return (
      this._deletionClause(valuesUpdated, valuesFromPod) +
      this._insertionClause(valuesUpdated, valuesFromPod)
    );
  };

  public commit = () => {
    this.value = this.uncommitted;
  };

  public undo = () => {
    this.uncommitted = this.value;
  };
}

class NamedNodeProperty extends Property {
  public fromQuad(quad: any, valuesUpdated?: any, valuesFromPod?: any) {
    this.value = quad.object.id;
    this.uncommitted = this.value;
    super.fromQuad(quad, valuesUpdated, valuesFromPod);
  }
  protected _insertionClause = (
    valuesUpdated?: any,
    valuesFromPod?: any,
  ): string => {
    let sparql = '';
    let alias = idToAlias[this.id];

    if (
      valuesUpdated[alias] !== valuesFromPod[alias] &&
      valuesUpdated[alias] !== this.nil
    ) {
      sparql += `INSERT DATA { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> <${this.uncommitted}>} };\n`;
    }
    return sparql;
  };
}

class TextProperty extends Property {
  public fromQuad(quad: any, valuesUpdated?: any, valuesFromPod?: any) {
    const text: string = quad.object.id;
    this.value = text.substring(1, text.lastIndexOf('"'));
    this.uncommitted = this.value;
    super.fromQuad(quad, valuesUpdated, valuesFromPod);
  }
  protected _insertionClause = (
    valuesUpdated?: any,
    valuesFromPod?: any,
  ): string => {
    let sparql = '';
    let alias = idToAlias[this.id];

    if (
      valuesUpdated[alias] !== valuesFromPod[alias] &&
      valuesUpdated[alias] !== this.nil
    ) {
      let backSlashEscaped: string = this.uncommitted.replace(/\\/g, '\\\\');
      let doubleQuoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      sparql += `INSERT DATA { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> "${doubleQuoteEscaped}"} };\n`;
    }
    return sparql;
  };
}

class JsonProperty extends TextProperty {
  constructor(id: string, graph: string, subject: string) {
    super(id, graph, subject);
    this.value = this.uncommitted = this.nil = '{}';
  }

  public set = (value: string) => {
    let json = JSON.parse(value);
    if (!_.isEqual(json, JSON.parse(this.uncommitted))) {
      this.uncommitted = value;
    }
  };
}

const Prop = {
  create: (id: string, graph: string, subject: string): Property => {
    const type = idToType[id];
    switch (type) {
      case 'NamedNode':
        return new NamedNodeProperty(id, graph, subject);
      case 'Text':
        return new TextProperty(id, graph, subject);
      case 'Json':
        return new JsonProperty(id, graph, subject);
      default:
        throw new Error('Unknown property type: ' + type);
    }
  },

  commit: (prop: Property) => {
    prop.commit();
  },

  undo: (prop: Property) => {
    prop.undo();
  },

  // getSparql: (sparql: string, prop: Property): string => {
  //   return sparql + prop.getSparqlForUpdate();
  // },
};

export { Property, NamedNodeProperty, TextProperty, JsonProperty, Prop };
