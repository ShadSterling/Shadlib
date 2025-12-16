// @ts-check
/*  eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/no-magic-numbers,import/no-extraneous-dependencies,import/order,tslint/config  */  //   TODO: eslint has a bug that requires "/*.../*" comments for per-file rule disabling
//   - eslint rule names do not follow my naming conventions                           //  TODO: @typescript-eslint/naming-convention needs a way to specify different convention for calls to an imported library
//   - magic numbers are ok in style rules
//   - eslint handles dependencies independently of package.json
//   - imports here are grouped by core then plugins, and sorted by the imported name  //  TODO: import/order needs a way to specify alternate conventions for grouping and sorting
//   - alignment is more important than not having "extra" spaces                      //  TODO: replace tslint/config:import-spacing with a similar rule that expects alignment

import { default as eslintJs         } from "@eslint/js";         //  only exports default and module.exports
import { default as eslintConfig     } from "eslint/config";      //  default is optimized *
import     *     as eslintCompat       from "@eslint/compat";     //  has no default export
import { default as eslintTypescript } from "typescript-eslint";  //  default is optimized *

import { default as eslintPlugin__stylistic  } from "@stylistic/eslint-plugin";                 //  only exports default and module.exports
import { default as eslintPlugin_import      } from "eslint-plugin-import";                     //  default is optimized *
import { default as eslintPlugin_jsdoc       } from "eslint-plugin-jsdoc" ;                     //  default is the one that works 🤷
import { default as eslintPlugin_noNull      } from "eslint-plugin-no-null";                    //  only exports default and module.exports
import { default as eslintPlugin_preferArrow } from "eslint-plugin-prefer-arrow";               //  only exports default and module.exports
import { default as eslintPlugin_prettier    } from "eslint-plugin-prettier";                   //  only exports default and module.exports
import { default as eslintPlugin_tslint      } from "@typescript-eslint/eslint-plugin-tslint";  //  default is optimized *
import { default as eslintPlugin_typescript  } from "@typescript-eslint/eslint-plugin";         //  only exports default and module.exports
import { default as eslintPlugin_unicorn     } from "eslint-plugin-unicorn";                    //  default is optimized *

// import * as check_keys from "@typescript-eslint/eslint-plugin";
// console.log( Object.keys( check_keys ) );
// console.log( Object.keys( check_keys["default"] ) );
// console.log( Object.keys( check_keys["module.exports"] ) );
// console.log( Object.keys( check_keys["default"]["configs"] ) );
// console.log( Object.keys( check_keys["default"]["rules"] ) );


