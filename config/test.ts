import { ont } from './ontology'

export const config: any = {
  page: {
    uri: 'http://example.org/alice',
  },
  para: [{}, {}, {}],
  text: [
    {}, {}, {},
    {}, {}, {},
    {}, {}, {},
  ],
}

for (let i = 0; i < 9; i++) {
  config.text[i].id = 't' + i
  config.text[i].uri = config.page.uri + '#' + config.text[i].id
  config.text[i].type = ont.sdoc.leaf
  config.text[i].json = {
    id: config.text[i].uri,
    type: ont.sdoc.leaf,
    text: 'text ' + i,
    bold: true
  }
}

for (let i = 0; i < 3; i++) {
  config.para[i].id = 'p' + i
  config.para[i].uri = config.page.uri + '#' + config.para[i].id
  config.para[i].type = ont.sdoc.paragraph
  config.para[i].json = {
    id: config.para[i].uri,
    type: ont.sdoc.paragraph,
    children: [
      config.text[i * 3],
      config.text[i * 3 + 1],
      config.text[i * 3 + 2],
    ]
  }
}

config.page = {
  ...config.page,
  id: config.page.uri,
  type: ont.sdoc.root,
  json: {
    id: config.page.uri,
    type: ont.sdoc.root,
    title: 'Homepage',
    children: [
      config.para[0],
      config.para[1],
      config.para[2],
    ]
  }
}

config.page.turtle = `<${config.page.uri}> a <${ont.sdoc.root}>;
  <${ont.dct.title}> "${config.page.json.title}";
  <${ont.sdoc.firstChild}> <${config.para[0].uri}>.`

config.para[0].turtle = `<${config.para[0].uri}> a <${ont.sdoc.paragraph}>;
  <${ont.sdoc.next}> <${config.para[1].uri}>;
  <${ont.sdoc.firstChild}> <${config.text[0].uri}>.`

config.para[1].turtle = `<${config.para[1].uri}> a <${ont.sdoc.paragraph}>;
  <${ont.sdoc.next}> <${config.para[2].uri}>;
  <${ont.sdoc.firstChild}> <${config.text[3].uri}>.`

config.para[2].turtle = `<${config.para[2].uri}> a <${ont.sdoc.paragraph}>;
  <${ont.sdoc.firstChild}> <${config.text[6].uri}>.`

for (let i = 0; i < 8; i++) {
  config.text[i].turtle = `<${config.text[i].uri}> a <${ont.sdoc.leaf}>;`
  config.text[i].turtle += `  <${ont.sdoc.next}> <${config.text[i+1].uri}>;`
  config.text[i].turtle += `  <${ont.sdoc.text}> '${config.text[i].json.text}';`
  config.text[i].turtle += `  <${ont.sdoc.option}> '{"bold":true}'.`
}

config.text[8].turtle = `<${config.text[8].uri}> a <${ont.sdoc.leaf}>;
  <${ont.sdoc.text}> '${config.text[8].json.text}';
  <${ont.sdoc.option}> '{"bold":true}'.`
