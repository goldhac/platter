// The contract. Every layer (RSC queries, server actions, rhf forms, CSV import)
// imports entity shapes from here — never redefines them (code-standards.md §2).

export * from "./common";
export * from "./restaurant";
export * from "./menu-group";
export * from "./category";
export * from "./item";
export * from "./variant";
export * from "./modifier";
