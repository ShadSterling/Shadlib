import * as debugFactory from "debug";
const debug: debugFactory.IDebugger = debugFactory( "DeferredAsyncablePromise" );

import { DeferredWithFinally as Deferred } from "../../testlib/promises-finally-tests";
export { Deferred  };

import { AsyncablePromise, PromiseFulfiller, PromiseRejecter } from "./AsyncablePromise";

/** Rearranged construction interface needed by the [Promise test suite](https://github.com/promises-aplus/promises-tests) */
export class DeferredAsyncablePromise<T> implements Deferred<T> {

	/** Constructed {@link Asyncable} */
	public readonly promise: AsyncablePromise<T>;
	/** Resolver for {@link promise} */
	private readonly _resolver: PromiseFulfiller<T>; // assigned in executor for {@link promise}
	/** Rejecter for {@link promise} */
	private readonly _rejecter: PromiseRejecter; // assigned in executor for {@link promise}

	/** Instead of passing functions to an executor callback, return them */
	public constructor() {
		const _fn = `constructor`;
		debug( `${this.label(_fn)}: Invoked` );
		let maybe_resolver: PromiseFulfiller<T> | undefined;
		let maybe_rejecter: PromiseRejecter     | undefined;
		this.promise = new AsyncablePromise<T>( (resolve,reject) => {
			debug( `${this.label()}/executor: Invoked` );
			maybe_resolver = resolve;
			maybe_rejecter = reject;
			debug( `${this.label()}/executor: Finished` );
		} );
		if( ! maybe_resolver ) { throw new Error( `${this.label(_fn)}: Missing resolver after constructing AsyncablePromise` ); }
		if( ! maybe_rejecter ) { throw new Error( `${this.label(_fn)}: Missing rejecter after constructing AsyncablePromise` ); }
		this._resolver = maybe_resolver;
		this._rejecter = maybe_rejecter;
		debug( `${this.label(_fn)}: Finished` );
	}

	/** Settles {@link promise} to fulfilled */
	public resolve( value: T | PromiseLike<T> ): void {
		debug( `${this.label()}/resolvePromise: Invoked` );
		this._resolver( value );
		debug( `${this.label()}/resolvePromise: Finished` );
	}

	/** Settles {@link promise} to rejected */
	public reject( reason: any ): void {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
		debug( `${this.label()}/rejectPromise: Invoked` );
		this._rejecter( reason );  //  eslint-disable-line @typescript-eslint/no-unsafe-call  --  any is necessary for compatibility with Promise
		debug( `${this.label()}/rejectPromise: Finished` );
	}

	/** [object DeferredAsyncablePromise<$\{ID\}:$\{STATE\}>] */
	public toString(): string { return `[object ${this.label()}]`; }

	/** Gets the label of this {@link DeferredAsyncablePromise} (for logging and debugging) */
	public label( fn?: string ) {
		if( "undefined" === typeof this.promise ) {  //  eslint-disable-line @typescript-eslint/tslint/config  --  this can get called before initialization gets far enough to set _asyncable
			return `DeferredAsyncablePromise<  construction in progress   >${ "undefined" !== typeof fn ? `.${fn}` : "" }`;  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		} else {
			return this.promise.label( fn ).replace( /^AsyncablePromise</, "DeferredAsyncablePromise<" );
		}
	}

}
