// TODO: unit tests & code coverage
// TODO: use Promises/A+ complience tests at https://github.com/promises-aplus/promises-tests
// TODO: lint
// TODO: API documentation
// TODO: make importable
// TODO: add noAutoStart=false to constructor, make start() run automatically unless noAutoStart=true
// TODO: then/catch/aborted need to
// TODO: remember the rest of the thought on the previous item?
// TODO: warnings when going too long without idle
// TODO: publish to Github, submit to implementations list via https://github.com/promises-aplus/promises-tests
// TODO: write .all and .race more separately
// TODO: queriable status
// TODO: methods for timeouts
// TODO: move bulk of functionality into AbortableShared class?
// TODO: better names for Controller and Shared?
// TODO: Make a non-abortable Task type & replace all internal use of Promises with Tasks
// TODO: implement more general API? e.g. https://brianmckenna.org/blog/category_theory_promisesaplus
// TODO: Use actual enum type instead of string union for Abortable status
// TODO: AbortableController#yield
// TODO: timeout warnings to task via AbortableController (#idle/#yield?)
// TODO: types for callbacks for then/catch/aborted/finally/ensure/etc
// TODO: Abstract Abortable from Promise, then make AbortablePromise implement both
// TODO: Result of all should be an array of {result,error,reason,capabilities} objects
// TODO: Results of any and race should be {winner,allResults} objects
// TODO: some methods would benefit from a Ttester: (t:T)=>t is T parameter
// TODO: separate out Adapter for promises-aplus-test?
// TODO: rather than never resolving, the default aborter should pend until another aborter is assigned, runs, and completes
// TODO: separate classes for derived abortables
// TODO: separate state for "chained" and waiting on another PromiseLike
// TODO: explicit model of promise chain links
// TODO: constructor: make starter and aborter optional; missing starter means already started, missing aborter means not abortable
// TODO: spin off & use "Thread-ish" class to give debug messages when starting/ending new "threads"; maybe roll in stack tracking & "thread" IDs...

import * as debugFactory from "debug";
const debug: debugFactory.IDebugger = debugFactory( "Abortable" );  //  eslint-disable-line @typescript-eslint/naming-convention -- use lowercase "debug" consistent with widespread convention

import { Helpers } from "./Helpers";

export type AbortablePreparer<T> = ( ac: AbortableController<T>, ) => ( AbortablePrepared<T> | void );  //  eslint-disable-line @typescript-eslint/no-invalid-void-type  --  void is valid as a return type
export type AbortableStarter<T> = ( ac: AbortableController<T>, ) => void;
export type AbortableAborter<T> = ( message: string|undefined, ac: AbortableController<T>, ) => void | Promise<void>;
export type AbortablePrepared<T> = { starter: AbortableStarter<T>; aborter: AbortableAborter<T> };
export type AbortablePrestartPreparer<T> = ( resolve: ( value?: T | PromiseLike<T> ) => void, reject: ( reason?: any ) => void, ac?: AbortableController<T> ) => void;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
export type AbortableCallbackSuccess<T,TResult1=T> = ( result: T     ) => TResult1 | PromiseLike<TResult1>;
export type AbortableCallbackFailure<T,TResult2=T> = ( error:  Error ) => TResult2 | PromiseLike<TResult2>;
export type AbortableCallbackAbort<    TResult  > = ( reason: string ) => TResult | PromiseLike<TResult>;
export type AbortableState = "constructing"|"ready"|"running"|"paused"|"idle"|"succeded"|"failed"|"aborted"; // TODO: use enum
type AbortableAlternatePrep<T> = { state: "succeded"; value: T } | { state: "failed"; value: Error } | { state: "aborted"; value: string };
export type AbortableThen<T, TResult1=T, TResult2=never> = ( onfulfilled?: AbortableCallbackSuccess<T,TResult1>, onrejected?:  AbortableCallbackFailure< T,TResult2>, ) => Abortable<TResult1 | TResult2>;
export type AbortableAborted<TResult> = ( onAbort?: AbortableCallbackAbort<TResult> | undefined | null ) => Abortable<TResult>;
type DeferredAbortable<T> = { promise:Abortable<T>; resolve:(t:T)=>void; reject:(e:Error)=>void; abort:(r:string)=>void };

//TODO: make these methods? re-enable only-arrow-functions?
/** A function that does nothing */
const nullFunction: (...args:any[])=>void = ()=>{return;};  //  eslint-disable-line @typescript-eslint/no-explicit-any,arrow-body-style  --  any is necessary for compatibility with Promise; arrow-body-style doesn't support void no-op arrow functions
/** Returns a valid AbortableStarter that does nothing (the task will be marked as running but will not do anything) */
function nullStarter<T=void>(): AbortableStarter<T> { return nullFunction; }
/** Returns a valid AbortableAborter that does nothing (the task will be marked as aborted without any action) */
function nullAborter<T=void>(): AbortableAborter<T> { return nullFunction; }
/** Returns a valid AbortablePrepared that does nothing (the task will never complete) */
function nullPrepared<T=void>(): AbortablePrepared<T> { return { starter: nullStarter<T>(), aborter: nullAborter<T>() }; }  //  eslint-disable-line sort-keys  --  TODO: sort-keys option to require literals to match declarations

const nextSuffix = Helpers.cycler();

/**
 * Promise-compatible representation of an asynchronous task that can be aborted.
 */
export class Abortable<T> implements Promise<T> {

