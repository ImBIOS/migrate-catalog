export type CatalogMap = Record<string, string>;

export type CatalogsMap = Record<string, CatalogMap>;

export type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
};

export type WorkspaceData = {
  packages?: string[];
  catalog?: CatalogMap;
  catalogs?: CatalogsMap;
  [key: string]: unknown;
};


