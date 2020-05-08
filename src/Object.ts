import { ont } from '../config/ontology';

export type Literal = string | boolean | undefined;

export interface Object {
  value: Literal;
  type: string;
}

export const Object = {
  fromQuad(input: any): Object {
    const result: Object = {
      value: '',
      type: '',
    };

    if (input.termType === 'NamedNode') {
      result.type = ont.xsd.anyURI;
      result.value = input.id;
    } else if (input.id.endsWith('"')) {
      result.type = 'string';
      result.value = input.id.substring(1, input.id.lastIndexOf('"'));
    } else if (input.id.endsWith('boolean')) {
      result.type = 'boolean';
      result.value = input.id.startsWith('"true"');
    }
    // TODO: more types

    return result;
  },

  fromValue(predRange: string, value: Literal): Object {
    const obj: Object = {
      value: value,
      type: '',
    };

    switch (typeof value) {
      case 'string':
        if (predRange !== ont.xsd.anyURI && predRange !== ont.xsd.string) {
          throw new Error('Object typeof string, predicate range ' + predRange);
        }
        obj.type = predRange;
        break;
      case 'boolean':
        obj.type = ont.xsd.boolean;
        break;
      case 'undefined':
        obj.type = ont.xsd.anyURI;
        break;
      // TODO: more types
    }

    return obj;
  },

  // TODO: extract from Predicate
  toSparql(obj: Object): string {
    switch (obj.type) {
      case ont.xsd.anyURI:
        return `<${obj.value}>`;
      case ont.xsd.boolean:
        return `"${obj.value}"^^${ont.xsd.boolean}`;
      default:
        // xsd:string case
        const backSlashEscaped: string = (<string>obj.value).replace(
          /\\/g,
          '\\\\',
        );
        const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
        return `"${quoteEscaped}"`;
    }
  },
};
