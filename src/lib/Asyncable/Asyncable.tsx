import * as debugFactory from "debug";
const debug: debugFactory.IDebugger = debugFactory( "Asyncable" );

import { AsyncablePromise, PromiseExecutor } from "./AsyncablePromise";
import { Deferred, DeferredAsyncablePromise } from "./DeferredAsyncablePromise";

export type AsyncablePreparer<T> = ( ac: AsyncableController<T>, ) => ( AsyncablePrepared<T> | undefined | void );  //  eslint-disable-line @typescript-eslint/no-invalid-void-type  --  TODO: this rule shouldn't complain that void is only valid as a return type when it's being used as a return type
export type AsyncableStarter<T> = ( ac: AsyncableController<T>, ) => void;
export type AsyncablePrepared<T> = { starter?: AsyncableStarter<T> };
export enum AsyncableState { PREPARING, READY, RUNNING, SUCCEDED, FAILED, INVALID }
export type AsyncableCallbackSuccess<T,TResult1> = ( ( result: T  ) => TResult1 | PromiseLike<TResult1> ) | null | undefined;
export type AsyncableCallbackFailure<T,TResult2> = ( ( error: any ) => TResult2 | PromiseLike<TResult2> ) | null | undefined;  //  eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any  --  T for consistency; any for compatability
export type AsyncableCallbackFinally<T         > = ( (       ) => T | PromiseLike<T> | undefined | void ) | null | undefined;  //  eslint-disable-line @typescript-eslint/no-invalid-void-type  --  TODO: this rule shouldn't complain that void is only valid as a return type when it's being used as a return type
type AsyncableThen<T, TResult1=T, TResult2=never> = ( onSuccess?: AsyncableCallbackSuccess<T,TResult1>, onFailure?:  AsyncableCallbackFailure< T,TResult2>, ) => Asyncable<TResult1 | TResult2>;
type AsyncableChainSuccess<T> = ( result: T  ) => void;
type AsyncableChainFailure<T> = ( error: any ) => void;  //  eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any  --  T for consistency; any for compatability

/** An asynchronous-execution construct intended to be more general than Promises */
export class Asyncable<T> {

	/** Suffix for the ID of the next new {@link Asyncable} (incremented when an ID is allocated) */
	private static _nextSuffix = 0;

