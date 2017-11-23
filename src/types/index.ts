import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import Document from "./Document";

export type PrimaryData = Resource | Collection | null | Linkage;
export type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;

export type Sort = { field: string; direction: 'ASC' | 'DESC' };

export type Predicate = {
  operator: "and" | "or";
  value: (FieldConstraint | Predicate)[];
  field: undefined;
};

export type AndPredicate = Predicate & { operator: "and" };

export type FieldConstraint = ({
  operator: "eq" | 'neq' | 'ne'; // ne and neq are synonyms
  value: number | string | boolean
} | {
  operator: "in" | "nin";
  value: string[] | number[]
} | {
  operator: 'lt' | 'gt' | 'lte' | 'gte';
  value: string | number;
}/* | {
  operator: '$like'; // not supported in our mongo transform yet
  value: string;
}*/) & {
  field: string;
};

export const BinaryOpts = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte'];
export const UnaryOpts = ['and', 'or'];


// I'm gonna start introducing more intermediate representations
// so that Request and Response aren't so overloaded/constantly mutated.
// Response is different than HTTPResponse in that it contains details of the
// result that are salient for JSON:API, not structured in HTTP terms.
export type Result = {
  // headers should not include Content-Type,
  // which is assumed to be JSON:API.
  headers?: { [headerName: string]: string };
  ext?: string[];
  status?: number;
  document?: Document
}

export type HTTPResponse = {
  // Note: header names are all lowercase.
  headers: { [headerName: string]: string },
  status: number;
  body?: string;
}
