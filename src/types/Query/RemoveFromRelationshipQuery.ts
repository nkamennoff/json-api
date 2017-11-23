import Query, { QueryOptions } from "./Query";
import { assertKeysTruthy } from "./utils";
import Linkage from '../Linkage';

export type RemoveFromRelationshipQueryOptions = QueryOptions & {
  id: string | number,
  relationshipName: string,
  linkage: Linkage
}

export default class RemoveFromRelationshipQuery extends Query {
  protected query: {
    readonly type: QueryOptions['type'];
    readonly returning: QueryOptions['returning'];
    readonly catch: QueryOptions['catch'];
    readonly id: RemoveFromRelationshipQueryOptions['id'];
    readonly relationshipName: RemoveFromRelationshipQueryOptions['relationshipName'];
    readonly linkage: RemoveFromRelationshipQueryOptions['linkage'];
  };

  constructor(opts: RemoveFromRelationshipQueryOptions) {
    const { id, relationshipName, linkage, ...baseOpts } = opts;
    super(baseOpts);
    assertKeysTruthy(["id", "relationshipName"], opts);

    this.query = {
      ...this.query,
      id: opts.id,
      relationshipName: opts.relationshipName,
      linkage: opts.linkage
    };
  }

  get id() {
    return this.query.id;
  }

  get relationshipName() {
    return this.query.relationshipName;
  }

  get linkage() {
    return this.query.linkage;
  }
}
