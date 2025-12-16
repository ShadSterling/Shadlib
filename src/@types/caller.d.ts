declare module "caller" {
	export function caller( depth?: number ): string;
	export default caller;  //  eslint-disable-line import/no-default-export  --  include default when describing types of libraries that don't publish their own types
}

// TODO: finish a template from https://www.typescriptlang.org/docs/handbook/declaration-files/templates.html
// TODO: submit to https://github.com/totherik/caller ... or just reroll my own since that might be unmaintained
