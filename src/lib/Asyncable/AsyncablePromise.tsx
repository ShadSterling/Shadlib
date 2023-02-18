import * as debugFactory from "debug";
const debug: debugFactory.IDebugger = debugFactory( "AsyncablePromise" );

import { Helpers } from "../Helpers";

import { Asyncable } from "./Asyncable";

export type PromiseFulfiller<T> = ( value:  T | PromiseLike<T>  ) => void;
export type PromiseRejecter     = ( reason: any                 ) => void;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
export type PromiseExecutor<T>  = ( resolve: PromiseFulfiller<T>, reject: PromiseRejecter ) => void | undefined;  //  eslint-disable-line @typescript-eslint/no-invalid-void-type  --  TODO: this rule shouldn't complain that void is only valid as a return type when it's being used as a return type
export type PromiseCallbackFulfilled<T,TResult1> = ( (  value: T   ) => TResult1 | PromiseLike<TResult1> ) | null | undefined;
export type PromiseCallbackRejected<   TResult2> = ( ( reason: any ) => TResult2 | PromiseLike<TResult2> ) | null | undefined;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise

/** A Promise-compatible wrapper/adapter of the general Asyncable class */
export class AsyncablePromise<T> implements Promise<T> {
	/** For compatibility with Promises */
	public readonly [Symbol.toStringTag] = "Promise";

	/** The Adaptee */
	private readonly _asyncable: Asyncable<T>;

	// /** Fulfillment passthrough */
	// private readonly _resolver: AsyncableResolver<T> | undefined;

	// /** Rejection passthrough */
	// private readonly _rejecter: AsyncableRejecter<T> | undefined;

