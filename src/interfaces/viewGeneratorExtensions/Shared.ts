export type UnknownObject<T extends object> = {
	[P in keyof T]: unknown;
};
