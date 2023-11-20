
import { TFile, Vault, parseYaml } from 'obsidian';
import Ajv2020, { ErrorObject } from 'ajv/dist/2020';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import {unified} from 'unified';
import { Position } from 'unist';
import { Root } from 'mdast';
import { SchemaCacheManager } from 'src/SchemaCacheManager';

const ajv = new Ajv2020();

const compiler = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm);

export const getMDAST = async (vault: Vault, file: TFile): Promise<Root> => {
    const data = await vault.read(file);
    const ast = compiler.parse(data);
    if (ast.children.length > 0) {
        const firstNode = ast.children[0];
        if (firstNode && firstNode['type'] === 'yaml' && 'value' in firstNode) {
            const yaml = parseYaml(firstNode.value)
            firstNode['data'] = yaml
        }
    }
    return ast;
}

export const getPropertiesFromAst = (ast: Root) => {
    const firstNode = ast.children[0];
    if (firstNode && firstNode['type'] === 'yaml' && 'data' in firstNode) {
        return firstNode['data']
    }
    
    return null;
}

type JsonType = number | string | object | null;

export const getMarkdownSchemaFileNameFromAst = (path: string, ast: Root): string | null => {
    const props = getPropertiesFromAst(ast);
    if (props) {
        const fileName = (props as Record<string, JsonType>)['$schema'] as string;
        return fileName !== null ? [path,  fileName].join("/") : null;
    }
    return null;
}

export const getSchemasFromAst = async (schemaCache: SchemaCacheManager, ast: Root, schemasDirectory: string): Promise<object | null> => {
    const path = getMarkdownSchemaFileNameFromAst(schemasDirectory, ast)
    if (path) {
        return await schemaCache.getSchema(path)
    }
    return null;
}

export const validateFile = async (schemaCache: SchemaCacheManager, vault: Vault, file: TFile, schemasDirectory: string)=> {
    const ast = await getMDAST(vault, file);
    const schema = await getSchemasFromAst(schemaCache, ast, schemasDirectory);

    if (schema) {
        const validate = ajv.compile(schema);
        validate(ast);
        if (validate.errors) {
            return validationToErrorSummary(file, ast, validate.errors);
        }
    }

    return null;
};

export interface SchemaPathPartSelection {
    start: SchemaPathPartLocation,
    end: SchemaPathPartLocation,
}

export interface SchemaPathPartLocation {
    char: number,
    line: number,
}

export interface SchemaPathPart {
    schemaPathRef: string,
    location: SchemaPathPartSelection
}

export interface ErrorsSummary {
    file: TFile,
    errors: ErrorSummary[]
}

export interface ErrorSummary {
    errorDetails: ErrorObject,
    schemaPath: SchemaPathPart[]
}

const validationToErrorSummary = (file: TFile, ast: object, errors: ErrorObject[]): ErrorsSummary => {
    const errorSummaries: ErrorSummary[] = []
    for (const err of errors) {
        let currentNode = ast as Record<string, object | string> | Record<string, object | string>[];
        const schemaParts: SchemaPathPart[] = []
        const path = err.instancePath.split("/")
        path.remove('')
        for (const part of path) {
            if (currentNode instanceof Array) {
                currentNode = currentNode[+part]
            } else {
                const mdPosition = currentNode['position'] as Position;
                const schemaPart: SchemaPathPart = {
                    schemaPathRef: part,
                    location: {
                        start: {
                            char: mdPosition.start.column,
                            line: mdPosition.start.line,
                        },
                        end: {
                            char: mdPosition.end.column,
                            line: mdPosition.end.line,
                        }
                    }, 
                }
                schemaParts.push(schemaPart)
                currentNode = currentNode[part] as Record<string, object | string> | Record<string, object | string>[];
            }
        }
        errorSummaries.push({errorDetails: err, schemaPath: schemaParts})
    }

    return {
        file: file,
        errors: errorSummaries,
    }
}
