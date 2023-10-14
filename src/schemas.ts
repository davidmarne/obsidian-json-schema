import { Node, Literal, Yaml } from "mdast"
import { parseYaml } from "obsidian"

interface Properties {
    [k:string]: object
}

export const getYaml = (astNode: Literal) => {
    const content = astNode['value'] as string;
    return yamlToSchema(parseYaml(content));
}

export const nodeToSchema = (astNode: Node) => {
    const properties: Properties = {};

    if (astNode['type'] === 'yaml' && 'value' in astNode) {
        const content = (astNode as Yaml)['value'];
        properties['schema'] = yamlToSchema(parseYaml(content));
    } else {
        for (const [k, v] of Object.entries(astNode)) {
            if (k === 'children') {
                properties[k] = {
                    "type": "array",
                    "maxItems": v.length,
                    "items": v.map(nodeToSchema)
                }
            } else if (k === 'position') {
                // do nuthin, ignore
            } else if (k === 'yaml') {
                // do nuthin, ignore
            } else {
                // TODO: if yaml or json deserialize and schema that object
                properties[k] = {
                    "const": v,
                    "type": v === null ? 'null' : typeof v
                }
            }
        }
    }

    return {
        "type": "object",
        "title": `${astNode.type} node`,
        "properties": properties
    }
}

export const yamlToSchema = (obj: object) => {
    const properties: Properties = {};

    for (const [k, v] of Object.entries(obj)) {
        properties[k] = {
            "const": v,
            "type": typeof v
        }
    }

    return {
        "type": "object",
        "title": `frontmatter schema`,
        "properties": properties
    }
}
