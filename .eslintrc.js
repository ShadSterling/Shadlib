module.exports = {
	"env": {
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:@typescript-eslint/strict",
		"plugin:jsdoc/recommended",
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"project": "tsconfig.json",
		"sourceType": "module"  //  This means treat all code as strict mode
	},
	"plugins": [
		"@typescript-eslint",
		"@typescript-eslint/tslint",
		"deprecation",
		"eslint-plugin-import",
		"eslint-plugin-jsdoc",
		"eslint-plugin-no-null",
		"eslint-plugin-prefer-arrow",
		"eslint-plugin-unicorn",
		"prettier",
	],
	"root": true,
	"rules": {
		"@typescript-eslint/adjacent-overload-signatures": "error",
		"@typescript-eslint/array-type": [
			"error",
			{
				"default": "array"
			}
		],
		"@typescript-eslint/await-thenable": "error",
		"@typescript-eslint/ban-types": [
			"error",
			{
				"types": {
					"Object": "Use primitive (all-lowercase) object or {} instead",
					"String": "Use primitive (all-lowercase) string or \"\" instead",
				}
			}
		],
		"@typescript-eslint/consistent-type-assertions": [
			"error",
			{
				"assertionStyle": "as",
				"objectLiteralTypeAssertions": "never",
			},
		],
		"@typescript-eslint/consistent-type-definitions": [ "warn", "interface" ],  //  TODO: allow type instead of interface when defining types separate from implementation
		"@typescript-eslint/dot-notation": [  //  TODO: option to allow keywords by name, maybe per type, e.g. anArray.delete, aPromise.catch, aSet.delete, ...
			"error",
			{
				allowKeywords: false,
				allowPattern: undefined,
				allowPrivateClassPropertyAccess: false,
				allowProtectedClassPropertyAccess: false,
				allowIndexSignaturePropertyAccess: false,
			},
		],
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-member-accessibility": [
			"error",
			{
				"accessibility": "explicit",
				"overrides": {
					"accessors": "explicit",
					"constructors": "explicit",
					"parameterProperties": "explicit"
				}
			}
		],
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/indent": [
			"error",
			"tab"
		],
		"@typescript-eslint/member-delimiter-style": [
			"error",
			{
				"multiline": {
					"delimiter": "semi",
					"requireLast": true
				},
				"singleline": {
					"delimiter": "semi",
					"requireLast": false
				}
			}
		],
		"@typescript-eslint/member-ordering": [  //  Overlaps with sort-keys  //  TODO: options apply to type declarations, with option to require literals to match declarations (matchDeclarationOrder)  //  TODO: option to declare ordering per scope
			"warn",
			{
				"default": {
					"memberTypes": [  //  TODO: specify all types from https://typescript-eslint.io/rules/member-ordering/#default-configuration
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
					"order": "natural",
				}
			},
		],
		"@typescript-eslint/method-signature-style": [ "error", "property", ],  //  TODO: limit to classes and interfaces, exclude parameter lists
		"@typescript-eslint/naming-convention": [  //  https://typescript-eslint.io/rules/naming-convention/
			"error",
			{
				"selector": [ "class", "enum", "typeAlias", "typeParameter", ],
				"format": ["PascalCase"],
				"leadingUnderscore": "allow",
				"trailingUnderscore": "forbid",
			},
			{
				"selector": "interface",
				"format": ["PascalCase"],
				"leadingUnderscore": "forbid",
				"prefix": ["I"],
				"trailingUnderscore": "forbid",
			},
			{
				"selector": [  //  TODO: missing option comparable to ban-keywords from tslint rule variable-name - https://palantir.github.io/tslint/rules/variable-name/
					"accessor",
					"classMethod",
					"classProperty",
					"objectLiteralMethod",
					"objectLiteralProperty",
					"typeMethod",
					"typeProperty",
					"variable",
				],
				"format": [  //  TODO: require each scope to include only one format
					"camelCase",
					"snake_case",
				],
				"leadingUnderscore": "allow",
				"trailingUnderscore": "forbid",
			},
			{
				"selector": [ "classProperty", ],
				"modifiers": [ "const", ],
				"format": [
					"UPPER_CASE",
				],
				"leadingUnderscore": "forbid",
				"trailingUnderscore": "forbid",
			},
			{
				"selector": [ "classProperty", ],
				"modifiers": [ "const", ],
				"types": [ "function" ],
				"format": [  //  TODO: require each scope to include only one format
					"camelCase",
					"snake_case",
				],
				"leadingUnderscore": "forbid",
				"trailingUnderscore": "forbid",
			},
			{
				"selector": [ "enumMember", ],
				"format": [
					"UPPER_CASE",
				],
				"leadingUnderscore": "allow",
				"trailingUnderscore": "forbid",
			},
		],
		"@typescript-eslint/no-confusing-void-expression": [ "error", { ignoreArrowShorthand: true, ignoreVoidOperator: true, }, ],
		"@typescript-eslint/no-dynamic-delete": "error",
		"@typescript-eslint/no-empty-function": "error",
		"@typescript-eslint/no-empty-interface": [ "error", { allowSingleExtends: false }, ],
		"@typescript-eslint/no-explicit-any": [ "error", { "ignoreRestArgs": false }, ],
		"@typescript-eslint/no-extraneous-class": [
			"error",
			{
				allowConstructorOnly: false,
				allowEmpty:           false,
				allowStaticOnly:      false,
				allowWithDecorator:   false,
			},
		],
		"@typescript-eslint/no-floating-promises": [ "error", { ignoreVoid: true, ignoreIIFE: false, }, ],  //  TODO: fix false positives when .then is called with a rejection handler  //  TODO: configure to treat additional types as promises; include "Thenable", "Promislike", "Abortable", etc  //  TODO: exception for methods on promiseLikes that return themselves  //  TODO: exception for handlers that explicitly return PromiseLike.resolve(...)
		"@typescript-eslint/no-for-in-array": "error",
		"@typescript-eslint/no-inferrable-types": [ "error", { ignoreParameters: false, ignoreProperties: false, }, ],
		"@typescript-eslint/no-invalid-void-type": [ "error", { allowInGenericTypeArguments: true, allowAsThisParameter: true, }, ],  //  TODO: allow in union types which appear as return type of a function type
		"@typescript-eslint/no-magic-numbers": [
			"error",
			{
				detectObjects: true,
				enforceConst: true,
				ignore: [0,1],
				ignoreArrayIndexes: false,
				ignoreClassFieldInitialValues: false,
				ignoreDefaultValues: false,
				ignoreEnums: false,
				ignoreNumericLiteralTypes: false,
				ignoreReadonlyClassProperties: false,
				ignoreTypeIndexes: false,
			}
		],
		"@typescript-eslint/no-misused-new": "error",  //  TODO: needs option to allow new in classes
		"@typescript-eslint/no-misused-promises": [ "error", { checksConditionals: true, checksVoidReturn: { arguments: true, attributes: true, properties: true, returns: true, variables: true, }, checksSpreads: true, }, ],  //  TODO: configure to treat additional types as promises; include "Thenable", "Promislike", "Abortable", etc
		"@typescript-eslint/no-namespace": [ "error", { allowDeclarations: false, allowDefinitionFiles: true, }, ],
		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/no-unsafe-member-access": "error",  //  TODO: exceptions for e.g. isAny && isAny.prop
		"@typescript-eslint/no-unused-vars": [
			"error",
			{
				vars: "all",
				varsIgnorePattern: "^unused_",
				args: "all",
				argsIgnorePattern: "^_",
				caughtErrors: "all",
				caughtErrorsIgnorePattern: "^unused_",
				destructuredArrayIgnorePattern: "^_",
				ignoreRestSiblings: false,
			},
		],
		"@typescript-eslint/parameter-properties": [
			"error",
			{
				allow: [ "readonly", "private", "protected", "public", "private readonly", "protected readonly", "public readonly" ],
				prefer: "parameter-property",
			},
		],
		"@typescript-eslint/no-require-imports": "error",
		"@typescript-eslint/no-shadow": [
			"error",
			{
				"builtinGlobals": true,
				"hoist": "all",
				"allow": [],
				"ignoreOnInitialization": false,
			}
		],
		"@typescript-eslint/no-this-alias": [ "error", { allowDestructuring: false, allowedNames: [], }, ],
		"@typescript-eslint/no-throw-literal": [ "error", { allowThrowingAny: false, allowThrowingUnknown: false, }, ],
		"@typescript-eslint/no-unnecessary-boolean-literal-compare": [
			"error",
			{
				allowComparingNullableBooleansToTrue: false,
				allowComparingNullableBooleansToFalse: false,
			},
		],
		"@typescript-eslint/no-unnecessary-qualifier": "error",
		"@typescript-eslint/no-unnecessary-type-arguments": "error",
		"@typescript-eslint/no-unnecessary-type-assertion": [ "error", { typesToIgnore: [], }, ],
		"@typescript-eslint/no-unused-expressions": [
			"error",
			{
				"allowShortCircuit": true
			}
		],
		"@typescript-eslint/no-use-before-define": [ // TODO: option to apply only within method/function scope
			"off",
			{
				allowNamedExports:    false,
				classes:              true,
				enums:                true,
				functions:            true,
				ignoreTypeReferences: false,
				typedefs:             true,
				variables:            true,
			}
		],
		"@typescript-eslint/no-var-requires": "error",
		"@typescript-eslint/prefer-for-of": "error",
		"@typescript-eslint/prefer-function-type": "error",
		"@typescript-eslint/prefer-namespace-keyword": "error",
		"@typescript-eslint/prefer-readonly": [ "error", { onlyInlineLambdas: false, }, ],
		"@typescript-eslint/promise-function-async": "error",
		"@typescript-eslint/quotes": [  //  TODO: missing option comparable to jsx-double from tslint rule quotemark - https://palantir.github.io/tslint/rules/quotemark/
			"warn",  //  TODO: fix handling of `declare module `, which prohibits backticks
			"backtick",
			{
				allowTemplateLiterals: true,
				avoidEscape:           true,
			},
		],
		"@typescript-eslint/require-await": "error",
		"@typescript-eslint/restrict-plus-operands": [ "error", { checkCompoundAssignments: true, allowAny: false, }, ],
		"@typescript-eslint/semi": [
			"error",
			"always",
			{
				// beforeStatementContinuationChars: "always",
				omitLastInOneLineBlock:           false,
			},
		],
		"@typescript-eslint/strict-boolean-expressions": [
			"error",
			{
				allowString: false,
				allowNumber: false,
				allowNullableObject: true,
				allowNullableBoolean: false,
				allowNullableString: false,
				allowNullableNumber: false,
				allowAny: false,
				allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
			},
		],
		"@typescript-eslint/triple-slash-reference": [
			"error",
			{
				"path":  "never",
				"types": "never",
				"lib":   "never",
			},
		],
		"@typescript-eslint/type-annotation-spacing": "off",  //  TODO: use formatter to require alignment of consecutive lines
		"@typescript-eslint/typedef": "off",
		"@typescript-eslint/unbound-method": [ "error", { ignoreStatic: false, }, ],  //  TODO: missing options comparable to allow-delete, allow-typeof and whitelist from tslint rule no-unbound-method - https://palantir.github.io/tslint/rules/no-unbound-method/
		"@typescript-eslint/unified-signatures": [ "error", { ignoreDifferentlyNamedParameters: false, }, ],
		"arrow-body-style": [ "error", "as-needed", { requireReturnForObjectLiteral: false }, ],  //  TODO: allow void no-op arrow functions; match with no-void and/or void-only-side-effects
		"arrow-parens": [
			"error",
			"always"
		],
		"brace-style": [  //  TODO: use 1tbs for multiline and stroustrup for singleline
			"error",
			"1tbs",
			{
				allowSingleLine: true,
			},
		],
		"capitalized-comments": "off",  //  TODO: distinguish commented-code, explanatory comments, and documentation comments; require capitalization in explanatory comments
		"class-methods-use-this": [ "error", { enforceForClassFields: true, exceptMethods: [], }, ],
		"comma-dangle": [ "error", "always-multiline", ],  //  TODO: option to require in multiline and allow in single-line
		"complexity": [
			"error",
			{
				"max": 20
			}
		],
		"constructor-super": "error",
		"curly": [ "error", "all", ],
		"default-case": "error",
		"deprecation/deprecation": "error",
		"dot-notation": "off",  //  Replaced by @typescript-eslint/dot-notation
		"eol-last": "error",
		"eqeqeq": [
			"error",
			"smart"
		],
		"guard-for-in": "error",
		"id-denylist": [
			"error",
			"any",
			"Number",
			"number",
			"String",
			"string",
			"Boolean",
			"boolean",
			"Undefined",
			"undefined"
		],
		"id-match": "error",
		"import/extensions": [
			"error",
			"never",
			{
			  "js":  "ignorePackages",
			  "jsx": "ignorePackages",
			  "ts":  "ignorePackages",
			  "tsx": "never",
			},
		],
		"import/no-default-export": "warn",  //  TODO: allow default export when defining types separate from implementation
		"import/no-deprecated": "error",
		"import/no-duplicates": [ "error", { "considerQueryString": false, }, ],
		"import/no-extraneous-dependencies": [
			"error",
			{
				devDependencies:      false,  //  TODO: set these to arrays of globs where these dep groups belongs - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md
				optionalDependencies: false,
				peerDependencies:     false,
				bundledDependencies:  false,
				// includeInternal:      true,  //  TODO: why is this documented but invalid when run?
				// includeTypes:         true,  //  TODO: why is this documented but invalid when run?
				packageDir:           undefined,
			},
		],
		"import/no-internal-modules": "error",
		"import/no-unassigned-import": [ "error", { allow: [], }, ],
		"import/order": [  //  TODO: fix expected ordering when one is a prefix of another
			"error",
			{
				alphabetize: {
					caseInsensitive: true,
					order: "asc",
					// orderImportKind: "asc",  //  TODO: why is this documented but invalid when run?
				},
				groups: [ "builtin", "external", "parent", "sibling", "index", [ "internal", "unknown", "object", "type", ], ],
				"newlines-between": "always",
				warnOnUnassignedImports: true,
			},
		],
		"indent": "off",
		"jsdoc/check-alignment": "error",  //  TODO: fully characterize with rules from https://github.com/gajus/eslint-plugin-jsdoc
		"jsdoc/check-indentation": "error",
		"jsdoc/newline-after-description": [ "error", "never" ],
		"jsdoc/no-types": "error",
		"jsdoc/require-jsdoc": [
			"warn",
			{
				"publicOnly": false,
				"require": {
					"ArrowFunctionExpression": true,
					"ClassDeclaration": true,
					"ClassExpression": true,
					"FunctionDeclaration": true,
					"FunctionExpression": true,
					"MethodDefinition": true,
				},
				"contexts":[
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
				"exemptEmptyConstructors": false,
				"exemptEmptyFunctions": false,
				"checkConstructors": true,
				"checkGetters": true,
				"checkSetters": true,
				"enableFixer": false,  //  Fixer only generates empty documentation blocks
				"minLineCount": 0,
			}
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"max-classes-per-file": [ "error", { "ignoreExpressions": true, "max": 10 }, ],
		"max-len": [
			"error",
			{
				"code": 500, // TODO: exclude tslint:disable-line comments, exclude TODO comments
				"ignoreUrls": false,
				"ignoreStrings": false,
				"ignoreTrailingComments": false, // TODO: exclude tslint:disable-line comments, exclude TODO comments
			}
		],
		"max-lines": [ "error", { "max": 920, "skipBlankLines": false, "skipComments": false, }, ],
		"new-parens": [ "error", "always" ],
		"newline-per-chained-call": [
			"error",
			{ "ignoreChainWithDepth": 2 },
		],
		"no-bitwise": "off",
		"no-caller": "error",
		"no-cond-assign": [ "error", "always", ],
		"no-console": [
			"error",
			// {
			//     "allow": [], //[ "log", "warn", "error" ],
			// },
		],
		"no-debugger": "error",
		"no-duplicate-case": "error",
		"no-duplicate-imports": [ "error", { "includeExports": true, }, ],
		"no-empty": [ "error", { "allowEmptyCatch": false, }, ],
		"no-empty-function": "off",
		"no-eval": [ "error", { "allowIndirect": true, }, ],
		"no-extra-label": "error",
		"no-fallthrough": [ "error", { allowEmptyCase: true, }, ],
		"no-invalid-this": [ "error", { capIsConstructor: true, }, ],
		"no-irregular-whitespace": [  //  "Irregular" means unicode space characters other than ordinary space and tab (no nonbreaking space, zero-width space, etc)
			"error",
			{
				skipStrings:   true,
				skipComments:  true,
				skipRegExps:   true,
				skipTemplates: true,
			}
		],
		"no-label-var": "error",
		"no-labels": "error",
		"no-magic-numbers": "off",  //  Replaced by @typescript-eslint/no-magic-numbers
		"no-multiple-empty-lines": [
			"error",
			{
				"max": 2,
				"maxBOF": 0,
				"maxEOF": 1,
			},
		],
		"no-new-wrappers": "error",
		"no-null/no-null": "error",  //  TODO: add support for typescript null type
		"no-param-reassign": [ "error", { props: true, ignorePropertyModificationsFor: [], ignorePropertyModificationsForRegex: [], }, ],
		"no-redeclare": [ "error", { "builtinGlobals": true, }, ],  //  TODO: add option to prohibit redeclaration of parameters as variables
		"no-restricted-globals": [
			"error",
			{
				"name": "eval",
				"message": "Don't use eval, Use anonymous functions instead",
			},
			{
				"name": "$",
				"message": "Don't use jQuery in JavaScript that will be compiled, Use modern frameworks instead",
			},
			{
				"name": "_",
				"message": "Don't use Underscore in JavaScript that will be compiled, Use modern libraries instead",
			},
		],
		"no-restricted-imports": [
			"error",
			{
				"name": "rxjs",
				"message": "Don't import all of rxjs, import specific components",
			},
			{
				"name": "core-js",
				"message": "Don't import all of core-js, import specific components",
			},
		],
		"no-restricted-properties": [
			"error",
			{
				"property": "forEach",  //  TODO: exception for container types, e.g. Set
				"message": "Use a regular for loop instead."
			}
		],
		"no-return-await": "error",
		"no-sequences": "error",
		"no-shadow": "off",  //  Replaced by @typescript-eslint/no-shadow
		"no-sparse-arrays": "error",
		"no-template-curly-in-string": "error",
		"no-throw-literal": "off",  //  Replaced by @typescript-eslint/no-throw-literal
		"no-trailing-spaces": [ "error", { skipBlankLines: false, ignoreComments: false, }, ],  //  TODO: missing options comparable to ignore-template-strings and ignore-jsdoc from tslint rule no-trailing-whitespace - https://palantir.github.io/tslint/rules/no-trailing-whitespace/
		"no-undef-init": "error",
		"no-undefined": "error",
		"no-underscore-dangle": "off",
		"no-unsafe-finally": "error",
		"no-unused-expressions": [ "error", { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: false, enforceForJSX: true, }, ],  //  TODO: add option to apply to constructors, configureable for only listed or all but listed constructors
		"no-unused-labels": "error",
		"no-unused-vars": "off",  //  Replaced by @typescript-eslint/no-unused-vars
		"no-use-before-define": "off",  //  Replaced by @typescript-eslint/no-use-before-define
		"no-useless-concat": "error",
		"no-var": "error",
		"no-void": "error",  //  TODO: consider replacing with void-only-side-effects ... maybe after remembering why this came up - https://www.npmjs.com/package/eslint-plugin-void-only-side-effects
		"object-shorthand": [ "error", "consistent-as-needed", ],
		"one-var": [
			"error",
			"never"
		],
		"padding-line-between-statements": [  //  TODO: what's the right setting here?
			"off",
			{
				"blankLine": "always",
				"prev": "*",
				"next": "return"
			}
		],
		"prefer-arrow/prefer-arrow-functions": [ "error", { allowStandaloneDeclarations: true, classPropertiesAllowed: false, disallowPrototype: false, singleReturnOnly: false, }, ],  //  TODO: allow arrow functions with type parameters OR add notation to give type parameters to anonymous functions
		"prefer-const": [
			"error",
			{
				destructuring:          "any",
				ignoreReadBeforeAssign: false,
			}
		],
		"prefer-object-spread": "error",
		"prefer-template": "error",  //  TODO: missing option comparable to allow-single-concat from tslint rule prefer-template - https://palantir.github.io/tslint/rules/prefer-template/
		"prettier/prettier": "warn",  //  TODO: find a way to show which prettier rule is violated
		"quote-props": [
			"error",
			"consistent-as-needed",
			{
				keywords:    true,
				numbers:     true,
				unnecessary: true,
			},
		],
		"quotes": [  //  TODO: add support for JSX/TSX notation
			"warn",
			"backtick",
			{
				avoidEscape:           false,
				allowTemplateLiterals: true,
			},
		],
		"radix": "error",
		"require-await": "off",  //  Replaced by @typescript-eslint/require-await
		"semi": "off", //  Replaced by @typescript-eslint/semi
		"sort-keys": [ "warn", "asc", { caseSensitive: false, minKeys: 2, natural: true, }, ],  //  Overlaps with @typescript-eslint/member-ordering  //  TODO: options apply to type declarations, with option to require literals to match declarations (matchDeclarationOrder)
		"space-before-function-paren": [  //  TODO: add options for method and constructor functions
			"error",
			{
				anonymous:  "always",
				named:      "never",
				asyncArrow: "always",
			},
		],
		"space-in-parens": [  //  TODO: exception option for no spaces around single entry
			"warn",
			"always",
			{ exceptions: [ "empty", ], },
		],
		"spaced-comment": "off",  //  TODO: distinguish commented-code, explanatory comments, and documentation comments; require nospace for commented-code, doublespace before & after for explanatory comments, ...
		"unicorn/prefer-switch": [
			"error",
			{
				"minimumCases": 2
			}
		],
		"unicorn/prefer-ternary": "off",
		"use-isnan": [ "error", { enforceForSwitchCase: true, enforceForIndexOf: true, }, ],
		"valid-typeof": "off",
		"yoda": [  //  TODO: only applies to comparing a variable to a literal (not e.g. to a const)  //  TODO: Implement the rest of tslint's binary-expression-operand-order rule - https://palantir.github.io/tslint/rules/binary-expression-operand-order
			"error",
			"always",
			{
				"onlyEquality": true,
			},
		],
		"@typescript-eslint/tslint/config": [  //  TODO: replace with native eslint rules - https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/TSLINT_RULE_ALTERNATIVES.md
			"error",
			{
				"rules": {
					"ban": [
						true,
						"eval",
						{
							"name": "$",
							"message": "please don't"
						},
						{
							"name": [
								"_",
								"*"
							],
							"message": "please don't"
						}
					],
					"encoding": true,  //  TODO: add/migrate tslint's encoding rule - https://palantir.github.io/tslint/rules/encoding/
					"import-spacing": true,
					"match-default-export-name": true,  //  TODO: add/migrate tslint's match-default-export-name rule - https://palantir.github.io/tslint/rules/match-default-export-name/
					"no-inferred-empty-object-type": true,  //  TODO: add/migrate tslint's no-inferred-empty-object-type rule - https://palantir.github.io/tslint/rules/no-inferred-empty-object-type/
					"no-mergeable-namespace": true,  //  TODO: add/migrate tslint's no-mergeable-namespace rule - https://palantir.github.io/tslint/rules/no-mergeable-namespace/
					"no-unnecessary-callback-wrapper": true,  //  TODO: add/migrate tslint's no-unnecessary-callback-wrapper rule AND fix false positives when unwrapping breaks type constraints - https://palantir.github.io/tslint/rules/no-unnecessary-callback-wrapper/
					"number-literal-format": true,  //  TODO: add/migrate tslint's number-literal-format rule - https://palantir.github.io/tslint/rules/number-literal-format/
					"prefer-conditional-expression": false,  //  TODO: add/migrate tslint's prefer-conditional-expression rule AND add option to avoid requiring nested conditional expressions - https://palantir.github.io/tslint/rules/prefer-conditional-expression/
					"return-undefined": true,  //  TODO: add/migrate tslint's return-undefined rule - https://palantir.github.io/tslint/rules/return-undefined/
					"strict-type-predicates": true,  //  TODO: add/migrate tslint's strict-type-predicates rule - https://palantir.github.io/tslint/rules/strict-type-predicates/
					"switch-final-break": [ true, "always", ]  //  TODO: add/migrate tslint's switch-final-break rule - https://palantir.github.io/tslint/rules/switch-final-break/
				}
			}
		]
	}
};
