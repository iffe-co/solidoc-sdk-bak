import { ont } from '../config/ontology';

export type Literal = string | boolean | undefined;

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
    } else {
      // throw new Error('Unknown data type');
      // TODO: more types
    }

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
        return `"${obj.value}"^^${ont.xsd.boolean}`;
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