	/** Compatible with ES6 Promise constructor */
	public constructor( init: PromiseExecutor<T> | Asyncable<T> ) {
		const _fn = `constructor`;
		debug( `${this.label(_fn)}: Invoked` );
		if( init instanceof Asyncable ) {
			debug( `${this.label(_fn)}: Adapting ${init}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
			this._asyncable = init;
		} else {
			debug( `${this.label(_fn)}: Invoking executor` );
			this._asyncable = new Asyncable<T>( (ac) => {
				debug( `${this.label(_fn)}/executor: Invoked` );
				const fulfill: PromiseFulfiller<T> = ( value ) => {
					debug( `${this.label()}/fulfiller: Invoked` );
					if( value === this ) { ac.failure( new TypeError( "AsyncablePromise cannot be resolved to itself" ) ); } else { ac.success( value ); }
					debug( `${this.label()}/fulfiller: Finished` );
				};
				const reject:  PromiseRejecter = ( reason ) => {
					debug( `${this.label()}/rejecter: Invoked` );
					ac.failure( reason );
					debug( `${this.label()}/rejecter: Finished` );
				};
				init( fulfill, reject );
				debug( `${this.label(_fn)}/executor: Finished` );
			} );
		}
		debug( `${this.label(_fn)}: Finished` );
	}

	/** [object AsyncablePromise<$\{ID\}:$\{STATE\}>] */
	public toString() { return `[object ${this.label()}]`; }

	/** Passthrough to {@link Asyncable#then} */
	public then<TResult1 = T, TResult2 = never>(
		onfulfilled?: PromiseCallbackFulfilled<T,TResult1>,
		onrejected?:  PromiseCallbackRejected<   TResult2>,
	): AsyncablePromise< TResult1 | TResult2 > {
		const _fn = `then`;
		debug( `${this.label(_fn)}: Invoked` );
		const r:AsyncablePromise< TResult1 | TResult2 > = new AsyncablePromise< TResult1 | TResult2 >( this._asyncable.then< TResult1, TResult2 >(
			onfulfilled ? (value) => {
				debug( `${this.label(_fn)}/${r}/onf: Invoked` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
				let v: TResult1 | PromiseLike<TResult1>;
				if( "function" === typeof onfulfilled ) {
					debug( `${this.label(_fn)}/${r}/onf: Invoking onfulfilled` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					v = onfulfilled( value );
				} else {
					v = value as unknown as TResult1; // if onfulfilled is not a function, do a reinterpret cast
					debug( `${this.label(_fn)}/${r}/onf: onfulfilled is not a function, it's a ${Helpers.whatIs(onfulfilled)}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
				}
				if( v === r ) {
					const e = new TypeError( "AsyncablePromise cannot be resolved to itself" );
					debug( `${this.label(_fn)}/${r}/onf: Throwing ${e}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					throw e;
				} else {
					debug( `${this.label(_fn)}/${r}/onf: Returning ${Helpers.stringify(v)}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					return v;
				}
			} : undefined,  //  eslint-disable-line no-undefined  --  TODO: is there a better way to do this?
			onrejected ? (reason) => {
				debug( `${this.label(_fn)}/onr: Invoked` );
				if( "function" === typeof onrejected ) {
					debug( `${this.label(_fn)}/${r}/onr: Invoking onrejected` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					let result: TResult2 | PromiseLike<TResult2>;
					try {
						result = onrejected( reason );
						debug( `${this.label(_fn)}/${r}/onr: onrejected returned (${typeof result}) ${Helpers.stringify(result)}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					} catch(e) {
						debug( `${this.label(_fn)}/${r}/onr: onrejected threw (${typeof e}) ${e}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
						throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: Helpers.tryCatchElseFinally needs types
					}
					if( result === r ) {
						const e = new TypeError( "AsyncablePromise cannot be resolved to itself" );
						debug( `${this.label(_fn)}/${r}/onr: Throwing ${e}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
						throw e;
					}
					debug( `${this.label(_fn)}/${r}/onr: Returning ${Helpers.stringify(result)}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					return result;  //  eslint-disable-line @typescript-eslint/no-non-null-assertion  --  TODO: can this be done without assertion?  We can't check for undefined, because TResult2 might include undefined, but tryCatchElseFinally might return undefined
				} else {
					debug( `${this.label(_fn)}/${r}/onr: onrejected is not a function, it's a ${Helpers.whatIs(onrejected)}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					debug( `${this.label(_fn)}/${r}/onr: Throwing ${reason}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
					throw reason;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  any is necessary for compatibility with Promise
				}
			} : undefined,  //  eslint-disable-line no-undefined  --  TODO: is there a better way to do this?
		) );
		debug( `${this.label(_fn)}: Returning ${r}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		return r;
	}

	/** Passthrough to {@link Asyncable#catch} */
	public catch< TResult2 = never >(
		onrejected?: PromiseCallbackRejected<TResult2>,
	): AsyncablePromise< T | TResult2 > {
		const _fn = `catch`;
		debug( `${this.label(_fn)}: Invoked` );
		const r = this.then( undefined, onrejected );  //  eslint-disable-line no-undefined  --  TODO: is there a better way to do this?  Maybe an addCallbacks that takes an object with optional fields?
		debug( `${this.label(_fn)}: Returning ${r}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		return r;
	}

	/** Passthrough to {@link Asyncable#finally} */
	public finally(
		onfinally?: ( () => void ) | null | undefined,
	): AsyncablePromise<T> {
		return new AsyncablePromise( this._asyncable.finally( onfinally ) );  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
	}

	/** Gets the label of this {@link AsyncablePromise} (for logging and debugging) */
	public label( fn?: string ) {
		if( "undefined" === typeof this._asyncable ) {  //  eslint-disable-line @typescript-eslint/tslint/config  --  this can get called before initialization gets far enough to set _asyncable
			return `AsyncablePromise<  construction in progress   >${ "undefined" !== typeof fn ? `.${fn}` : "" }`;  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		} else {
			return this._asyncable.label( fn ).replace( /^Asyncable</, "AsyncablePromise<" );
		}
	}

}
