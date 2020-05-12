import { ont } from '../config/ontology';

export type Literal = string | boolean | object | undefined;

export interface Object {
  value: Literal;
  type: string;
}

export const Object = {
  getValue(obj: Object) {
    return obj.value;
  },

  fromQuad(input: any): Object {
    const result: Object = {
      value: '',
      type: '',
    };

    if (input.termType === 'NamedNode') {
      result.type = ont.xsd.anyURI;
      result.value = input.id;
    } else if (input.id.endsWith('"') || input.id.endsWith('string')) {
      result.type = ont.xsd.string;
      result.value = input.id.substring(1, input.id.lastIndexOf('"'));
    } else if (input.id.endsWith('boolean')) {
      result.type = ont.xsd.boolean;
      result.value = input.id.startsWith('"true"');
    } else if (input.id.endsWith('dateTime')) {
      result.type = ont.xsd.dateTime;
      let dtStr: string = input.id.substring(1, input.id.lastIndexOf('"'));
      result.value = new Date(dtStr);
    } else {
      throw new Error('Unknown data type');
    }
    // TODO: more types

    return result;
  },

  fromValue(predRange: string, value: Literal): Object {
    const result: Object = {
      value: value,
      type: '',
    };

    switch (typeof value) {
      case 'string':
        result.type = predRange === ont.xsd.anyURI ? predRange : ont.xsd.string;
        break;
      case 'boolean':
        result.type = ont.xsd.boolean;
        break;
      case 'undefined':
        result.type = ont.xsd.anyURI;
        break;
      case 'object':
        if (!(value instanceof Date)) {
          throw new Error('Input value is an object, but not a dateTime');
        }
        result.type = ont.xsd.dateTime;
      // TODO: more types
    }

    return result;
  },

  // TODO: extract from Predicate
  escape(obj: Object): string {
    switch (obj.type) {
      case ont.xsd.anyURI:
        return `<${obj.value}>`;
      case ont.xsd.boolean:
        return `"${obj.value}"^^<${ont.xsd.boolean}>`;
      case ont.xsd.dateTime:
        return `"${obj.value}"^^<${ont.xsd.dateTime}>`;
      default:
        // xsd:string
        const backSlashEscaped: string = (<string>obj.value).replace(
          /\\/g,
          '\\\\',
        );
        const quoteEscaped: string = backSlashEscaped.replace(/"/g, '\\"');
        return `"${quoteEscaped}"`;
    }
  },
};