export default eslintConfig.defineConfig(  //  eslint-disable-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,import/no-default-export  --  Apparently eslint mistakes this import for "an `error` typed value";; Default export is required by eslint
	eslintConfig.globalIgnores( [ ".git", ".nyc_output", ".vscode", "build", "coverage", "doc", "node_modules", "reports", "secrets", ] ),  //  eslint-disable-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
	{
		"languageOptions": { parserOptions: { projectService: { allowDefaultProject: [ "*.{tsx,d.ts,mts,cts,ts,jsx,cjs,mjs,js}", ], }, }, },
		"files":           [ "**/*.{tsx,d.ts,mts,cts,ts,jsx,mjs,cjs,js}", ],  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
		"plugins":         {
			"@stylistic":         eslintPlugin__stylistic,
			"@typescript-eslint": eslintPlugin_typescript,   //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  Apparently eslint mistakes this import for "an error typed value"
			"import":             eslintCompat.fixupPluginRules(eslintPlugin_import),  //  eslint-disable-line @typescript-eslint/no-unsafe-argument  --  Apparently eslint mistakes this import as "of type error"
			"jsdoc":              eslintPlugin_jsdoc,
			"no-null":            eslintPlugin_noNull,       //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  Apparently eslint mistakes this import for "an error typed value"
			"prefer-arrow":       eslintPlugin_preferArrow,  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  Apparently eslint mistakes this import for "an error typed value"
			"prettier":           eslintPlugin_prettier,     //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  Apparently eslint mistakes this import for "an error typed value"
			"tslint":             eslintPlugin_tslint,       //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  Apparently eslint mistakes this import for "an error typed value"
			"unicorn":            eslintPlugin_unicorn,
		},
		"extends":         [                                                  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
			eslintJs.configs.recommended,                                      //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintTypescript.configs.eslintRecommended,
			eslintTypescript.configs.strictTypeChecked,
			eslintTypescript.configs.stylisticTypeChecked,
			eslintPlugin_typescript.configs["flat/eslint-recommended"],        //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintPlugin_typescript.configs["flat/recommended"],               //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintPlugin_typescript.configs["flat/recommended-type-checked"],  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintPlugin_typescript.configs["flat/strict"],                    //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintPlugin_typescript.configs["flat/strict-type-checked"],       //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintPlugin_typescript.configs["flat/stylistic"],                 //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			eslintPlugin_typescript.configs["flat/stylistic-type-checked"],    //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  Apparently eslint mistakes this import for "an `error` typed value"
			"jsdoc/recommended",
		],
		"rules":           {
			"@stylistic/comma-dangle":                                   [ "off",   "always" ],  //  Replaces comma-dangle //  TODO: enable and fix violations
			"@stylistic/indent":                                         [ "error", "tab" ],            //  Partially replaces @typescript-eslint/indent
			"@stylistic/indent-binary-ops":                              [ "error", "tab" ],            //  Partially replaces @typescript-eslint/indent  //  TODO: align operands
			"@stylistic/jsx-indent-props":                               [ "error", "tab" ],            //  Partially replaces @typescript-eslint/indent
			"@stylistic/jsx-quotes":                                     [ "error", "prefer-double" ],  //  Partially replaces @typescript-eslint/quotes
			"@stylistic/member-delimiter-style":                         [ "error", {                   //  Replaces @typescript-eslint/member-delimiter-style
				multiline:  { delimiter: "semi", requireLast: true,  },
				singleline: { delimiter: "semi", requireLast: false, },
			}, ],
			"@stylistic/no-mixed-spaces-and-tabs":                       [ "error", "smart-tabs", ],    //  Partially replaces @typescript-eslint/indent
			"@stylistic/quotes":                                         [ "off",   "backtick", { allowTemplateLiterals: "always", avoidEscape: true, }, ],  //  TODO: switch this to "error", set options  //  Partially replaces @typescript-eslint/quotes  //  TODO: check handling of `declare module `, @typescript-eslint/quotes inappropriately prohibited backticks
			"@stylistic/semi":                                           [ "error", "always", { omitLastInOneLineBlock: false, omitLastInOneLineClassBody: true, } ],  //  Replaces @typescript-eslint/semi
			"@typescript-eslint/adjacent-overload-signatures":           [ "error", ],
			"@typescript-eslint/array-type":                             [ "error", { "default": "array" } ],
			"@typescript-eslint/await-thenable":                         [ "error", ],
			"@typescript-eslint/consistent-type-assertions":             [ "error", { assertionStyle: "as", objectLiteralTypeAssertions: "never", arrayLiteralTypeAssertions: "never", }, ],  //  eslint-disable-line max-len,sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations; TODO: too many TODOs!  //  TODO: @typescript-eslint/consistent-type-assertions needs an update to handle initializer workarounds for missing rest args with default generic type, like args_or_default: T[] = rest_args.length > 0 ? rest_args : [ default, values, of, default, T, type ] as T[]
			"@typescript-eslint/consistent-type-definitions":            [ "error", "type" ],  //  "type" is better because it can be used for all type declaration and it can't have surprise merges with imported types; see https://typescript-eslint.io/rules/consistent-type-definitions/#what-are-the-differences-between-interface-and-type
			"@typescript-eslint/dot-notation":                           [ "error", {   //  TODO: option to allow keywords by name, maybe per type, e.g. anArray.delete, aPromise.catch, aSet.delete, ...
				allowIndexSignaturePropertyAccess: false,
				allowKeywords:                     false,
				allowPrivateClassPropertyAccess:   false,
				allowProtectedClassPropertyAccess: false,
			}, ],
			"@typescript-eslint/explicit-function-return-type":          [ "off",   ],  //  Partially replaces @typescript-eslint/typedef  //  TODO: switch this to "error", set options - https://typescript-eslint.io/rules/explicit-function-return-type/
			"@typescript-eslint/explicit-member-accessibility":          [ "error", {
				accessibility: "explicit",
				overrides: {
					accessors:           "explicit",
					constructors:        "explicit",
					parameterProperties: "explicit",
				},
			}, ],
			"@typescript-eslint/explicit-module-boundary-types":         [ "off",   ],  //  Partially replaces @typescript-eslint/typedef  //  TODO: switch this to "error", set options - https://typescript-eslint.io/rules/explicit-module-boundary-types/
			"@typescript-eslint/member-ordering":                        [ "off",   {   //  Overlaps with sort-keys  //  TODO: switch this to "error", set options - https://typescript-eslint.io/rules/member-ordering/  //  TODO: options apply to type declarations, with option to require literals to match declarations (matchDeclarationOrder)  //  TODO: option to declare ordering per scope
				"default": {
					memberTypes: [  //  TODO: specify all types from https://typescript-eslint.io/rules/member-ordering/#default-configuration
						"signature",
						"public-static-field",
						"protected-static-field",
						"private-static-field",
						"public-static-method",
						"protected-static-method",
						"private-static-method",
						"public-instance-field",
						"protected-instance-field",
						"private-instance-field",
						"public-constructor",
						"protected-constructor",
						"private-constructor",
						"public-instance-method",
						"protected-instance-method",
						"private-instance-method"
					],
					order: "natural",
				}
			}, ],
			"@typescript-eslint/method-signature-style":                 [ "error", "property", ],  //  TODO: limit to classes and interfaces, exclude parameter lists
			"@typescript-eslint/naming-convention":                      [ "error",     //  TODO: needs a way to specify different convention for calls to an imported library  //  https://typescript-eslint.io/rules/naming-convention/
				{
					selector:           [ "class", "enum", "typeAlias", "typeParameter", ],
					format:             [ "PascalCase", ],                                   //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					leadingUnderscore:    "allow",
					trailingUnderscore:   "forbid",
				},
				{
					selector:             "interface",
					format:             [ "PascalCase", ],                                   //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					leadingUnderscore:    "forbid",
					prefix:             [ "I", ],
					trailingUnderscore:   "forbid",
				},
				{
					selector: [  //  TODO: missing option comparable to ban-keywords from tslint rule variable-name - https://palantir.github.io/tslint/rules/variable-name/
						"accessor",
						"classMethod",
						"classProperty",
						"objectLiteralMethod",
						"objectLiteralProperty",
						"typeMethod",
						"typeProperty",
						"variable",
					],
					format:             [ "camelCase", "snake_case", ],                      //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations  //  TODO: @typescript-eslint/naming-convention needs an option to require each scope to include only one format
					leadingUnderscore:    "allow",
					trailingUnderscore:   "forbid",
				},
				{
					selector:           [ "classProperty", ],
					modifiers:          [ "const", ],                                        //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					format:             [ "UPPER_CASE", ],                                   //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					leadingUnderscore:    "forbid",
					trailingUnderscore:   "forbid",
				},
				{
					selector:           [ "classProperty", ],
					modifiers:          [ "const", ],                                        //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					types:              [ "function" ],
					format:             [ "camelCase", "snake_case", ],                      //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations  //  TODO: @typescript-eslint/naming-convention needs an option to require each scope to include only one format
					leadingUnderscore:    "forbid",
					trailingUnderscore:   "forbid",
				},
				{
					selector:           [ "enumMember", ],
					format:             [ "UPPER_CASE", ],                                   //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					leadingUnderscore:    "allow",
					trailingUnderscore:   "forbid",
				},
				{
					selector:           [ "variable", ],
					modifiers:          [ "global", ],                                       //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					types:              [ "array", "boolean", "number", "string", ],
					format:             [ "UPPER_CASE", ],                                   //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					leadingUnderscore:    "forbid",
					trailingUnderscore:   "forbid",
				},
				{
					selector:           [ "variable", ],
					modifiers:          [ "global", ],                                       //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					types:              [ "function", ],
					format:             [ "camelCase", ],                                    //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
					leadingUnderscore:    "forbid",
					trailingUnderscore:   "forbid",
				},
			],
			"@typescript-eslint/no-confusing-void-expression":           [ "error", { ignoreArrowShorthand: true, ignoreVoidOperator: true, }, ],  //  TODO: this rule shouldn't catch explicit casts
			"@typescript-eslint/no-deprecated":                          [ "error", ],  //  Replaces deprecation/deprecation
			"@typescript-eslint/no-duplicate-type-constituents":         [ "error", ],  //  TODO: option to ignore explicitly unioning undefined with multiple other types in optional pramaters
			"@typescript-eslint/no-dynamic-delete":                      [ "error", ],
			"@typescript-eslint/no-empty-function":                      [ "error", ],
			"@typescript-eslint/no-empty-interface":                     [ "error", { allowSingleExtends: false }, ],
			"@typescript-eslint/no-empty-object-type":                   [ "error", ],
			"@typescript-eslint/no-explicit-any":                        [ "error", { ignoreRestArgs: false }, ],
			"@typescript-eslint/no-extraneous-class":                    [ "error", {
				allowConstructorOnly: false,
				allowEmpty:           false,
				allowStaticOnly:      false,
				allowWithDecorator:   false,
			}, ],
			"@typescript-eslint/no-floating-promises":                   [ "error", { checkThenables: true, ignoreIIFE: false, ignoreVoid: false, }, ],  //  TODO: fix false positives when .then is called with a rejection handler  //  TODO: configure to treat additional types as promises; include "Thenable", "Promislike", "Abortable", etc  //  TODO: exception for methods on promiseLikes that return themselves  //  TODO: exception for handlers that explicitly return PromiseLike.resolve(...)
			"@typescript-eslint/no-for-in-array":                        [ "error", ],
			"@typescript-eslint/no-inferrable-types":                    [ "error", { ignoreParameters: false, ignoreProperties: false, }, ],
			"@typescript-eslint/no-invalid-void-type":                   [ "error", { allowAsThisParameter: true, allowInGenericTypeArguments: true, }, ],  //  TODO: allow in union types which appear as return type of a function type  //  TODO: re allowInGenericTypeArguments, should that be never rather than void?
			"@typescript-eslint/no-magic-numbers":                       [ "error", {
				detectObjects:                 true,
				enforceConst:                  true,
				ignore:                        [0,1],
				ignoreArrayIndexes:            false,
				ignoreClassFieldInitialValues: false,
				ignoreDefaultValues:           false,
				ignoreEnums:                   false,
				ignoreNumericLiteralTypes:     false,
				ignoreReadonlyClassProperties: false,
				ignoreTypeIndexes:             false,
			} ],
			"@typescript-eslint/no-misused-new":                         [ "error", ],  //  TODO: needs option to allow new in classes
			"@typescript-eslint/no-misused-promises":                    [ "error", { checksConditionals: true, checksSpreads: true, checksVoidReturn: { arguments: true, attributes: true, properties: true, returns: true, variables: true, }, }, ],  //  TODO: configure to treat additional types as promises; include "Thenable", "Promislike", "Abortable", etc
			"@typescript-eslint/no-namespace":                           [ "error", { allowDeclarations: false, allowDefinitionFiles: true, }, ],
			"@typescript-eslint/no-non-null-assertion":                  [ "error", ],  //  TODO: this should be an option on non-nullable-type-assertion-style
			"@typescript-eslint/no-redundant-type-constituents":         [ "error", ],  //  TODO: allow unions with PromiseLike<vague>|vague for vague types like any and unknown  //  TODO: allow unions with any as placeholder for types not expressable until a future version of TypeScript
			"@typescript-eslint/no-require-imports":                     [ "error", ],
			"@typescript-eslint/no-restricted-types":                    [ "error", { types: { Object: "Use primitive (all-lowercase) object or {} instead", String: "Use primitive (all-lowercase) string or \"\" instead", } }, ],  //  eslint-disable-line id-denylist  --  using names of builtin classes to configure rule  //  Replaces @typescript-eslint/ban-types as of typescript-eslint v8
			"@typescript-eslint/no-shadow":                              [ "error", {
				allow:                  [],
				builtinGlobals:         true,
				hoist:                  "all",
				ignoreOnInitialization: false,
			} ],
			"@typescript-eslint/no-this-alias":                          [ "error", { allowDestructuring: false, allowedNames: [], }, ],
			"@typescript-eslint/no-unnecessary-boolean-literal-compare": [ "error", { allowComparingNullableBooleansToFalse: false, allowComparingNullableBooleansToTrue: false, }, ],
			"@typescript-eslint/no-unnecessary-condition":               [ "error", { checkTypePredicates: true } ],
			"@typescript-eslint/no-unnecessary-qualifier":               [ "error", ],
			"@typescript-eslint/no-unnecessary-type-arguments":          [ "error", ],
			"@typescript-eslint/no-unnecessary-type-assertion":          [ "error", { typesToIgnore: [], }, ],
			"@typescript-eslint/no-unsafe-assignment":                   [ "error", ],
			"@typescript-eslint/no-unsafe-call":                         [ "error", ],
			"@typescript-eslint/no-unsafe-function-type":                [ "error", ],
			"@typescript-eslint/no-unsafe-member-access":                [ "error", ],  //  TODO: exceptions for e.g. isAny && isAny.prop
			"@typescript-eslint/no-unsafe-return":                       [ "error", ],  //  TODO: option to also prohibit Thenable<any> or a list of generic classes
			"@typescript-eslint/no-unused-expressions":                  [ "error", { allowShortCircuit: true } ],
			"@typescript-eslint/no-unused-vars":                         [ "error", {
				vars:                           "all",
				varsIgnorePattern:              "^unused_",
				args:                           "all",       //  eslint-disable-line sort-keys  --  TODO: sort-keys needs an option to require literals to match declarations
				argsIgnorePattern:              "^_",
				caughtErrors:                   "all",
				caughtErrorsIgnorePattern:      "^unused_",
				destructuredArrayIgnorePattern: "^_",
				ignoreRestSiblings:             false,
			}, ],
			"@typescript-eslint/no-use-before-define":                   [ "off",   {   // TODO: option to apply only within method/function scope
				allowNamedExports:    false,
				classes:              true,
				enums:                true,
				functions:            true,
				ignoreTypeReferences: false,
				typedefs:             true,
				variables:            true,
			} ],
			"@typescript-eslint/no-var-requires":                        [ "error", ],
			"@typescript-eslint/no-wrapper-object-types":                [ "error", ],
			"@typescript-eslint/non-nullable-type-assertion-style":      [ "off",   ],  //  Choosing no-non-null-assertion instead  //  TODO: add an option that switches this rather the replacing it with no-non-null-assertion
			"@typescript-eslint/only-throw-error":                       [ "error", { allowRethrowing: false, allowThrowingAny: false, allowThrowingUnknown: false, }, ],  //  previously known as @typescript-eslint/no-throw-literal
			"@typescript-eslint/parameter-properties":                   [ "error", {
				allow: [ "readonly", "private", "protected", "public", "private readonly", "protected readonly", "public readonly" ],
				prefer: "parameter-property",
			}, ],
			"@typescript-eslint/prefer-for-of":                          [ "error", ],
			"@typescript-eslint/prefer-function-type":                   [ "error", ],
			"@typescript-eslint/prefer-namespace-keyword":               [ "error", ],
			"@typescript-eslint/prefer-readonly":                        [ "error", { onlyInlineLambdas: false, }, ],
			"@typescript-eslint/promise-function-async":                 [ "error", ],
			"@typescript-eslint/require-await":                          [ "error", ],
			"@typescript-eslint/restrict-plus-operands":                 [ "error", { allowAny: false, skipCompoundAssignments: false, }, ],
			"@typescript-eslint/restrict-template-expressions":          [ "error", { allowAny: false, allowNullish: false, allowNumber: true, allowRegExp: false,  }, ],  //  TODO: Should allowNumber be false?  Ideally integers would be allowed but floats would need to be formatted
			"@typescript-eslint/strict-boolean-expressions":             [ "error", {
				allowAny:             false,
				allowNullableBoolean: false,
				allowNullableNumber:  false,
				allowNullableObject:  true,
				allowNullableString:  false,
				allowNumber:          false,
				allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
				allowString:          false,
			}, ],
			"@typescript-eslint/triple-slash-reference":                 [ "error", { lib: "never", path: "never", types: "never", }, ],
			"@typescript-eslint/type-annotation-spacing":                [ "off",   ],  //  TODO: use formatter to require alignment of consecutive lines
			"@typescript-eslint/typedef":                                [ "off",   ],  //  Partally replaced by explicit-function-return-type, and explicit-module-boundary-types
			"@typescript-eslint/unbound-method":                         [ "error", { ignoreStatic: false, }, ],  //  TODO: missing options comparable to allow-delete, allow-typeof and whitelist from tslint rule no-unbound-method - https://palantir.github.io/tslint/rules/no-unbound-method/
			"@typescript-eslint/unified-signatures":                     [ "error", { ignoreDifferentlyNamedParameters: false, }, ],
			"@typescript-eslint/use-unknown-in-catch-callback-variable": [ "off",   ],  //  TODO: make this rule work with useUnknownInCatchVariables in compilerOptions
			"import/extensions":                                         [ "error", "never", { js:  "ignorePackages", jsx: "ignorePackages", ts:  "ignorePackages", tsx: "never", }, ],
			"import/no-default-export":                                  [ "error", ],  //  TODO: allow default export when defining types separate from implementation
			"import/no-deprecated":                                      [ "error", ],
			"import/no-duplicates":                                      [ "error", { considerQueryString: false, }, ],
			"import/no-extraneous-dependencies":                         [ "error", {
				bundledDependencies:  false,
				devDependencies:      false,  //  TODO: set these to arrays of globs where these dep groups belongs - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md
				// includeInternal:      true,  //  TODO: why is this documented but invalid when run?
				// includeTypes:         true,  //  TODO: why is this documented but invalid when run?
				optionalDependencies: false,
				// packageDir:           undefined,  //  undefined is the default
				peerDependencies:     false,
			}, ],
			"import/no-internal-modules":                                [ "error", ],
			"import/no-unassigned-import":                               [ "error", { allow: [], }, ],
			"import/order":                                              [ "error", {  //  TODO: fix expected ordering when one is a prefix of another
				"alphabetize": {
					caseInsensitive: true,
					order: "asc",
					// orderImportKind: "asc",  //  TODO: why is this documented but invalid when run?
				},
				"groups": [ "builtin", "external", "parent", "sibling", "index", [ "internal", "unknown", "object", "type", ], ],
				"newlines-between": "always",
				"warnOnUnassignedImports": true,
			}, ],
			"jsdoc/check-alignment":                                     [ "error", ],  //  TODO: fully characterize with rules from https://github.com/gajus/eslint-plugin-jsdoc
			"jsdoc/check-indentation":                                   [ "error", ],
			"jsdoc/no-types":                                            [ "error", ],
			"jsdoc/no-undefined-types":                                  [ "off"    ],  //  TODO: switch this to "error", set options
			"jsdoc/require-jsdoc":                                       [ "off",   {   //  TODO: eslint crashes if this rule is enabled
				checkConstructors:       true,
				checkGetters:            true,
				checkSetters:            true,
				contexts:                [
					"any",  //  TODO: does this enable all contexts?
					"ArrowFunctionExpression",
					"Decorator",
					"ExportNamedDeclaration",
					"FunctionDeclaration",
					"FunctionExpression",
					"MethodDefinition",
					"Property",
					"PropertyDefinition",
					"TSDeclareFunction",
					"TSEnumDeclaration",
					"TSInterfaceDeclaration",
					"TSMethodSignature",
					"TSPropertySignature",
					"TSTypeAliasDeclaration",
					"VariableDeclaration",
				],
				enableFixer:             false,  //  Fixer only generates empty documentation blocks
				exemptEmptyConstructors: false,
				exemptEmptyFunctions:    false,
				minLineCount:            0,
				publicOnly:              false,
				require:                 {
					ArrowFunctionExpression: true,
					ClassDeclaration:        true,
					ClassExpression:         true,
					FunctionDeclaration:     true,
					FunctionExpression:      true,
					MethodDefinition:        true,
				},
			} ],
			"jsdoc/require-param":                                       [ "off"    ],  //  TODO: switch this to "error", set options
			"jsdoc/require-param-type":                                  [ "off"    ],  //  TODO: switch this to "error", set options
			"jsdoc/require-returns":                                     [ "off"    ],  //  TODO: switch this to "error", set options
			"jsdoc/require-returns-type":                                [ "off"    ],  //  TODO: switch this to "error", set options
			"jsdoc/tag-lines":                                           [ "off",   "any", {startLines: 1} ],  //  Replaces jsdoc/newline-after-description  //  TODO: only require blank line after block description if at least one of the block description and subsequenr peoperties have more than one line
			"no-null/no-null":                                           [ "error", ],  //  TODO: add support for typescript null type
			"prefer-arrow/prefer-arrow-functions":                       [ "error", { allowStandaloneDeclarations: true, classPropertiesAllowed: false, disallowPrototype: false, singleReturnOnly: false, }, ],  //  TODO: allow arrow functions with type parameters OR add notation to give type parameters to anonymous functions
			"prettier/prettier":                                         [ "off",   ],  //  TODO: eslint hangs forever if this is enabled  //  TODO: find a way to show which prettier rule is violated
			"tslint/config":                                             [ "error", {   //  Renamed from @typescript-eslint/tslint/config  //  TODO: replace with native eslint rules - https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/TSLINT_RULE_ALTERNATIVES.md
				rules: {
					"ban":                             [ true, "eval",
						{ name:   "$",        message: "please don't" },  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to use different orderings appropriate to specific contexts, such as sorting eslint rules so plugin rules go first
						{ name: [ "_", "*" ], message: "please don't" },  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to use different orderings appropriate to specific contexts, such as sorting eslint rules so plugin rules go first
					],
					"encoding":                        [ true,  ],  //  TODO: add/migrate tslint's encoding rule - https://palantir.github.io/tslint/rules/encoding/
					"import-spacing":                  [ true,  ],
					"match-default-export-name":       [ true,  ],  //  TODO: add/migrate tslint's match-default-export-name rule - https://palantir.github.io/tslint/rules/match-default-export-name/
					"no-inferred-empty-object-type":   [ true,  ],  //  TODO: add/migrate tslint's no-inferred-empty-object-type rule - https://palantir.github.io/tslint/rules/no-inferred-empty-object-type/
					"no-mergeable-namespace":          [ true,  ],  //  TODO: add/migrate tslint's no-mergeable-namespace rule - https://palantir.github.io/tslint/rules/no-mergeable-namespace/
					"no-unnecessary-callback-wrapper": [ true,  ],  //  TODO: add/migrate tslint's no-unnecessary-callback-wrapper rule AND fix false positives when unwrapping breaks type constraints - https://palantir.github.io/tslint/rules/no-unnecessary-callback-wrapper/
					"number-literal-format":           [ true,  ],  //  TODO: add/migrate tslint's number-literal-format rule - https://palantir.github.io/tslint/rules/number-literal-format/
					"prefer-conditional-expression":   [ false, ],  //  TODO: add/migrate tslint's prefer-conditional-expression rule AND add option to avoid requiring nested conditional expressions - https://palantir.github.io/tslint/rules/prefer-conditional-expression/
					"return-undefined":                [ true,  ],  //  TODO: add/migrate tslint's return-undefined rule - https://palantir.github.io/tslint/rules/return-undefined/
					"strict-type-predicates":          [ true,  ],  //  TODO: add/migrate tslint's strict-type-predicates rule - https://palantir.github.io/tslint/rules/strict-type-predicates/
					"switch-final-break":              [ true, "always", ],  //  TODO: add/migrate tslint's switch-final-break rule - https://palantir.github.io/tslint/rules/switch-final-break/
				},
			} ],
			"unicorn/prefer-switch":                                     [ "error", { minimumCases: 2 } ],
			"unicorn/prefer-ternary":                                    [ "off",   "only-single-line", ],  //  TODO: needs criteria to exclude if statements with explanatory comments and no assignments
			"arrow-body-style":                                          [ "error", "as-needed", { requireReturnForObjectLiteral: false }, ],  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to use different orderings appropriate to specific contexts, such as sorting eslint rules so plugin rules go first  //  TODO: arrow-body-style should allow void no-op arrow functions; match with no-void and/or void-only-side-effects
			"arrow-parens":                                              [ "error", "always" ],
			"brace-style":                                               [ "error", "1tbs", { allowSingleLine: true, }, ],  //  TODO: use 1tbs for multiline and stroustrup for singleline
			"capitalized-comments":                                      [ "off",   ],  //  TODO: require capitalization in explanatory and documentation comments, but not in commented-code
			"class-methods-use-this":                                    [ "error", { enforceForClassFields: true, exceptMethods: [], }, ],
			"comma-dangle":                                              [ "off",   "always", ],  //  Replaced by @stylistic/comma-dangle
			"complexity":                                                [ "error", { max: 20 } ],
			"constructor-super":                                         [ "error", ],
			"curly":                                                     [ "error", "all", ],
			"default-case":                                              [ "error", ],
			"dot-notation":                                              [ "off",   ],  //  Replaced by @typescript-eslint/dot-notation
			"eol-last":                                                  [ "error", ],
			"eqeqeq":                                                    [ "error", "smart" ],
			"guard-for-in":                                              [ "error", ],
			"id-denylist":                                               [ "error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined", "undefined" ],
			"id-match":                                                  [ "error", ],
			"indent":                                                    [ "off",   ],  //  Replaced by  @typescript-eslint/indent, which was replaced by multiple rules including @stylistic/indent
			"linebreak-style":                                           [ "error", "unix" ],
			"max-classes-per-file":                                      [ "error", { ignoreExpressions: true, max: 10 }, ],
			"max-len":                                                   [ "error", {
				code:                   500, // TODO: exclude tslint:disable-line comments, exclude TODO comments
				ignoreStrings:          false,
				ignoreTrailingComments: false, // TODO: exclude tslint:disable-line comments, exclude TODO comments
				ignoreUrls:             false,
			} ],
			"max-lines":                                                 [ "error", { max: 920, skipBlankLines: false, skipComments: false, }, ],
			"new-parens":                                                [ "error", "always" ],
			"newline-per-chained-call":                                  [ "error", { ignoreChainWithDepth: 2 }, ],
			"no-bitwise":                                                [ "error", ],
			"no-caller":                                                 [ "error", ],
			"no-cond-assign":                                            [ "error", "always", ],
			"no-console":                                                [ "error", ],  // [ "error", { "allow": [ "log", "warn", "error" ], }, ],
			"no-constant-condition":                                     [ "error", { checkLoops: true } ],
			"no-debugger":                                               [ "error", ],
			"no-duplicate-case":                                         [ "error", ],
			"no-duplicate-imports":                                      [ "error", { includeExports: true, }, ],
			"no-empty":                                                  [ "error", { allowEmptyCatch: false, }, ],
			"no-empty-function":                                         [ "off",   ],  //  Replaced by @typescript-eslint/no-empty-function
			"no-eval":                                                   [ "error", { allowIndirect: true, }, ],
			"no-extra-label":                                            [ "error", ],
			"no-fallthrough":                                            [ "error", { allowEmptyCase: true, }, ],
			"no-invalid-this":                                           [ "error", { capIsConstructor: true, }, ],
			"no-irregular-whitespace":                                   [ "error", { skipComments: true, skipRegExps: true, skipStrings: true, skipTemplates: true, } ],  //  "Irregular" means unicode space characters other than ordinary space and tab (no nonbreaking space, zero-width space, etc)
			"no-label-var":                                              [ "error", ],
			"no-labels":                                                 [ "error", ],
			"no-magic-numbers":                                          [ "off",   ],  //  Replaced by @typescript-eslint/no-magic-numbers
			"no-multiple-empty-lines":                                   [ "error", { max: 2, maxBOF: 0, maxEOF: 1, }, ],
			"no-new-wrappers":                                           [ "error", ],
			"no-param-reassign":                                         [ "error", { props: true, ignorePropertyModificationsFor: [], ignorePropertyModificationsForRegex: [], }, ],  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"
			"no-redeclare":                                              [ "error", { builtinGlobals: true, }, ],  //  TODO: add option to prohibit redeclaration of parameters as variables
			"no-restricted-globals":                                     [ "error",
				{ name: "eval", message: "Don't use eval, Use anonymous functions instead",                                        },  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"
				{ name: "$",    message: "Don't use jQuery in JavaScript that will be compiled, Use modern frameworks instead",    },  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"
				{ name: "_",    message: "Don't use Underscore in JavaScript that will be compiled, Use modern libraries instead", },  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"
			],
			"no-restricted-imports":                                     [ "error", { name: "rxjs", message: "Don't import all of rxjs, import specific components", }, { name: "core-js", message: "Don't import all of core-js, import specific components", }, ],  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"
			"no-restricted-properties":                                  [ "error", { property: "forEach", message: "Use a regular for loop instead.", }, ],  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"  //  TODO: exception for container types, e.g. Set
			"no-return-await":                                           [ "error", ],
			"no-sequences":                                              [ "error", ],
			"no-shadow":                                                 [ "off",   ],  //  Replaced by @typescript-eslint/no-shadow
			"no-sparse-arrays":                                          [ "error", ],
			"no-template-curly-in-string":                               [ "error", ],
			"no-throw-literal":                                          [ "off",   ],  //  Replaced by @typescript-eslint/only-throw-error
			"no-trailing-spaces":                                        [ "error", { ignoreComments: false, skipBlankLines: false, }, ],  //  TODO: missing options comparable to ignore-template-strings and ignore-jsdoc from tslint rule no-trailing-whitespace - https://palantir.github.io/tslint/rules/no-trailing-whitespace/
			"no-undef-init":                                             [ "error", ],
			"no-undefined":                                              [ "error", ],
			"no-underscore-dangle":                                      [ "off",   ],  //  Mostly replaced by @typescript-eslint/naming-convention
			"no-unsafe-finally":                                         [ "error", ],
			"no-unused-expressions":                                     [ "error", { allowShortCircuit: true, allowTaggedTemplates: false, allowTernary: true, enforceForJSX: true, }, ],  //  TODO: add option to apply to constructors, configureable for only listed or all but listed constructors
			"no-unused-labels":                                          [ "error", ],
			"no-unused-vars":                                            [ "off",   ],  //  Replaced by @typescript-eslint/no-unused-vars
			"no-use-before-define":                                      [ "off",   ],  //  Replaced by @typescript-eslint/no-use-before-define
			"no-useless-concat":                                         [ "error", ],
			"no-var":                                                    [ "error", ],
			"no-void":                                                   [ "error", ],  //  TODO: consider replacing with void-only-side-effects ... maybe after remembering why this came up - https://www.npmjs.com/package/eslint-plugin-void-only-side-effects
			"object-shorthand":                                          [ "error", "consistent-as-needed", ],
			"one-var":                                                   [ "error", "never", ],
			"padding-line-between-statements":                           [ "off",   { blankLine: "always", prev: "*", next: "return" } ],  //  eslint-disable-line sort-keys  --  TODO: sort-keys needs options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"  //  TODO: what's the right setting here?
			"prefer-const":                                              [ "error", { destructuring: "any", ignoreReadBeforeAssign: false, } ],
			"prefer-object-spread":                                      [ "error", ],
			"prefer-template":                                           [ "error", ],  //  TODO: missing option comparable to allow-single-concat from tslint rule prefer-template - https://palantir.github.io/tslint/rules/prefer-template/
			"quote-props":                                               [ "error", "consistent-as-needed", { keywords: true, numbers: true, unnecessary: true, }, ],  //  TODO: Replace with @stylistic/quote-props
			"quotes":                                                    [ "off",   "backtick", { allowTemplateLiterals: true, avoidEscape: false, }, ],  //  TODO: enable and fix violations  //  TODO: add support for JSX/TSX notation
			"radix":                                                     [ "error", ],
			"require-await":                                             [ "off",   ],  //  Replaced by @typescript-eslint/require-await
			"semi":                                                      [ "off",   ],  //  Replaced by @stylistic/semi
			"sort-keys":                                                 [ "error", "asc", { caseSensitive: false, natural: true, }, ],  //  eslint-disable-line max-len  --  TODO: too many TODOs!  //  Overlaps with @typescript-eslint/member-ordering  //  TODO: option to apply to type declarations  //  TODO: option to require literals to match declarations (matchDeclarationOrder)  //  TODO: options to accept some common orderings by concept rather than lexical (maybe limited to small numbers of keys), such as having "prev" followed by "next"  //  TODO: options to use different orderings appropriate to specific contexts, such as sorting eslint rules so plugin rules go first
			"space-before-function-paren":                               [ "error", { anonymous: "always", asyncArrow: "always", named: "never", }, ],  //  TODO: add options for method and constructor functions
			"space-in-parens":                                           [ "off",   "always", { exceptions: [ "empty", ], }, ],  //  TODO: switch to replacement within @stylistic  //  TODO: exception option for no spaces around single entry
			"spaced-comment":                                            [ "off",   ],  //  TODO: distinguish commented-code, explanatory comments, and documentation comments; require nospace for commented-code, doublespace before & after for explanatory comments, ...
			"use-isnan":                                                 [ "error", { enforceForIndexOf: true, enforceForSwitchCase: true, }, ],
			"valid-typeof":                                              [ "error", ],
			"yoda":                                                      [ "error", "always", { onlyEquality: true, }, ],  //  TODO: only applies to comparing a variable to a literal (not e.g. to a const)  //  TODO: Implement the rest of tslint's binary-expression-operand-order rule - https://palantir.github.io/tslint/rules/binary-expression-operand-order
		},
	},
);