	/** Returns an {@link Abortable} which has already succeded */
	public static success<U>( result: U | PromiseLike<U> ):Abortable<U> {
		const prep: AbortablePreparer<U> | AbortableAlternatePrep<U> = Helpers.isPromiseLike( result )
			? (ac:AbortableController<U>) => { ac.success(result); }
			:  { state: "succeded", value: result };
		const r = new this<U>(prep);
		debug( `${r.label}: Constructed already succeded` );
		return r;
	}
	/** Returns an {@link Abortable} which has already failed */
	public static failure<U=never>(error:Error):Abortable<U> {
		const prep: AbortablePreparer<U> | AbortableAlternatePrep<U> = false  //  eslint-disable-line no-constant-condition  --  allow for illustration of both options
			? (ac:AbortableController<U>) => { ac.failure(error); }
			:  { state: "failed", value: error };
		const r = new this<U>(prep);
		debug( `${r.label}: Constructed already failed` );
		return r;
	}
	/** Returns an {@link Abortable} which has already been aborted */
	public static aborted<U>(message:string):Abortable<U> {
		const prep: AbortableAlternatePrep<U> = { state: "aborted", value: message };
		const r = new this<U>(prep);
		debug( `${r.label}: Constructed already aborted` );
		return r;
	}
	/** Promise-compatible alias of {@link success} */
	public static resolve<U=unknown>( result: U | PromiseLike<U> ): Abortable<U> { return this.success<U>( result ); }
	/** Promise-compatible alias of {@link failure} */
	public static reject<U=never>(error:any):Abortable<U> { return this.failure<U>( Helpers.errorChain(error) ); }  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for compatibility with Promise
	/** Alternate {@link constructor} to satisfy the [Promise test suite](https://github.com/promises-aplus/promises-tests) */
	public static deferred<U>(): DeferredAbortable<U> {
		let c: AbortableController<U>;
		const p = new Abortable<U>( (ac) => { c = ac; return nullPrepared<U>(); } );
		debug( `${p.label}: deferred promise created (EXTERNAL)` );
		return {
			promise: p, // TODO: preserve stack trace by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous break
			resolve: ( t: U      ) => {
				debug( `${p.label}: resolvePromise Invoked (EXTERNAL)` );
				setTimeout( ()=>{  // use setTimeout to make the block asynchronous  //  TODO: replace all of these with Helpers.asyncMacro; update asyncMacro to preserve stack trace (maybe by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous branch)
					debug( `${p.label}: resolvePromise Invoked (NEW SYNC)` );
					c.success(t);
					debug( `${p.label}: resolvePromise Completed (END SYNC)` );
				}, 0 );  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  Timeout of zero to use setTimeout to make the block asynchronous  //  TODO: replace use of setTimeout to make a block asynchronous with Helpers.asyncMacro; update asyncMacro to preserve stack trace (maybe by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous branch)
			}, // ... hopefully the constructor will finish before this is queued
			reject: ( e: Error  ) => { setTimeout( ()=>{ c.failure(e); }, 0 ); },  //  TODO: replace use of setTimeout to make a block asynchronous with Helpers.asyncMacro; update asyncMacro to preserve stack trace (maybe by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous branch)  //  TODO: make it clear that the constructor will always finish before this runs
			abort:  ( r: string ) => { setTimeout( ()=>{ p.abort(r);   }, 0 ); },  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting  //  TODO: make it clear that the constructor will always finish before this runs
		};
	}
	/**
	 * Returns an {@link Abortable} that
	 * - succedes when all arguments have succeded/resolved
	 * - fails when any argument fails/rejects
	 * - is aborted when any argument is aborted
	 * - aborts all pending arguments when aborted
	 * NOTE: if U is an Array type, it must be passed in an array (otherwise it will be destructured)
	 */
	public static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10> ] ): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
	public static all<T1, T2, T3, T4, T5, T6, T7, T8, T9     >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>                         ] ): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9     ]>;
	public static all<T1, T2, T3, T4, T5, T6, T7, T8         >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>                                               ] ): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8         ]>;
	public static all<T1, T2, T3, T4, T5, T6, T7             >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>                                                                     ] ): Abortable<[T1, T2, T3, T4, T5, T6, T7             ]>;
	public static all<T1, T2, T3, T4, T5, T6                 >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>                                                                                           ] ): Abortable<[T1, T2, T3, T4, T5, T6                 ]>;
	public static all<T1, T2, T3, T4, T5                     >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>                                                                                                                 ] ): Abortable<[T1, T2, T3, T4, T5                     ]>;
	public static all<T1, T2, T3, T4                         >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>                                                                                                                                       ] ): Abortable<[T1, T2, T3, T4                         ]>;
	public static all<T1, T2, T3                             >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>                                                                                                                                                              ] ): Abortable<[T1, T2, T3                             ]>;
	public static all<T1, T2                                 >( args: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>                                                                                                                                                                                    ] ): Abortable<[T1, T2                                 ]>;
	public static all<T1                                     >( args: [ T1 | PromiseLike<T1>                                                                                                                                                                                                          ] ): Abortable<[T1                                     ]>;
	public static all<U>(    args: ( U | PromiseLike<U> )[] ): Abortable<U[]>;
	public static all<U>(    args: [ U | PromiseLike<U> ]   ): Abortable<[U]>;
	public static all<X>( ...args: ( X | PromiseLike<X> | Error )[] | [X|PromiseLike<X>|Error] ): Abortable<X[]>;
	public static all<T>( ...args: any[] ): Abortable<any> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs
		const r = new Abortable( (ac) => {
			const indexes:  Set<number>             = new Set<number>(); // indicies into args of entries which are pending
			const pending:  PromiseLike<any>[]      = [];  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs  //  entries in args which have yet to settle
			const success: (PromiseLike<any>|any)[] = [];  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs  //  entries in args which settled to success
			const failure: (Error|string)[]         = [];  // entries in args which settled to failure
			let abortBlocked = false;
			let firstfail: number | undefined;
			// const values: (X|PromiseLike<X>|Error)[] = (1 === args.length && args[0] instanceof Array) ? args[0] : args;  //  eslint-disable-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-magic-numbers  --  any is necessary for unlimited varargs; "magic numbers" are ok for interpreting positional args
			// const values: (any|PromiseLike<any>|Error)[] = (1 === args.length && args[0] instanceof Array) ? args[0] : args;  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  "magic numbers" are ok for interpreting positional args
			const values: (any|PromiseLike<any>|Error)[] = (1 === args.length && args[0] instanceof Array) ? args[0] : args;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs
			for( let i = 0; i < values.length; i++ ) {
				const value = values[i];  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
				if( Helpers.isPromise( value ) ) {
					indexes.add( i );
					pending[i] = value;
				} else if( value instanceof Error ) {
					if( "undefined" === typeof firstfail ) { firstfail = i; }
					failure[i] = value;
				} else {
					success[i] = value;  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
				}
			}
			const maySettle = () => {
				if( indexes.size <= 0 ) { // did settle
					if( "undefined" === typeof firstfail ) { // settled success
						ac.success( success );
					} else { // settled failure
						ac.failure( failure[firstfail] as Error );
					}
					return true;
				} else {
					return false;
				}
			};
			indexes.forEach( (i) => {  //  eslint-disable-line no-restricted-properties  --  TODO: no-restricted-properties forEach exception for container type Set
				const p = pending[i];
				p.then(
					(result:PromiseLike<T>|T) => {
						indexes.delete(i);  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords by name, maybe per type, or just allow anArray.delete specifically
						success[i] = result;  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
						maySettle();
					},
					nullFunction
				);
				if( Helpers.isPromise( p ) ) {
					p.catch( (error:Error) => {  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords by name, maybe per type, or just allow aPromise.catch specifically
						indexes.delete(i);  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords by name, maybe per type, or just allow anArray.delete specifically
						if( "undefined" === typeof firstfail ) { firstfail = i; }
						failure[i] = error;
						maySettle();
					} );
				}
				if( p instanceof Abortable ) {
					p.aborted( (message?:string) => {  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
						indexes.delete(i);  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords by name, maybe per type, or just allow aSet.delete specifically
						if( r.state !== "aborted" ) {
							failure[i] = `Aborted externally ${ ( "undefined" !== typeof message ) ? `-- ${message}` : "(no message given)" }`;
							r.abort(     `Abort from #${i} ${   ( "undefined" !== typeof message ) ? `-- ${message}` : "(no message given)" }` );  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
						}
					} );
				} else { abortBlocked = true; }
			} );
			maySettle(); // in case array is empty
			return {
				starter: () => { // start function
					indexes.forEach( (i) => {  //  eslint-disable-line no-restricted-properties  --  TODO: no-restricted-properties forEach exception for container type Set
						const value = values[i];  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
						if( value instanceof Abortable ) { value.start(); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  start returns self, doesn't need additional error handling
					} );
				},
				aborter: async (message?:string):Promise<void> => new Promise<void>(
					(resolve,_reject) => {
						indexes.forEach( (h) => {  //  eslint-disable-line no-restricted-properties  --  TODO: no-restricted-properties forEach exception for container type Set
							const i = h; // ensure separate binding for each callback // TODO: is this necessary?
							const value = values[i];  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
							if( value instanceof Abortable ) {
								const msg = `Aborted as #${i} ${ ( "undefined" !== typeof message ) ? `-- ${message}` : "(no message given)" }`;
								value.abort(msg).aborted( (_m) => {  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
									indexes.delete(i);  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords by name, maybe per type, or just allow aSet.delete specifically
									if( !abortBlocked && indexes.size <= 0 ) { resolve(); }
								} );
							} else { abortBlocked = true; }
						} );
						return;
					}
				),
			};
		} );
		return r;
	}
	/**
	 * Returns an {@link Abortable} that
	 * - succedes when any argument succeds/resolves
	 * - fails when any argument fails/rejects
	 * - is aborted when any argument is aborted
	 * - aborts all pending arguments when settled or aborted
	 * NOTE: if T is an Array type, it must be passed in an array (otherwise it will be destructured)
	 */
	public static race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10> ] ): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
	public static race<T1, T2, T3, T4, T5, T6, T7, T8, T9     >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>                         ] ): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9      >;
	public static race<T1, T2, T3, T4, T5, T6, T7, T8         >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>                                               ] ): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8           >;
	public static race<T1, T2, T3, T4, T5, T6, T7             >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>                                                                     ] ): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7                >;
	public static race<T1, T2, T3, T4, T5, T6                 >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>                                                                                           ] ): Abortable<T1 | T2 | T3 | T4 | T5 | T6                     >;
	public static race<T1, T2, T3, T4, T5                     >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>                                                                                                                 ] ): Abortable<T1 | T2 | T3 | T4 | T5                          >;
	public static race<T1, T2, T3, T4                         >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>                                                                                                                                       ] ): Abortable<T1 | T2 | T3 | T4                               >;
	public static race<T1, T2, T3                             >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>                                                                                                                                                             ] ): Abortable<T1 | T2 | T3                                    >;
	public static race<T1, T2                                 >( values: [ T1 | PromiseLike<T1>, T2 | PromiseLike<T2>                                                                                                                                                                                   ] ): Abortable<T1 | T2                                         >;
	public static race<T1                                     >( values: [ T1 | PromiseLike<T1>                                                                                                                                                                                                         ] ): Abortable<T1                                              >;
	public static race<U>(  values: ( U | PromiseLike<U>                        )[] ): Abortable<U>;
	public static race<U>( ...args: ( U | PromiseLike<U> | (U|PromiseLike<U>)[] )[] ): Abortable<U>;
	public static race( ...args:any[] ): Abortable<any> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs
		const r = new Abortable<any>( (_ac):AbortablePrepared<any> => {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs
			const values: any[] = ( 1 === args.length && args[0] instanceof Array ) ? args[0] : args;  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any is necessary for unlimited varargs
			let done = false;
			const abortentry = ( msg: string, i: number ) => {
				if( values[i] instanceof Abortable ) { values[i].abort( msg ); }  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  --  any is necessary for unlimited varargs
			};
			const conclude = ( msg: string, skip: number ) => {
				if( !done ) {
					done = true;
					for( let i = 0; i < skip; i++ ) { abortentry( msg, i ); }
					for( let i = skip+1; i < values.length; i++ ) { abortentry( msg, i ); }
				}
			};
			const winner = ( z:number ) => { conclude( `#${z} won the race`, z ); };
			const looser = ( z:number ) => { conclude( `#${z} lost the race`, z ); };
			for( let h = 0; h < values.length; h++ ) {
				const i = h; // ensure separate binding for each index
				const arg = values[i];  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
				if( !Helpers.isPromiseLike( arg ) ) {
					winner( i );
				} else {
					arg.then( (_result) => { winner(i); } );  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  then returns self, doesn't need additional error handling
					if( Helpers.isPromise(arg) ) { arg.catch( (_error) => { looser(i); } ); }  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords by name, maybe per type, or just allow aPromise.catch specifically
					if( arg instanceof Abortable ) { arg.aborted( (message:string) => { r.abort( `Abort from #${i} -- ${message}` ); } ); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
				}
			}
			return {
				starter: (_ac2) => { for( const arg of values ) { if( arg instanceof Abortable ) { arg.start(); } } },  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  start returns self, doesn't need additional error handling  //  start function
				aborter: async (message:string|undefined,_ac2:AbortableController<void>):Promise<void> => new Promise<void>(  //  abort function
					(resolve,_reject) => {
						let remaining = values.length;
						for( let h = 0; h < values.length; h++ ) {
							const i = h; // ensure separate binding for each callback
							const value = values[i];  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  any is necessary for unlimited varargs
							if( value instanceof Abortable ) {
								value.abort( `Aborted as #${i} ${ ( "undefined" !== typeof message ) ? `-- ${message}` : "(no message given)" }` ).aborted( (_msg) => {  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
									remaining -= 1;
									if( remaining <= 0 ) { resolve(); }
								} );
							} else if( Helpers.isPromiseLike( value ) ) {
								remaining = +Infinity; // If there are non-abortable promiselikes, abort can't complete
							}
						}
						return;
					},
				),
			};
		} );
		return r;  //  eslint-disable-line @typescript-eslint/no-unsafe-return  --  any is necessary for unlimited varargs
	}

	/** For compatibility with Promises */
	public readonly [Symbol.toStringTag] = "Promise";
	/** Function that starts the task (returned by callback to constructor) */
	private _starter: AbortableStarter<T> | undefined;
	/** Shared with the {@link AbortableController} which is made available to task */
	private readonly _as = new AbortableShared<T>(this);
	/** The {@link AbortableController} is used by the task to handle success, failure, and abort */
	private readonly _ac = this._as.ac;

	public constructor( prep: AbortablePreparer<T> | AbortableAlternatePrep<T> ) {
		const fn = `${this.label}.constructor`;
		debug( `${fn}: Invoked (spawn)` );
		if( "function" === typeof prep ) {  //  AbortablePreparer, standard asynchronous preparation
			setTimeout(  // use setTimeout to make the prep asynchronous // TODO: preserve stack trace by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous break
				() => {
					debug( `${fn}: Preparing (NEW SYNC)` );
					const r = prep( this._ac ); // TODO: exception handling // TODO: allow asynchronous
					if( r ) {
						this._starter = r.starter;
						this._as.setPrepared( r ); // TODO: move starter into AbortableShared
					} else {
						switch( this._as.state ) {
							case "constructing":
								throw new Error( `${fn}: Prepare function neither settled nor provided management functions` );
							case "succeded": case "failed":
								debug( `${fn}: Settled to state "+this._as.state+" during preparation` );
								break; // nothing to do
							case "ready": case "running": case "paused": case "idle": case "aborted": default:
								throw new Error( `${fn}: Transitioned to state ${this._as.state} before preparation completed` );
						}
					}
					debug( `${fn}: Prepared (END SYNC)` );
				},
				0,
			);
		} else {  //  AbortableAlternatePrep, nonstandard possibly-synchronous preparation
			debug( `${fn}: Alternate Prep` );
			switch( prep.state ) {
				case "succeded": this._ac.success( prep.value ); break;
				case "failed":   this._ac.failure( prep.value ); break;
				case "aborted":  this._as.doAbort( prep.value ); break;
				default: this._ac.failure( new Error( `${fn}: Invalid parameter to constructor` ) ); break;
			}
		}
	}
	/** Gets the current state of the task represented by this {@link Abortable} */
	public get state() { return this._as.state; }
	/** Gets the label of this {@link Abortable} (for logging and debugging) */
	public get label() { return `Abortable<${this._as.timeCreated.toFixed(3)}-${this._as.suffix}:${this.state.padEnd(12)}>`; }  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  0-padding makes logs more readable
	// public get warntime(): number|undefined; {...}; // TODO
	// public set warntime( interval:number|undefined ):Abortable<T> {...};
	// public get warnfn() {...};
	/**
	 * Start the asynchronous process represented by this {@link Abortable}
	 * - Starts task if it hasn't started yet
	 * - Does nothing if task is running
	 * - Throws if task has settled
	 * @returns self
	 */
	public start(): Abortable<T> {
		switch( this._as.state ) {
			case "constructing":
				throw new Error( `Cannot start while still ${this._as.state}` ); // TODO: start on completion of construction
			case "ready":
				if( "function" === typeof this._starter ) {
					const starter = this._starter;
					setTimeout( // use setTimeout to make the start asynchronous // TODO: preserve stack trace by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous break
						() => {
							starter(this._ac); // TODO: exception handling
						},
						0,
					);
					delete this._starter;
				}
				this._as.start();
				break;
			case "running": case "paused": case "idle":
				break; // nothing to do - already started
			case "succeded": case "failed": case "aborted":
				throw new Error( `Cannot start after settled (${this._as.state})` );
			default:
				throw new Error( `Cannot start from invalid state (${this._as.state})` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
		}
		return this;
	}
	/**
	 * Pause the asynchronous process represented by this {@link Abortable}
	 * - Pauses task if it's running or idle
	 * - Does nothing if task is paused
	 * - Throws if task hasn't started or has settled
	 * Pausing depends on the task cooperating by occasionally yielding to other asynchronous tasks
	 * (cooperative-multitasking-style)
	 * @returns self
	 */
	public pause(): Abortable<T> { // change state from running to paused
		switch( this._as.state ) {
			case "constructing":
				throw new Error( `Cannot pause while still ${this._as.state}` ); // TODO: pause on completion of construction
			case "ready":
				throw new Error( "Cannot pause while before starting" );
			case "running": case "idle": // TODO: when idle, cancel resume from idle timeout
				this._as.pause(); // the difference is in idling and running
				break;
			case "paused":
				break; // nothing to do
			case "succeded": case "failed": case "aborted":
				throw new Error( `Cannot pause after settled (${this._as.state})` );
			default:
				throw new Error( `Cannot pause from invalid state (${this._as.state})` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
		}
		return this;
	}
	/**
	 * Resume the asynchronous process represented by this {@link Abortable}
	 * - Resumes task if it's paused or idle
	 * - Does nothing if task is running
	 * - Throws if task hasn't started or has settled
	 * @returns self
	 */
	public resume():Abortable<T> {
		switch( this._as.state ) {
			case "constructing":
				throw new Error( `Cannot resume while still ${this._as.state}` );
			case "ready":
				throw new Error( "Cannot resume while before starting" );
			case "paused": case "idle": // TODO: when paused from idle, restore idle timeout?
				if( this._starter ) {
					const fn = this._starter;
					setTimeout( // use setTimeout to make the result asynchronous // TODO: preserve stack trace by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous break
						() => {
							(fn as (ac:AbortableController<T>)=>void)( this._ac ); // TODO: exception handling
						},
						0,
					);
					delete this._starter;
				}
				this._as.resume(); // the difference is in idling and running
				break;
			case "running":
				break; // nothing to do
			case "succeded": case "failed": case "aborted": default:
				throw new Error( `Cannot resume after settled (${this._as.state})` );
		}
		return this;
	}
	/**
	 * Abort the asynchronous process represented by this {@link Abortable}
	 * - Aborts task if it's ready, running, paused, or idle
	 * - Does nothing if task is already aborted
	 * - Throws if task has settled
	 * Aborting depends on the task cooperating by occasionally yielding to other asynchronous tasks
	 * (cooperative-multitasking-style)
	 * @returns self
	 */
	public abort( message?: string ):Abortable<T> {
		switch( this._as.state ) {
			case "constructing": // TODO: abort on completion of construction?
			case "ready": case "paused": case "idle":
				this._as.setReason( message );
				if( this._as.aborter ) { this._as.aborter( message, this._ac ); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
				break;
			case "running":
				this._as.setReason( message );
				// TODO: wait for idle state to invoke aborter
				if( this._as.aborter ) { this._as.aborter( message, this._ac ); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
				break;
			case "aborted":
				break; // nothing to do
			case "succeded": case "failed":
				throw new Error( `Cannot abort after settled (${this._as.state})` );
			default:
				throw new Error( `Cannot abort from invalid state (${this._as.state})` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
		}
		return this;
	}
	/**
	 * Attaches a callback to be invoked when the task represented by this {@link Abortable} succedes
	 * @returns An abortable representing both the prior task and the callback as a single task
	 */
	public then<TResult1=T,TResult2=never>( // TODO: allow passing an Abortable which will be started after this one
		onSuccess?: AbortableCallbackSuccess<T,TResult1> | undefined | null,
		onFailure?: AbortableCallbackFailure<T,TResult2> | undefined | null,
		onAbort?:   AbortableCallbackAbort<    TResult1> | undefined | null,
	): Abortable<TResult1|TResult2> { // TODO: allow success, failure, and abort to return different types
		const fn = `${this.label}.then`;
		debug( `${fn}: Invoked in state ${this._as.state}` );
		let r: Abortable<TResult1|TResult2>;
		switch( this._as.state ) {
			case "constructing": case "ready": case "running": case "paused": case "idle": {
				r = new Abortable<TResult1|TResult2>( (_ac2) => ( {
					starter: nullStarter<TResult1|TResult2>(),
					aborter: ( (message,_ac3) => { this.abort( message ); } ),  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
				} ) );
				const ac: AbortableController<TResult1|TResult2> = r._as.ac;
				this._as.onSuccess.push(
					"function" === typeof onSuccess
						? (result:T) => {
							debug( `${fn}/onSuccess: chaining via success callback with result`, result );
							AbortableShared.chainHelper<TResult1|TResult2>( () => onSuccess(result), ac );
						}
						: (result:T) => {
							debug( `${fn}/onSuccess: chaining directly with result`, result );
							ac.success( result as unknown as TResult1 ); // if callback is missing, this is a reinterpret-cast
						},
				);
				this._as.onFailure.push(
					"function" === typeof onFailure
						? (error:Error) => { AbortableShared.chainHelper<TResult1|TResult2>( () => onFailure(error), ac ); }
						: (error:Error) => { ac.failure( error ); }, // if callback is missing, this is a reinterpret-cast
				);
				this._as.onAbort.push(
					"function" === typeof onAbort
						? (reason:string) => { AbortableShared.chainHelper<TResult1|TResult2>( () => onAbort(reason), ac ); }
						: (reason:string) => { r.abort( reason ); },  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting
				);
				if( "running" === this.state ) { r.start(); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  start returns self, doesn't need additional error handling  //  TODO: propagate all state changes from this to r
				break;
			}
			case "succeded":
				if( "function" === typeof onSuccess ) {
					// r = AbortableShared.prepHelper<TResult>( () => onSuccess(this._as.result as T) ); // state "succeded" implies _as.result is set
					r = new Abortable<TResult1|TResult2>( (ac2) => {
						setTimeout( () => ac2.success( onSuccess(this._as.result as T) ), 0 );
						return nullPrepared<TResult1|TResult2>();
					} ); // state "succeded" implies _as.result is set
				} else {
					// const prep: AbortableAlternatePrep<TResult> = { state: "succeded", value: this._as.result as {} as TResult }; // if callback is missing, this is a reinterpret-cast
					// r = new Abortable( prep as {} as AbortablePreparer<TResult> );
					r = new Abortable<TResult1|TResult2>( (ac2) => ac2.success( this._as.result as unknown as TResult1 ) ); // if callback is missing, this is a reinterpret-cast // state "succeded" implies _as.result is a TResult1
				}
				break;
			case "failed":
				if( "function" === typeof onFailure ) {
					// r = AbortableShared.prepHelper<TResult>( () => onFailure(this._as.error as Error) ); // state "failed" implies _as.error is set
					r = new Abortable<TResult1|TResult2>( (ac2) => {
						setTimeout( () => ac2.success( onFailure(this._as.error as Error) ), 0 ); // state "failed" implies _as.error is set
						return nullPrepared<TResult1|TResult2>();
					} );
				} else {
					// const prep: AbortableAlternatePrep<TResult> = { state: "failed", value: this._as.error as Error }; // state "failed" implies _as.error is set
					// r = new Abortable( prep as {} as AbortablePreparer<TResult> );
					r = new Abortable<TResult1|TResult2>( (ac2) => ac2.failure( this._as.error as Error) ); // state "failed" implies _as.error is set
				}
				break;
			case "aborted":
				if( "function" === typeof onAbort ) {
					// r = AbortableShared.prepHelper<TResult>( () => onAbort(this._as.reason as string) ); // state "aborted" implies _as.reason is set
					r = new Abortable<TResult1|TResult2>( (ac2) => {
						setTimeout( () => ac2.success( onAbort(this._as.reason as string) ), 0 ); // state "aborted" implies _as.reason is set
						return nullPrepared<TResult1|TResult2>();
					} );
				} else {
					// const prep: AbortableAlternatePrep<TResult> = { state: "aborted", value: this._as.reason as string }; // state "aborted" implies _as.reason is set
					// r = new Abortable( prep as {} as AbortablePreparer<TResult> );
					r = new Abortable<TResult1|TResult2>( () => { r.abort( this._as.reason ); return; } );  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  Abortable can't fail after aborting  //  state "aborted" implies _as.reason is set
				}
				break;
			default: throw new Error( `Settled in invalid state ${this._as.state}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
		}
		debug( `${fn}( ${typeof onSuccess}, ${typeof onFailure}, ${typeof onAbort} ) => ${r.label}` );
		return r;
	}
	/**
	 * Attaches a callback to be invoked when the task represented by this {@link Abortable} fails
	 * @returns An abortable representing both the prior task and the callback as a single task
	 */
	public catch<TResult2=T>(
		onFailure?: AbortableCallbackFailure<T,TResult2> | undefined | null,
		onAbort?:   AbortableCallbackAbort<  T         > | undefined | null,
	): Abortable<TResult2|T> { // TODO: break from promise spec and return strictly Abortable<TResult>
		return this.then<T,TResult2>( undefined, onFailure, onAbort );  //  eslint-disable-line no-undefined  --  use undefined for currying
	}
	/**
	 * Attaches a callback to be invoked when the task represented by this {@link Abortable} is aborted
	 * @returns An abortable representing both the prior task and the callback as a single task
	 */
	public aborted<TResult>(
		onAbort?:   AbortableCallbackAbort<    TResult> | undefined | null,
	): Abortable<TResult> {
		return this.then<TResult>( undefined, undefined, onAbort );  //  eslint-disable-line no-undefined  --  use undefined for currying
	} // TODO: attach callback to abort
	/**
	 * Attaches a callback to be invoked when the task represented by this {@link Abortable} is settled.
	 * This callback can only affect the settled value of the resulting {@link Abortable} by throwing an error
	 * @returns An abortable representing both the prior task and the callback as a single task,
	 * which settles to the same result as the prior task.
	 */
	public finally( onfinally?:(()=>void)|undefined|null ):Abortable<T> {throw new Error(`UNIMPLEMENTED${this}${onfinally}`);}  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message  //  TODO: attach callback to settle
	/**
	 * Attaches a callback to be invoked when the task represented by this {@link Abortable} is settled.
	 * @returns An abortable representing both the prior task and the callback as a single task
	 */
	public ensure<U=T>( onensure?:((error?:Error|undefined,result?:T|undefined,message?:string|undefined)=>U|Abortable<U>)|undefined|null ):Abortable<U> {
		throw new Error(`UNIMPLEMENTED${this}${onensure}`);  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
	} // TODO: attach callback to settle
}


/**
 * Variant of {@link Abortable} which is started on construction and take a Promise-compatible executor function
 */
export class AbortablePrestart<T> extends Abortable<T> {

	/** For compatibility with PromiseConstructor */
	public static get [Symbol.species]() { return AbortablePrestart; }

	public constructor( executor: AbortablePrestartPreparer<T> ) {
		const prep: AbortablePreparer<T> = () => {
			const prestartStarter: AbortableStarter<T> = () => { throw new Error( `UNIMPLEMENTED: prestartStarter for ${executor}` ); };  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
			const prestartAborter: AbortableAborter<T> = () => { throw new Error( `UNIMPLEMENTED: prestartAborter for ${executor}` ); };  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
			const p: AbortablePrepared<T> = {
				starter: prestartStarter,
				aborter: prestartAborter,
			};
			return p;
		};
		super( prep );
		// const fn = this.constructor.name + "#constructor";
		this.start();  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  start returns self, doesn't need additional error handling
	}

}

/**
 * Controller used within the asynchronous task represented by an Abortable
 */
export class AbortableController<T> {
	/** Shared state used both here and by the {@link Abortable} */
	private readonly _as:AbortableShared<T>;
	/** Number of thenables passed to {@link success} */
	private _thenCount = 0;
	/** Do not construct these directly */
	public constructor( init?: AbortableShared<T> ) {
		if( ( init instanceof AbortableShared ) && ( "undefined" === typeof init.result ) ) {
			this._as = init;
		} else {
			throw new Error( `Invalid construction for ${this.constructor.name} - do not construct these directly` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
		}
	}
	/** Gets the label of this {@link Abortable} (for logging and debugging) */
	public get label() { return `Abortable<${this._as.timeCreated.toFixed(3)}-${this._as.suffix}:${this._as.state.padEnd(12)}>Controller`; }  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  0-padding makes logs more readable
	/** Settle this {@link Abortable} to success (a second call will throw) */
	public success( result: T | PromiseLike<T> ): void { // TODO: make this never return
		const fn = `${this.label}.success`;
		debug( `${fn}: Invoked in state ${this._as.state} with result `, result );
		switch( this._as.state ) {
			case "constructing": case "ready": case "running": case "paused": case "idle": // pending states - ok to move to settled state
				if( result === this as unknown as PromiseLike<T> || result === this._as.a ) { // no promise chain recursion
					debug( `${fn}: succeed with self -- TypeError` );
					this.failure( new TypeError( "Promise chain recursion prohibited" ) );
				} else {
					let result_then: typeof Abortable.prototype.then | undefined;
					try {
						result_then = Helpers.thenIfThenable( result ) as typeof Abortable.prototype.then | undefined; // hook from promises-aplus-tests, which counts how many times then is retrieved
					} catch(e) {
						// debug( `${fn}: ignoring error checking for thenability of result (treating as non-thenable) -- ${e}` ); // TODO: break from promise spec and break chain rather than changing result of this link
						debug( `${fn}: error thrown from checking for thenability of result -- ${e}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
						this.failure( e as Error ); // TODO: break from promise spec and enforce Error class rather than reinterpret-cast-ing
					}
					if( "undefined" === typeof result_then ) {  //  result isn't thenable, this is actually resolved now
						debug( `${fn}: settling to success -- `, result );
						this._as.setResult( result as T );
					} else {  //  result is thenable, this is not resolved yet but waiting on new PromiseLike
						this._thenCount += 1;
						const thenNum = this._thenCount;
						const thenFn: typeof Abortable.prototype.then = result_then;
						debug( `${fn}: chain success to Thenable #${thenNum} -- (${typeof result})`, result, "--", result_then );
						setTimeout(  //  TODO: replace use of setTimeout to make a block asynchronous with Helpers.asyncMacro; update asyncMacro to preserve stack trace (maybe by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous branch)
							() => {
								debug( `${fn}: chain success to Thenable #${thenNum} (NEW SYNC)` );
								Helpers.tryCatchElseFinally( () => { // try
									thenFn( (res:T) => {  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  TODO: false positive
										debug( `${fn}: Thenable #${thenNum} settled to success` );
										this.success(res);
									}, (err:Error) => {
										debug( `${fn}: Thenable #${thenNum} settled to failure` );
										this.failure(err);
									}, (rsn:string) => {
										debug( `${fn}: Thenable #${thenNum} settled to abort` );
										this._as.doAbort(rsn);
									} );
								}, (e) => { // catch
									console.error( `${fn}: next Thenable threw when connecting chain -- `, e );  //  eslint-disable-line no-console  --  TODO: better testing for this edge case
									// this._as.setResult( result as T ); // TODO: break from promise spec and break chain rather than changing result of this link
									this.failure( e as Error ); // TODO: break from promise spec and enforce Error class rather than reinterpret-cast-ing
								}, () => { // else
									const _catch = Helpers.catchIfCatchable( result ); // following the same pattern as then
									if( _catch ) { // failure still possible
										// _catch( (err:Error) => { this.failure(err); }, (rsn:string) => { this._as.doAbort(rsn); } );
										const aborted = Helpers.abortedIfAbortedable( result ); // following the same pattern as then // TODO: exception handling
										if( aborted ) { // failure still possible
											// aborted( (rsn:string ) => { this._as.doAbort(rsn); } );
										} else { this._as.lostAbort = true; }
									} else { this._as.lostFailure = true; this._as.lostAbort = true; }
								} );
								debug( `${fn}: chain success to next Thenable (END SYNC)` );
							},
							0,
						);
					}
				}
				break;
			case "succeded":
				// if( result !== this._as.result ) { throw new Error( "Abortable made multiple calls to success with different results" ); } // TODO: break from promise spec and throw
				console.error( `${fn}: Abortable made multiple calls to success with different results` );  //  eslint-disable-line no-console  --  TODO: better testing for this edge case
				break;
			default:
				// throw new Error( "Abortable attempted to change state to succeded after changing state to "+this._as.state ); // TODO: break from promise spec and throw
				console.error( `${fn}: Abortable attempted to change state to succeded after changing state to ${this._as.state}` );  //  eslint-disable-line no-console  --  TODO: better testing for this edge case
				break;
		}
	}
	/** Promise-nomenclature alias to {@link success} */
	public resolve( result:T ):void {this.success(result);}
	/** Settle this {@link Abortable} to failure (a second call will throw) */
	public failure( error:Error ):void { // TODO: make this never return
		const fn = `${this.label}.failure`;
		switch( this._as.state ) {
			case "constructing": case "ready": case "running": case "paused": case "idle": // pending states - ok to move to settled state
				this._as.setError( error );
				debug( `${fn}: settled to failure; ${this._as.onFailure.length} callbacks (END SYNC)` );
				setTimeout( // use setTimeout to make the settling asynchronous // TODO: preserve stack trace by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous break
					() => {
						while( this._as.onFailure.length > 0 ) {
							debug( `${fn}: invoking failure callback; ${this._as.onFailure.length} callbacks` );
							(this._as.onFailure.shift() as (_error: Error) => void)( error ); // when length > 0 shift does not return null
						}
					},
					0,
				);
				break;
			case "failed":
				if( error !== this._as.error ) { throw new Error( "Abortable made multiple calls to failure with different errors" ); }
				break;
			default:
				// throw new Error( "Abortable attempted to change state to failed after changing state to "+this._as.state ); // TODO: break from promise spec and throw
				console.error( `${fn}: Abortable attempted to change state to failed after changing state to ${this._as.state}` );  //  eslint-disable-line no-console  --  TODO: better testing for this edge case
				break;
		}
	}
	/** Promise-nomenclature alias to {@link failure} */
	public reject( error:Error ):void {this.failure(error);}
	// call to idle asynchronously; abort prevents resolution
	/** Yield to other asynchronous tasks, for a minimum duration or until resumed; never resolves if this {@link Abortable} is {@link abort}ed. */
	public async idle( seconds:number ):Promise<void> { await Abortable.reject( new Error( `UNIMPLEMENTED ${this} ${seconds}` ) ); }  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message  //  TODO: UNIMPLEMENTED
	// call to set next function to run after idle; abort prevents call to next
	// public idle( seconds:number, next:((ac:AbortableController<T>)=>T|Abortable<T>)|undefined ):Promise<void> {throw "UNIMPLEMENTED"};
	// TODO: support idling by use of generator function? - see e.g. https://thejsguy.com/2016/10/15/a-practical-introduction-to-es6-generator-functions.html
	/** Set abort cleanup handler, invoked when this {@link Abortable} is {@link abort}ed; only one can be set at any time, and it can be changed at any time */
	public aborter( onabort:(message:string|undefined,ac:AbortableController<T>)=>void|Promise<void> ) { throw new Error( `UNIMPLEMENTED ${this} ${onabort}` ); }  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message  //  TODO: use setter
}

/**
 * Internal shared state used internally by {@link Abortable} and {@link AbortableController}, but not exposed by either
 */
class AbortableShared<T> {

	/** Handle possible success from callbacks */
	public static chainHelper<U>( cb: ()=>U|PromiseLike<U>, acTo: AbortableController<U> ): void {
		const fn = `${acTo.label}\\chainHelper`;
		debug( `${fn}: Invoked` );
		try {
			const result = cb();
			debug( `${fn}: result =`, result );
			acTo.success( result );
		} catch( err ) {
			debug( `${fn}: failure in callback -- `, err );
			acTo.failure( err as Error ); // TODO: break from promise spec and convert to error: acTo.failure( Helpers.errorChain( err ) );
		}
	}
	/** Set initial state from callback */
	public static prepHelper<U>( cb: ()=>U|PromiseLike<U> ): Abortable<U> {
		const fn = `${this.name}.prepHelper`;
		try {
			const value: U | PromiseLike<U> = cb();
			debug( `${fn}: success in callback` );
			return Abortable.success( value );
		} catch( err ) {
			debug( `${fn}: failure in callback -- ${err}` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  accept any type when including value in error message
			return Abortable.failure( err as Error ); // TODO: break from promise spec and convert to error
		}
	}

	/** This {@link Abortable} */
	public readonly a: Abortable<T>; // in constructor
	/** The {@link AbortableController} for this {@link Abortable} */
	public readonly ac: AbortableController<T> = new AbortableController( this );
	/** Callbacks to invoke if and when this {@link Abortable} succedes, including those added with [[Abortable#then]] */
	public readonly onSuccess = new Array<(result:T)=>void>();
	/** Callbacks to invoke if and when this {@link Abortable} fails, including those added with [[Abortable#catch]] */
	public readonly onFailure = new Array<(error:Error)=>void>();
	/** Callbacks to invoke if and when this {@link Abortable} is aborted, including those added with [[Abortable#aborted]] */
	public readonly onAbort = new Array<(reason:string)=>void>();
	/** Function that aborts the task (returned by callback to constructor) */
	public aborter: AbortableAborter<T> | undefined; // TODO: not settable once invoked
	/** True when result will come from a non-abortable PromiseLike */
	public lostAbort = false;
	/** True when result will come from a non-catchable PromiseLike */
	public lostFailure = false;
	/** Approximates, with suffix, a unique id for debugging */ // TODO: also use for timings
	public readonly timeCreated: number = Helpers.unixTime();
	/** Approximates, with timeCreated, a unique id for debugging */ // TODO: also use for timings
	public readonly suffix: string = nextSuffix();
	/** Current state of this {@link Abortable} */
	private _state: AbortableState = "constructing"; // TODO: use enum
	/** Result generated if and when this {@link Abortable} succedes */
	private _result: T | undefined; // set when state becomes "succeded"
	/** Cause of failure, when applicable */
	private _error: Error | undefined; // set when state becomes "failed"
	/** Reason for abort, when applicable */
	private _reason: string | undefined; // set when state becomes "aborted"

	public constructor( a: Abortable<T> ) { this.a = a; }

	/** Gets the label of this [[AbortableShared]] (for logging and debugging) */
	public get label() { return `Abortable<${this.timeCreated.toFixed(3)}-${this.suffix}:${this.state.padEnd(12)}>Shared`; } // eslint-disable-line @typescript-eslint/no-magic-numbers  --  0-padding makes logs more readable
	/** Current state of this {@link Abortable} */
	public get state(): AbortableState { return this._state; }
	/** Result generated if and when this {@link Abortable} succedes */
	public get result(): T | undefined { return this._result; }
	/** Cause of failure, when applicable */
	public get error(): Error | undefined { return this._error; }
	/** Reason for abort, when applicable */
	public get reason(): string | undefined { return this._reason; }

	/** STUB, change state from constructing to ready */
	public setPrepared( r: AbortablePrepared<T> ): void {
		// TODO: validation
		this.aborter = r.aborter;
		this._state = "ready";
	}
	/** STUB, change state from ready to running */
	public start(): void {
		// TODO: validation
		this._state = "running";
	}
	/** STUB, change state from running to paused */
	public pause(): void {
		// TODO: validation
		this._state = "paused";
	}
	/** STUB, change state from paused to running */
	public resume(): void {
		// TODO: validation
		this._state = "running";
	}

	/** Abort this {@link Abortable} (used in {@link AbortableController}) */
	public doAbort( reason?: string ) { this.a.abort( reason ); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  doAbort returns self, doesn't need additional error handling

	/** Sets the success result (called upon success) */
	public setResult( result: T ) {
		const fn = `${this.label}.setResult"`;
		debug( `${fn}: Invoked with result`, result );
		this._state = "succeded";
		this._result = result;
		debug( `${fn}: settled to success; ${this.onSuccess.length} callbacks` );
		if( this.onSuccess.length > 0 ) {
			debug( `${fn}: invoking success callbacks in separate sync` );
			setTimeout( // use setTimeout to make the settling asynchronous // TODO: preserve stack trace by doing something rediculous like setting up a context where Error is replaced with a wrapper that backfills the stack from before the asyncronous break
				() => {
					debug( `${fn}: invoking success callbacks (NEW SYNC)` );
					for( let h = 0; h < this.onSuccess.length; h++ ) {
						const i = h; // preserve value in closure
						const onSuccess = this.onSuccess.shift();
						if( "undefined" === typeof onSuccess ) {
							debug( `${fn}:  success callback ${i} is undefined -- not invoking` );
						} else {
							let t: unknown;
							try {
								debug( `${fn}: invoking success callback ${i} with result`, result );
								t = onSuccess( result ) as unknown; // eslint-disable-line @typescript-eslint/no-confusing-void-expression  --  TODO: this rule shouldn't catch explicit casts
							} catch(e) {
								debug( `${fn}:  success callback ${i} threw -- `, e );
							}
							if( "undefined" !== typeof t ) {
								debug( `${fn}:  success callback ${i} returned -- `, t );
							}
							// debug( `${fn}: done with success callback ${i}` );
						}
					}
					debug( `${fn}: ${this.onSuccess.length} success callbacks remaining (END SYNC)` );
				},
				0,
			);
		}
	}

	/** Sets the failure error (called upon failure) */
	public setError( err: Error ): void {
		// TODO: validation
		this._state = "failed";
		this._error = err;
	}

	/** Sets the abort reason (called upon abort) */
	public setReason( rsn?: string ): void {
		// TODO: validation
		this._state = "aborted";
		this._reason = rsn;
	}
}

// TODO: do something if invoked directly
