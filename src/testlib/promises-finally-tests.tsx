// Adapted from https://github.com/tc39/proposal-promise-finally/blob/master/test/test.js

/*  eslint-disable import/no-extraneous-dependencies,import/order  --  this is a test spec; TODO: import/order option to sort by imported name rather than import source name  */
/*  eslint-disable prefer-arrow/prefer-arrow-functions  --  TODO: does using arrow functions work with test framework?  */


import { describe } from "mocha";
import * as assert from "assert";

export type PromiseResolver<T> = ( value:  T | PromiseLike<T>  ) => void;
export type PromiseRejecter    = ( reason: any                 ) => void;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise  //  TODO: should this be imported from AsyncablePromise?
export type PromiseExecutor<T> = ( resolve: PromiseResolver<T>, reject: PromiseRejecter ) => void | undefined;  //  eslint-disable-line @typescript-eslint/no-invalid-void-type  --  TODO: this rule shouldn't complain that void is only valid as a return type when it's being used as a return type
export type PromiseCallbackFulfilled<T,TResult1> = ( (  value: T   ) => TResult1 | PromiseLike<TResult1> ) | null | undefined;
export type PromiseCallbackRejected<   TResult2> = ( ( reason: any ) => TResult2 | PromiseLike<TResult2> ) | null | undefined;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
export type PromiseCallbackFinally<  T         > = ( (        ) => T | PromiseLike<T> | undefined | void ) | null | undefined;  //  eslint-disable-line @typescript-eslint/no-invalid-void-type  --  TODO: this rule shouldn't complain that void is only valid as a return type when it's being used as a return type

export interface PromiseWithFinally<T> extends Promise<T> {  //  eslint-disable-line @typescript-eslint/naming-convention  --  No "I" prefix, follow common convention  //  TODO: Why is this an interface rather than a type?
	/** The same then as Promise.then */
	then: <TResult1 = T, TResult2 = never>(
		onfulfilled?: PromiseCallbackFulfilled<T,TResult1>,
		onrejected?: PromiseCallbackRejected<  TResult2>,
	) => PromiseWithFinally< TResult1 | TResult2 >;
	/** The same then as Promise.catch */
	catch: < TResult2 = never >(
		onrejected?: PromiseCallbackRejected<  TResult2>,
	) => PromiseWithFinally< T | TResult2 >;
	/** The added finally method */
	finally: ( onfinally?: PromiseCallbackFinally<T>, ) => PromiseWithFinally<T>;
}

export type DeferredWithFinally<T=any> = {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
	/** Unresolved promise */
	promise: PromiseWithFinally<T>;
	/** Resolver for {@link promise} */
	resolve: (  value: T   ) => void;
	/** Rejecter for {@link promise} */
	reject:  ( reason: any ) => void;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
};

export type AdapterWithFinally = {
	/** Generate resolved promise */
	resolved?: <T=any>( value: T ) => PromiseWithFinally<T>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
	/** Generate rejected promise */
	rejected?: ( reason: any ) => PromiseWithFinally<never>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
	/** Generate deferred promise */
	deferred: <T=any>() => DeferredWithFinally<T>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
	/** Generate promise from given exec */
	fromexec: <T=any>( exec: PromiseExecutor<T> ) => PromiseWithFinally<T>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
};

export type NormalizedAdapterWithFinally = {
	/** Generate resolved promise */
	resolved: <T=any>(  value: T   ) => PromiseWithFinally<T>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
	/** Generate rejected promise */
	rejected: ( reason: any ) => PromiseWithFinally<never>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
	/** Generate deferred promise */
	deferred: <T=any>() => DeferredWithFinally<T>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
	/** Generate promise from given exec */
	fromexec: <T=any>( exec: PromiseExecutor<T> ) => PromiseWithFinally<T>;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
};

/**
 * Normalizes by adding default implementations of resolved and rejected
 * @param adapter The adapter to normalize
 */
export function normalizeAdapter(
	adapter: AdapterWithFinally,
): NormalizedAdapterWithFinally { // convert-in-place cast
	if( !adapter.resolved ) {
		adapter.resolved = async <T=any>( value: T ): Promise<T> => {  //  eslint-disable-line no-param-reassign,@typescript-eslint/no-explicit-any  --  this method is meant to edit adapter in-place; default to any so it works by default
			const d = adapter.deferred<T>();
			d.resolve( value );
			return d.promise;
		};
	}
	if( !adapter.rejected ) {
		adapter.rejected = async ( reason ): Promise<never> => {  //  eslint-disable-line no-param-reassign  --  this method is meant to edit adapter in-place
			const d = adapter.deferred<never>();
			d.reject(reason);
			return d.promise;
		};
	}
	return adapter as NormalizedAdapterWithFinally;
}

