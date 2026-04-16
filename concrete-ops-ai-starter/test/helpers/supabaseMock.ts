import { vi } from "vitest";

type QueryResult = { data?: any; error?: { message: string } | null };

type TableModeConfig = {
  awaitResult?: QueryResult;
  singleResult?: QueryResult;
  maybeSingleResult?: QueryResult;
};

type TableConfig = {
  select?: TableModeConfig;
  insert?: TableModeConfig;
  update?: TableModeConfig;
};

type TableConfigs = Record<string, TableConfig>;

type StorageConfig = {
  uploadResult?: QueryResult;
  removeResult?: QueryResult;
};

class QueryBuilder {
  public mode: "select" | "insert" | "update" = "select";
  public calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(private readonly config: TableConfig = {}) {}

  select(...args: unknown[]) {
    this.calls.push({ method: "select", args });
    return this;
  }

  insert(...args: unknown[]) {
    this.mode = "insert";
    this.calls.push({ method: "insert", args });
    return this;
  }

  update(...args: unknown[]) {
    this.mode = "update";
    this.calls.push({ method: "update", args });
    return this;
  }

  eq(...args: unknown[]) {
    this.calls.push({ method: "eq", args });
    return this;
  }

  is(...args: unknown[]) {
    this.calls.push({ method: "is", args });
    return this;
  }

  in(...args: unknown[]) {
    this.calls.push({ method: "in", args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: "order", args });
    return this;
  }

  limit(...args: unknown[]) {
    this.calls.push({ method: "limit", args });
    return this;
  }

  single() {
    this.calls.push({ method: "single", args: [] });
    return Promise.resolve(this.modeConfig().singleResult ?? { data: null, error: null });
  }

  maybeSingle() {
    this.calls.push({ method: "maybeSingle", args: [] });
    return Promise.resolve(this.modeConfig().maybeSingleResult ?? { data: null, error: null });
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.modeConfig().awaitResult ?? { data: null, error: null }).then(onfulfilled, onrejected);
  }

  private modeConfig() {
    return this.config[this.mode] ?? {};
  }
}

export function createSupabaseMock(options?: {
  tables?: TableConfigs;
  authUserResult?: { data: { user: { id: string } | null }; error: { message: string } | null };
  storage?: StorageConfig;
}) {
  const tables = options?.tables ?? {};
  const builders: Record<string, QueryBuilder[]> = {};
  const storageUpload = vi.fn(async (..._args: unknown[]) => options?.storage?.uploadResult ?? { error: null });
  const storageRemove = vi.fn(async (..._args: unknown[]) => options?.storage?.removeResult ?? { error: null });

  const client = {
    auth: {
      getUser: vi.fn(async () => options?.authUserResult ?? { data: { user: { id: "auth-user-1" } }, error: null }),
    },
    storage: {
      from: vi.fn((_bucket: string) => ({
        upload: storageUpload,
        remove: storageRemove,
      })),
    },
    from: vi.fn((table: string) => {
      const builder = new QueryBuilder(tables[table]);
      builders[table] ??= [];
      builders[table].push(builder);
      return builder;
    }),
  };

  return {
    client,
    builders,
    storageUpload,
    storageRemove,
  };
}

export function getLatestBuilder(builders: Record<string, QueryBuilder[]>, table: string) {
  const entries = builders[table] ?? [];
  const latest = entries.at(-1);
  if (!latest) {
    throw new Error(`No builder recorded for table ${table}`);
  }
  return latest;
}