	/** Returns an {@link Asyncable} which immediately succedes with {@link result} */
	public static succeded<T>( result: T | PromiseLike<T> ) {
		const label = `${this.name}.succeded`;
		debug( `${label}: Invoked` );
		const exec: AsyncablePreparer<T> = ( ac ) => {
			debug( `${label}/exec: Invoked` );
			ac.success( result );
			debug( `${label}/exec: Finished` );
			return {};
		};
		const r = new Asyncable<T>( exec );
		debug( `${label}: Returning ${r}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		return r;
	}

	/** Returns an {@link Asyncable} which immediately fails to {@link error} */
	public static failed<T>( error: any ) { // eslint-disable-line @typescript-eslint/no-explicit-any  --  any for compatibility
		const label = `${this.name}.failed`;
		debug( `${label}: Invoked` );
		const exec: AsyncablePreparer<T> = ( ac ) => {
			debug( `${label}/exec: Invoked` );
			ac.failure( error );
			debug( `${label}/exec: Finished` );
			return {};
		};
		const r = new Asyncable<T>( exec );
		debug( `${label}: Returning ${r}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		return r;
	}

	/** Factory needed by the [Promise test suite](https://github.com/promises-aplus/promises-tests) */
	public static deferred<T>(): Deferred<T> { return new DeferredAsyncablePromise<T>(); }

	/** Factory needed by the Promise Finally tests */
	public static fromexec<T=any>( exec: PromiseExecutor<T> ): AsyncablePromise<T> { return new AsyncablePromise( exec ); } // eslint-disable-line @typescript-eslint/no-explicit-any  --  any for compatibility

	/** Generate an ID for a new {@link Asyncable} */
	private static _newID() {
		const r = `${( Date.now() / 1000 ).toFixed(3)}-${this._nextSuffix.toString().padStart(4,"0")}`;  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  conversion factor, significant digits
		this._nextSuffix += 1;
		if( this._nextSuffix >= 10000 ) { this._nextSuffix = 0; }  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  confine to 4 digits
		return r;
	}

	/** Returns the then method, if and only if p is thenable */ // TODO: use Helper
	private static _thenIfThenable<T,TResult1,TResult2>( p: any ): AsyncableThen<T,TResult1,TResult2> | undefined {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any for overloading
		if( !!p && ("object" === typeof p || "function" === typeof p) ) {  //  eslint-disable-line @typescript-eslint/strict-boolean-expressions  --  TODO: this rule shouldn't trigger on typeof
			const then: AsyncableThen<T,TResult1,TResult2> | undefined = p.then; // eslint-disable-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access  --  any for overloading
			if( "function" === typeof then ) { return then.bind(p); } else { return undefined; }  //  eslint-disable-line no-undefined  --  TODO: this rule should allow return undefined
		} else {
			return undefined;  //  eslint-disable-line no-undefined  --  TODO: this rule should allow return undefined
		}
	}

	/** Not compatibile with Promises */
	public readonly [Symbol.toStringTag] = "Asyncable";

	/** An ID for this particular {@link Asyncable} (for logging and debugging) */
	private readonly _id: string = Asyncable._newID();
	/** The current state of this {@link Asyncable} */
	private _state: AsyncableState = AsyncableState.PREPARING;
	/** Result if and when this {@link Asyncable} succedes */
	private _result: T | undefined;
	/** Error if and when this {@link Asyncable} fails */
	private _error: any | undefined;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any for compatibility
	/** Function to transition from READY to RUNNING */
	private _start: () => this;
	/** Number of thenables passed to {@link _success} */
	private _thenCount = 0;
	/** Callbacks to be invoked if and when this {@link Asyncable} succedes. */
	private readonly _onSuccess: AsyncableChainSuccess<T>[] = [];
	/** Callbacks to be invoked if and when this {@link Asyncable} fails. */
	private readonly _onFailure: AsyncableChainFailure<T>[] = [];

	/** Not compatible with ES6 Promise constructor */
	public constructor( preparer: AsyncablePreparer<T> ) {
		const _fn = `constructor`;
		debug( `${this.label(_fn)}: Invoked` );
		const ac: AsyncableController<T> = new AsyncableController<T>(
			( result ) => { this._success( result  ); },
			( error: any ): void => { this._failure( error ); }, // eslint-disable-line @typescript-eslint/no-explicit-any  --  TODO: error type parameter (default string)
		);
		debug( `${this.label(_fn)}: Invoking preparer` );
		const prepared: AsyncablePrepared<T> = preparer( ac ) || {}; // TODO: run through constructor to ensure validity and warn of extra properties
		debug( `${this.label(_fn)}: Preparer returned in state ${AsyncableState[this._state]}` );
		if( this._state === AsyncableState.PREPARING ) {
			if( prepared.starter ) {
				this._state = AsyncableState.READY;
				this._start = () => {
					const fn = `_start`;
					if( this._state === AsyncableState.READY ) {
						if( "undefined" !== typeof prepared.starter ) {
							prepared.starter(ac); // TODO: exception handling
						} else {
							debug( `${this.label(fn)}: Skipping undefined starter` );
						}
						this._state = AsyncableState.RUNNING;
						this._start = () => this;
					}
					return this;
				};
			} else {
				this._state = AsyncableState.RUNNING;
				this._start = () => this;
			}
		} else {
			this._start = () => this;
		}
		debug( `${this.label(_fn)}: Finished in state ${AsyncableState[this._state]}` );
	}

	/** Start an Asyncable which is READY */
	public get start(): () => this { return () => this._start(); }

	/** [object Asyncable<$\{ID\}:$\{STATE\}>] */
	public toString() { return `[object ${this.label()}]`; }

	/**
	 * Attaches callbacks to be invoked when this {@link Asyncable} settles.
	 * @returns An {@link Asyncable} representing this {@link Asyncable}'s success followed by {@link onSuccess} OR this {@link Asyncable}'s failure followed by {@link onFailure},
	 */
	public then<TResult1 = T, TResult2 = never>(
		onSuccess?: AsyncableCallbackSuccess<T,TResult1>,
		onFailure?: AsyncableCallbackFailure<T,TResult2>,
		// onprogress?: // TODO: progress indicators to go with yeildyness
	): Asyncable< TResult1 | TResult2 > {
		const _fn = `then`;
		debug( `${this.label(_fn)}: Invoked in state ${AsyncableState[this._state]}` );
		let r: Asyncable< TResult1 | TResult2 >;
		switch( this._state ) {
			case AsyncableState.READY:
			case AsyncableState.PREPARING:
			case AsyncableState.RUNNING: {
				debug( `${this.label(_fn)}: deferred settling` );
				const execp: AsyncablePreparer< TResult1 | TResult2 > = (ac) => {
					debug( `${this.label(_fn)}/exec: Invoked` );
					const onf: AsyncableChainSuccess<T> = "function" === typeof onSuccess
						? (val) => {
							debug( `${this.label(_fn)}/exec/onf: Invoked (invoking onSuccess)` );
							try {
								const v: TResult1 | PromiseLike<TResult1> = onSuccess( val );
								ac.success( v );
							} catch(e) {
								debug( `${this.label(_fn)}/exec/onf: onSuccess threw -- %O`, e );
								ac.failure( e );
							}
							debug( `${this.label(_fn)}/exec/onf: Finished` );
						}
						: (val) => {
							debug( `${this.label(_fn)}/exec/onf: Invoked (no onSuccess)` );
							ac.success( val as unknown as TResult1 ); // without onSuccess this is a reinterpret cast
							debug( `${this.label(_fn)}/exec/onf: Finished` );
						};
					this._onSuccess.push( onf );
					const onr: AsyncableChainFailure<T> = "function" === typeof onFailure
						? (error) => {
							debug( `${this.label(_fn)}/exec/onr: Invoked (invoking onFailure)` );
							try {
								const v: TResult2 | PromiseLike<TResult2> = onFailure( error );
								ac.success( v );
							} catch(e) {
								debug( `${this.label(_fn)}/exec/onr: onFailure threw -- %O`, e );
								ac.failure( e );
							}
							debug( `${this.label(_fn)}/exec/onr: Finished` );
						}
						: (error) => {
							debug( `${this.label(_fn)}/exec/onr: Invoked (no onFailure)` );
							ac.failure( error );
							debug( `${this.label(_fn)}/exec/onr: Finished` );
						};
					this._onFailure.push( onr );
					debug( `${this.label(_fn)}/exec: Finished` );
				};
				r = new Asyncable< TResult1 | TResult2 >( execp );
				break;
			}
			case AsyncableState.SUCCEDED: {
				debug( `${this.label(_fn)}: immediate success` );
				const execf: AsyncablePreparer<TResult1> = "function" === typeof onSuccess
					? (ac) => {
						debug( `${this.label(_fn)}/exec: Invoked (invoking onSuccess) (BRANCH SYNC)` );
						setTimeout( () => {
							debug( `${this.label(_fn)}/exec: Invoked (invoking onSuccess) (NEW SYNC)` );
							try {
								const result = onSuccess( this._result as T ); // state SUCCEDED means _result is set
								ac.success( result );
							} catch(e) {
								debug( `${this.label(_fn)}: onSuccess threw -- %O`, e );
								ac.failure( e );
							}
							debug( `${this.label(_fn)}/exec: Invoked (invoked onSuccess) (END SYNC)` );
						}, 0 );
						debug( `${this.label(_fn)}/exec: Finished` );
					}
					: (ac) => {
						debug( `${this.label(_fn)}/exec: Invoked (no onSuccess)` );
						ac.success( this._result as undefined as TResult1 ); // without onSuccess this is a reinterpret cast
						debug( `${this.label(_fn)}/exec: Finished` );
					};
				r = new Asyncable< TResult1 | TResult2 >( execf ); // TODO: why can't this just be TResult1?
				break;
			}
			case AsyncableState.FAILED: {
				debug( `${this.label(_fn)}: immediate failure` );
				const execr: AsyncablePreparer< TResult1 | TResult2 > = "function" === typeof onFailure
					? (ac) => {
						debug( `${this.label(_fn)}/exec: Invoked (invoking onFailure) (BRANCH SYNC)` );
						setTimeout( () => {
							debug( `${this.label(_fn)}/exec: Invoked (invoking onFailure) (NEW SYNC)` );
							try {
								const result: TResult2 | PromiseLike<TResult2> = onFailure( this._error );
								debug( `${this.label(_fn)}: onFailure returned -- %O`, result );
								ac.success( result );
							} catch(e) {
								debug( `${this.label(_fn)}: onFailure threw -- %O`, e );
								ac.failure( e );
							}
							debug( `${this.label(_fn)}/exec: Invoked (invoked onFailure) (END SYNC)` );
						}, 0 );
						debug( `${this.label(_fn)}/exec: Finished` );
					}
					: (ac) => {
						debug( `${this.label(_fn)}/exec: Invoked (no onFailure)` );
						ac.failure( this._error );
						debug( `${this.label(_fn)}/exec: Finished` );
					};
				r = new Asyncable< TResult1 | TResult2 >( execr ); // TODO: why can't this just be TResult1?
				break;
			}
			default: {
				const err = `${this.label(_fn)}: invalid state (${typeof this._state}) ${this._state} => ${AsyncableState[this._state]}`;
				debug( err );
				this._state = AsyncableState.INVALID; // reset to good state before rejecting with state error
				this._failure( new Error( err ) );
				r = this.then( onSuccess, onFailure );
				break;
			}
		}
		debug( `${this.label(_fn)}: Returning ${r}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		return r;
	}

	/**
	 * Attaches a callback to be invoked if this {@link Asyncable} settles to failure.
	 * @returns An {@link Asyncable} representing this {@link Asyncable}'s success OR this {@link Asyncable}'s failure followed by {@link onFailure},
	 */
	public catch< TResult2 = never >(
		onFailure?: AsyncableCallbackFailure< T, TResult2 >,
	): Asyncable< T | TResult2 > {
		return this.then< T, TResult2 >( undefined, onFailure );  //  eslint-disable-line no-undefined  --  undefined for currying
	}

	/**
	 * Attaches a callback to be invoked when this {@link Asyncable} is settled.
	 * @returns An {@link Asyncable} representing this {@link Asyncable} followed by {@link onfinally},
	 */
	public finally(
		onfinally?: AsyncableCallbackFinally<T>,
	): Asyncable<T> {
		const _fn = `finally`;
		debug( `${this.label(_fn)}: Invoked in state ${AsyncableState[this._state]}` );
		let r: Asyncable<T>;
		if( "function" === typeof onfinally ) {
			r = this.then(
				(result ) => {
					const f = onfinally();
					const then: AsyncableThen<T> | undefined = Asyncable._thenIfThenable( f );
					return then ? then( ()=>result ) : result;
				},
				(error) => {
					const f = onfinally();
					const then: AsyncableThen<T,never> | undefined = Asyncable._thenIfThenable( f );
					if( then ) { return then( ()=>{ throw error; } ); } else { throw error; }  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  throw any (rather than Error)
				},
			);
		} else {
			r = this.then( onfinally, onfinally );
		}
		debug( `${this.label(_fn)}: Returning ${r}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in debug message
		return r;
	}

	/** Gets the label of this {@link Asyncable} (for logging and debugging) */
	public label( fn?: string ) {
		return `${this.constructor.name}<${this._id}:${AsyncableState[this._state].padEnd(9)}>${("undefined"!==typeof fn)?`.${fn}`:""}`;  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  padding makes logs more readable
	}

	/** Attempt to set success for this {@link Asyncable} */
	private _success( result: T | PromiseLike<T> ): void {
		const _fn = `_success`;
		debug( `${this.label(_fn)}: Invoked` );
		switch( this._state ) {
			case AsyncableState.READY: {
				const errReady = `${this.label(_fn)}: Succeded while not running (in state ${AsyncableState[this._state]})`;
				debug( errReady );
				this._state = AsyncableState.INVALID; // set to recognized invalid state before failing with state error
				this._failure( new Error( errReady ) );
				break;
			}
			case AsyncableState.PREPARING:
			case AsyncableState.RUNNING:
				debug( `${this.label(_fn)}: state = ${AsyncableState[this._state]}` );
				if( result === this ) {
					debug( `${this.label(_fn)}: success with self -- TypeError` );
					this._failure( new TypeError( "Asyncable cannot succeed with itself as its result" ) );
				} else {
					let then: AsyncableThen<T,void,void> | undefined;
					try {
						then = Asyncable._thenIfThenable( result ); // only retrieve the then function once
					} catch(e) {
						debug( `${this.label(_fn)}: error thrown from checking for thenability of result -- %O`, e );
						this._failure( e );
					}
					if( "undefined" !== typeof then ) {
						const thenFn = then;
						this._thenCount += 1;
						const thenNum = this._thenCount;
						debug( `${this.label(_fn)}: result is Thenable #${thenNum} -- (${typeof result})`, result, "--", thenFn );
						debug( `${this.label(_fn)}: chain settling to Thenable #${thenNum} (BRANCH SYNC)` );
						setTimeout( () => {
							debug( `${this.label(_fn)}: chain settling to Thenable #${thenNum} (NEW SYNC)` );
							const onSuccess: AsyncableCallbackSuccess<T,void> = ( val: T ) => {
								debug( `${this.label(_fn)}/onSuccess: Invoked for Thenable #${thenNum}` );
								if( thenNum === this._thenCount ) {
									debug( `${this.label(_fn)}/onSuccess: Thenable #${thenNum} is current, resolving` );
									this._success( val );
								} else {
									debug( `${this.label(_fn)}/onSuccess: Thenable #${thenNum} has been replaced (on #${this._thenCount}), ignoring result %O`, val );
								}
								debug( `${this.label(_fn)}/onSuccess: Returning for Thenable #${thenNum} -- undefined` );
							};
							const onFailure: AsyncableCallbackFailure<T,void> = ( error: any ) => { // eslint-disable-line @typescript-eslint/no-explicit-any  --  any for compatibility
								debug( `${this.label(_fn)}/onFailure: Invoked for Thenable #${thenNum}` );
								if( thenNum === this._thenCount ) {
									debug( `${this.label(_fn)}/onFailure: Thenable #${thenNum} is current, failing` );
									this._failure( error );
								} else {
									debug( `${this.label(_fn)}/onFailure: Thenable #${thenNum} has been replaced (on #${this._thenCount}), ignoring error %O`, error );
								}
								debug( `${this.label(_fn)}/onFailure: Returning for Thenable #${thenNum} -- undefined` );
							};
							try {
								thenFn( onSuccess, onFailure );  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  start returns self, doesn't need additional error handling
							} catch(e) {
								debug( `${this.label(_fn)}: Thenable #${thenNum} threw -- %O`, e );
								if( thenNum === this._thenCount ) {
									debug( `${this.label(_fn)}/onSuccess: Thenable #${thenNum} is current, failing` );
									this._failure( e );
								} else {
									debug( `${this.label(_fn)}/onSuccess: Thenable #${thenNum} has been replaced (on #${this._thenCount}), ignoring error %O`, e );
								}
							}
							debug( `${this.label(_fn)}: chained settling to Thenable #${thenNum} (END SYNC)` );
						}, 0 );
					} else {
						debug( `${this.label(_fn)}: succeded -- `, result );
						this._state = AsyncableState.SUCCEDED;
						this._result = result as T; // if result isn't thenable, it's a T
						debug( `${this.label(_fn)}: ${this._onSuccess.length} onSuccess callbacks to invoke` );
						let h = 0;
						while( this._onSuccess.length > 0 ) {
							h += 1;
							const i = h; // preserve value in closure
							const onSuccess = this._onSuccess.shift() as AsyncableChainSuccess<T>;
							debug( `${this.label(_fn)}: invoking onSuccess callback #${i} (BRANCH SYNC)` );
							setTimeout( () => {
								debug( `${this.label(_fn)}: invoking onSuccess callback #${i} (NEW SYNC)` );
								try {
									onSuccess( this._result as T );
								} catch(e) {
									debug( `${this.label(_fn)}: onSuccess callback #${i} threw -- %O`, e );
								}
								debug( `${this.label(_fn)}: done with onSuccess callback #${i} (END SYNC)` );
							}, 0 );
						}
						debug( `${this.label(_fn)}: ${this._onSuccess.length} onSuccess callbacks remaining` );
					}
				}
				break;
			case AsyncableState.SUCCEDED:
				debug( `${this.label(_fn)}: already succeded` );
				break;
			case AsyncableState.FAILED:
				debug( `${this.label(_fn)}: already failed` );
				break;
			default: {
				const errDefault = `${this.label(_fn)}: invalid state (${typeof this._state}) ${this._state} => ${AsyncableState[this._state]}`;
				debug( errDefault );
				this._state = AsyncableState.INVALID; // set to recognized invalid state before failing with state error
				this._failure( new Error( errDefault ) );
				break;
			}
		}
		debug( `${this.label(_fn)}: Finished` );
	}

	/** Attempt to set failure for this {@link Asyncable} */
	private _failure( error: any ): void {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
		const _fn = `_failure`;
		debug( `${this.label(_fn)}: Invoked` );
		switch( this._state ) {
			case AsyncableState.READY: {
				const errReady = `${this.label(_fn)}: Failed while not running (in state ${AsyncableState[this._state]})`;
				debug( errReady );
				this._state = AsyncableState.INVALID; // set to recognized invalid state before failing with state error
				this._failure( new Error( errReady ) );
				break;
			}
			case AsyncableState.PREPARING:
			case AsyncableState.RUNNING: {
				debug( `${this.label(_fn)}: failure with error -- `, error );
				this._state = AsyncableState.FAILED;
				this._error = error;  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for compatibility with Promise
				debug( `${this.label(_fn)}: ${this._onFailure.length} onFailure callbacks to invoke` );
				let h = 0;
				while( this._onFailure.length > 0 ) {
					h += 1;
					const i = h; // preserve value in closure
					const onFailure = this._onFailure.shift() as AsyncableChainFailure<T>;
					debug( `${this.label(_fn)}: invoking onFailure callback #${i} (BRANCH SYNC)` );
					setTimeout( () => {
						debug( `${this.label(_fn)}: invoking onFailure callback #${i} (NEW SYNC)` );
						try {
							onFailure( this._error );
						} catch(e) {
							debug( `${this.label(_fn)}: onFailure callback #${i} threw -- %O`, e );
						}
						debug( `${this.label(_fn)}: done with onFailure callback #${i} (END SYNC)` );
					}, 0 );
					debug( `${this.label(_fn)}: ${this._onFailure.length} onFailure callbacks remaining` );
				}
				break;
			}
			case AsyncableState.SUCCEDED:
				debug( `${this.label(_fn)}: already succeded` );
				break;
			case AsyncableState.FAILED:
				debug( `${this.label(_fn)}: already failed` );
				break;
			default: {
				const errDefault = `${this.label(_fn)}: invalid state (${typeof this._state}) ${this._state} => ${AsyncableState[this._state]}`;
				debug( errDefault );
				this._state = AsyncableState.INVALID; // set to recognized invalid state before failing with state error
				this._failure( new Error( errDefault ) );
				break;
			}
		}
		debug( `${this.label(_fn)}: Finished` );
	}

}

/** Controller used within the asynchronous task represented by an Asyncable */
export class AsyncableController<T> {
	public constructor(
		public readonly success: ( result: T | PromiseLike<T> ) => void,
		public readonly failure: ( error:  any                ) => void,  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any for compatibility
	) {
	}
}