/** Run tests as Mocha tests */
export function mocha( _adapter: AdapterWithFinally ): void {

	const adapter = normalizeAdapter( _adapter );

	describe("onFinally", () => {

		const someRejectionReason = { message: "some rejection reason"    };
		const anotherReason       = { message: "another rejection reason" };
		const three    =    3; // don't use magic numbers, use constants
		const four     =    4; // don't use magic numbers, use constants
		const time100  =  100; // don't use magic numbers, use constants
		const time1000 = 1000; // don't use magic numbers, use constants
		const time1500 = 1500; // don't use magic numbers, use constants

		describe( "no callback", () => {
			specify( "from resolved", (done) => {
				adapter.resolved( three ).then( (x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally().then(  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation  --  TODO: newline-per-chained-call option to ignore chained calls with no (or simple) parameters; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					function onFulfilled(x) {
						assert.strictEqual(x, three);
						done();
					},
					function onRejected() {
						done(new Error("should not be called"));
					},
				);
			} );

			specify( "from rejected", (done) => {
				adapter.rejected(someRejectionReason).catch( (e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, someRejectionReason);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).finally().then(  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation  --  TODO: newline-per-chained-call option to ignore chained calls with no (or simple) parameters; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					function onFulfilled() {
						done(new Error("should not be called"));
					},
					function onRejected(reason) {
						assert.strictEqual(reason, someRejectionReason);
						done();
					},
				);
			} );
		} );

		describe( "throws an exception", () => {
			specify( "from resolved", (done) => {
				adapter.resolved(three).then( (x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert(0 === arguments.length);
					throw someRejectionReason;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { done( new Error("should not be called") ); },
					function onRejected(reason) { assert.strictEqual(reason, someRejectionReason); done(); },
				);
			} );

			specify( "from rejected", (done) => {
				adapter.rejected(anotherReason).finally( function onFinally() {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert(0 === arguments.length);
					throw someRejectionReason;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { done( new Error("should not be called") ); },
					function onRejected(reason) { assert.strictEqual(reason, someRejectionReason); done(); },
				);
			} );
		} );

		describe( "returns a non-promise", () => {
			specify( "from resolved", (done) => {
				// const p =
				adapter.resolved(three).then( (x) => {
					assert.strictEqual(x, three);
					// if( x !== three ) { done( new Error( `resolved to wrong value ${x} ≠ ${three}` ) ); }
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert(0 === arguments.length);
					// if( arguments.length !== 0 ) { done( new Error( `onFinally received ${arguments.length} > 0 arguments` ) ); }
					return four;
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled(x) {
						assert.strictEqual(x, three);
						// if( x !== three ) { done( new Error( `finally did not pass value through` ) ); }
						done();
					},
					function onRejected() {
						done( new Error("should not be called") );
					},
				);
				// console.log( `"returns a non-promise" / "from resolved" ⇒ ${p}` );
			} );

			specify( "from rejected", (done) => {
				adapter.rejected(anotherReason).catch( (e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, anotherReason);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make anotherReason an Error instance
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert(0 === arguments.length);
					throw someRejectionReason;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { done( new Error("should not be called") ); },
					function onRejected(e) { assert.strictEqual(e, someRejectionReason); done(); },
				);
			} );
		} );

		describe( "returns a pending-forever promise", () => {
			specify( "from resolved", (done) => {
				let timeout: NodeJS.Timer;
				adapter.resolved(three).then( (x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					timeout = setTimeout(done, time100);
					return adapter.fromexec<never>(() => undefined);  //  eslint-disable-line no-undefined  --  exec function that never calls either callback means the promise never resolves or rejects  //  TODO: Isn't there a set of exec functions defined somewhere?  This test should use that
				} ).then( function onFulfilled(/*x*/) {  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					clearTimeout(timeout);
					done(new Error("should not be called"));
				}, function onRejected() {
					clearTimeout(timeout);
					done(new Error("should not be called"));
				} );
			} );

			specify( "from rejected", (done) => {
				let timeout: NodeJS.Timer;
				adapter.rejected(someRejectionReason).catch( (e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, someRejectionReason);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					timeout = setTimeout(done, time100);
					return adapter.fromexec<never>(() => undefined);  //  eslint-disable-line no-undefined  --  exec function that never calls either callback means the promise never resolves or rejects  //  TODO: Isn't there a set of exec functions defined somewhere?  This test should use that
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled(/*x*/) {
						clearTimeout(timeout);
						done(new Error("should not be called"));
					},
					function onRejected() {
						clearTimeout(timeout);
						done(new Error("should not be called"));
					},
				);
			} );
		} );

		describe( "returns an immediately-fulfilled promise", () => {
			specify( "from resolved", (done) => {
				adapter.resolved(three).then( (x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					return adapter.resolved(four);
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled(x) { assert.strictEqual(x, three); done(); },
					function onRejected() { done( new Error("should not be called") ); },
				);
			} );

			specify( "from rejected", (done) => {
				adapter.rejected(someRejectionReason).catch( (e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, someRejectionReason);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					return adapter.resolved(four) as unknown as PromiseWithFinally<never>; // adapter.rejected returns a PromiseWithFinally<never>, so onFinally is a PromiseCallbackFinally<never>, and must return another PromiseWithFinally<never>
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { done( new Error("should not be called") ); },
					function onRejected(e) { assert.strictEqual(e, someRejectionReason); done(); },
				);
			} );
		} );

		describe( "returns an immediately-rejected promise", () => {
			specify( "from resolved", (done) => {
				adapter.resolved(three).then( (x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					return adapter.rejected(four);
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled(/*x*/) { done(new Error("should not be called")); },
					function onRejected(e) { assert.strictEqual(e, four); done(); },
				);
			} );

			specify( "from rejected", (done) => {
				const newReason = {};
				adapter.rejected(someRejectionReason).catch((e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, someRejectionReason);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					return adapter.rejected(newReason);
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled(/*x*/) { done(new Error("should not be called")); },
					function onRejected(e) { assert.strictEqual(e, newReason); done(); },
				);
			} );
		} );

		describe( "returns a fulfilled-after-a-second promise", () => {
			specify( "from resolved", (done) => {
				let timeout: NodeJS.Timer;
				adapter.resolved(three).then((x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					timeout = setTimeout(done, time1500);
					return adapter.fromexec<number>( (resolve) => {
						setTimeout( () => resolve(four), time1000 );
					} );
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled(x) {
						clearTimeout(timeout);
						assert.strictEqual(x, three);
						done();
					},
					function onRejected() {
						clearTimeout(timeout);
						done(new Error("should not be called"));
					},
				);
			} );

			specify( "from rejected", (done) => {
				let timeout: NodeJS.Timer;
				adapter.rejected(three).catch((e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, three);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make three an Error instance
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					timeout = setTimeout(done, time1500);
					return adapter.fromexec<number>( (resolve) => { setTimeout(() => resolve(four), time1000); } ) as unknown as PromiseWithFinally<never>; // adapter.rejected returns a PromiseWithFinally<never>, so onFinally is a PromiseCallbackFinally<never>, and must return another PromiseWithFinally<never>
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { clearTimeout(timeout); done( new Error("should not be called") ); },
					function onRejected(e) { clearTimeout(timeout); assert.strictEqual(e, three); done(); },
				);
			} );
		} );

		describe( "returns a rejected-after-a-second promise", () => {
			specify( "from resolved", (done) => {
				let timeout: NodeJS.Timer;
				adapter.resolved(three).then( (x) => {
					assert.strictEqual(x, three);
					return x;
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					timeout = setTimeout(done, time1500);
					return adapter.fromexec<number>((_resolve, reject) => { setTimeout(() => reject(four), time1000); } );
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { clearTimeout(timeout); done( new Error("should not be called") ); },
					function onRejected(e) { clearTimeout(timeout); assert.strictEqual(e, four); done(); },
				);
			} );

			specify( "from rejected", (done) => {
				let timeout: NodeJS.Timer;
				adapter.rejected(someRejectionReason).catch((e) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
					assert.strictEqual(e, someRejectionReason);
					throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: make someRejectionReason an Error instance
				} ).finally( function onFinally() {  //  eslint-disable-line newline-per-chained-call,@typescript-eslint/dot-notation,@typescript-eslint/promise-function-async  --  TODO: newline-per-chained-call option to accept newlines in blocks; TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property; not async because we need to use arguments keyword
					assert(0 === arguments.length);
					timeout = setTimeout(done, time1500);
					return adapter.fromexec<never>((_resolve, reject) => { setTimeout(() => reject(anotherReason), time1000); } );
				} ).then(  //  eslint-disable-line newline-per-chained-call  --  TODO: newline-per-chained-call option to accept newlines in blocks
					function onFulfilled() { clearTimeout(timeout); done(new Error("should not be called")); },
					function onRejected(e) { clearTimeout(timeout); assert.strictEqual(e, anotherReason); done(); },
				);
			} );
		} );

		specify( "has the correct property descriptor", () => {
			const descriptor = Object.getOwnPropertyDescriptor( adapter.deferred().constructor.prototype, "finally" );
			specify( "writable",     () => { assert.strictEqual( descriptor?.writable,     true  ); } );
			specify( "configurable", () => { assert.strictEqual( descriptor?.configurable, true  ); } );
			specify( "enumerable",   () => { assert.strictEqual( descriptor?.enumerable,   false ); } );
		} );

	} );

}
