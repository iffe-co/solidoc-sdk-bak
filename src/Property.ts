import { idToType, idToAlias } from '../config/ontology';
import * as _ from 'lodash';

abstract class Property {
  protected id: string;
  protected graph: string;
  protected subject: string;
  protected valuesFromPod: any;
  protected valuesUpdated: any;
  protected nil = '';

  constructor(
    id: string,
    graph: string,
    subject: string,
    valuesUpdated: any,
    valuesFromPod: any,
  ) {
    this.id = id;
    this.graph = graph;
    this.subject = subject;
    this.valuesFromPod = valuesFromPod;
    this.valuesUpdated = valuesUpdated;
  }

  public abstract fromQuad(_quad: any);

  protected _deletionClause = (): string => {
    let sparql: string = '';
    let alias = idToAlias[this.id];

    if (
      this.valuesUpdated[alias] !== this.valuesFromPod[alias] &&
      this.valuesFromPod[alias] !== this.nil
    ) {
      sparql = `DELETE WHERE { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> ?o } };\n`;
    }
    return sparql;
  };
  protected abstract _insertionClause(): string;

  public getSparqlForUpdate = (): string => {
    return this._deletionClause() + this._insertionClause();
  };
}

class NamedNodeProperty extends Property {
  public fromQuad(quad: any) {
    const alias = idToAlias[this.id];
    this.valuesUpdated[alias] = this.valuesFromPod[alias] = quad.object.id;
  }

  protected _insertionClause = (): string => {
    let sparql = '';
    let alias = idToAlias[this.id];

    if (
      this.valuesUpdated[alias] !== this.valuesFromPod[alias] &&
      this.valuesUpdated[alias] !== this.nil
    ) {
      sparql += `INSERT DATA { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> <${this.valuesUpdated[alias]}>} };\n`;
    }

    return sparql;
  };
}

class TextProperty extends Property {
  public fromQuad(quad: any) {
    const text: string = quad.object.id;
    const alias = idToAlias[this.id];
    this.valuesUpdated[alias] = this.valuesFromPod[alias] = text.substring(
      1,
      text.lastIndexOf('"'),
    );
  }
  protected _insertionClause = (): string => {
    let sparql = '';
    let alias = idToAlias[this.id];

    if (
      this.valuesUpdated[alias] !== this.valuesFromPod[alias] &&
      this.valuesUpdated[alias] !== this.nil
    ) {
      let backSlashEscaped: string = this.valuesUpdated[alias].replace(
        /\\/g,
        '\\\\',
      );
      let doubleQuoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
      sparql += `INSERT DATA { GRAPH <${this.graph}> { <${this.subject}> <${this.id}> "${doubleQuoteEscaped}"} };\n`;
    }
    return sparql;
  };
}

class JsonProperty extends TextProperty {
  protected nil = '{}';

  public set = (value: string) => {
    const json = JSON.parse(value);
    const alias = idToAlias[this.id];
    if (!_.isEqual(json, JSON.parse(this.valuesUpdated[alias]))) {
      this.valuesUpdated[alias] = value;
    }
  };
}

const Prop = {
  create: (
    id: string,
    graph: string,
    subject: string,
    valuesUpdated: any,
    valuesFromPod: any,
  ): Property => {
    const type = idToType[id];
    switch (type) {
      case 'NamedNode':
        return new NamedNodeProperty(
          id,
          graph,
          subject,
          valuesUpdated,
          valuesFromPod,
        );
      case 'Text':
        return new TextProperty(
          id,
          graph,
          subject,
          valuesUpdated,
          valuesFromPod,
        );
      case 'Json':
        return new JsonProperty(
          id,
          graph,
          subject,
          valuesUpdated,
          valuesFromPod,
        );
      default:
        throw new Error('Unknown property type: ' + type);
    }
  },

  // commit: (prop: Property) => {
  //   prop.commit();
  // },

  // undo: (prop: Property) => {
  //   prop.undo();
  // },

  getSparql: (sparql: string, prop: Property): string => {
    return sparql + prop.getSparqlForUpdate();
  },
};

export { Property, NamedNodeProperty, TextProperty, JsonProperty, Prop };
