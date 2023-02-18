import * as debugFactory from "debug";  //  eslint-disable-line import/order  --  TODO: import/order option for conventions about specific imports
const debug: debugFactory.IDebugger = debugFactory( "Helpers" );  //  eslint-disable-line @typescript-eslint/naming-convention -- use lowercase "debug" consistent with widespread convention

import { ChildProcess, fork as forkProcess, ForkOptions, spawn as spawnProcess, SpawnOptionsWithoutStdio } from "child_process";
import { hostname } from "os";

import { caller } from "caller";
import { readFile, remove as removeFile, rmdir as removeDir, writeFile } from "fs-extra";
import { Moment, unix as unixMoment } from "moment";
import { lock as properLock, ReleaseFn } from "proper-lockfile";

import { AbortableThen, AbortableAborted } from "./Abortable";

/** Common name apparently removed from stdlib */
export interface Thenable<T> {  //  eslint-disable-line @typescript-eslint/naming-convention  --  No "I" prefix for widely used name
	/** The only required property of a Thenable */
	then: <TResult1 = T, TResult2 = never>(
		onfulfilled?: ( ( value: T  ) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?:  ( (reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  TODO: figure out how to type rejections
	) => Promise<TResult1 | TResult2>;
}

/** My personal "personal quirks" idiomatic miscellanious helper collection */
export class Helpers {  //  eslint-disable-line @typescript-eslint/no-extraneous-class  --  TODO: is there a better way to do this now?
	/** MacroTasks run from a FIFO queue, when queue is empty program ends */
	public static asyncMacro( task: ()=>void ) {
		// const preserve = new Error( "-=-=-=-=-=-=- MacroTask Branchpoint -=-=-=-=-=-=-" );
		setTimeout( () => {
			try {  //  eslint-disable-line no-useless-catch  --  TODO: update errorChain to combine stack traces
				task();
			} catch(e) {
				// e = this.errorChain( e, preserve ) // TODO: update errorChain to combine stack traces
				throw e;  //  eslint-disable-line @typescript-eslint/no-throw-literal  --  TODO: update errorChain to combine stack traces
			}
		} , 0 ); // TODO: args; take <T> as argtype?
	}
	/** MicroTasks run from a FIFO queue, when queue is empty next MacroTask runs */
	public static asyncMicro( task: ()=>void ) { // TODO: preserve stack traces
		Promise.resolve().then( task );  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  TODO: what should default catch do?  //  TODO: args; take <T> as argtype?
	}
	/** Insert the elements of one array into another array */
	public static arrayInsertArray<T=any>( into:T[], elms:readonly T[], start:number ): T[] {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default  //  TODO: option to put result in new array
		let i: number;
		let j: number;
		for( i = into.length-1; i >= start; i-- ) {
			j = i + elms.length;
			into[j] = into[i];  //  eslint-disable-line no-param-reassign  --  this method is meant to edit into in-place
		}
		for( i = 0; i < elms.length; i++ ) {
			j = start + i;
			into[j] = elms[i];  //  eslint-disable-line no-param-reassign  --  this method is meant to edit into in-place
		}
		return into;
	}
	/** Generic asynchronous construction */
	public static async asyncNew<T=any>( asyncClass:any, ...args:any[] ): Promise<T> { // eslint-disable-line @typescript-eslint/no-explicit-any  --  TODO: get rid of any when typescript supports typed rest parameters // TODO: replace this with an implementable interface
		return await (new asyncClass(...args)).asyncContructor;  //  eslint-disable-line @typescript-eslint/no-unsafe-return,no-return-await,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  --  TODO: check that asyncClass is newable and has asyncConstructor; use await to return derived promise  //  TODO: constant for identity function?
	}
	/** Convert dates to unixtimes */
	public static unixTime( d?:Date|string ): number { return ( "undefined" !== typeof d ? ( (d instanceof Date) ? d.getTime() : Date.parse(d) ) : Date.now() ) / 1000; }  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  1000 is the ratio between unixtime and javascript time  //  TODO: unixtime as a type?
	/** As close as javascript gets to the common `sleep` function, but with the option to sleep until a given time, and the option to cancel */
	public static async idle( d: number|Date|string = 0, callback?: (canceler:()=>void) => void ): Promise<boolean> { // TODO: return an Abortable
		let timer: NodeJS.Timer | undefined;
		let _resolve: (finished:boolean) => void;
		// let _reject: Function;
		const r: Promise<boolean> = new Promise<boolean>( (resolve,/*reject*/) => { _resolve = resolve; /*_reject = reject;*/ } );
		let timeout: number;
		const finished: ()=>void = () => {
			// console.log( "Idle Time Finished" );
			_resolve(true);
		};
		if( "number" === typeof d ) {
			if( d <= this.unixTime() ) { // it's a duration // TODO: compare to TIMEOUT_MAX, which should be defined as (2^32)-1
				timeout = d*1000;  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  1000 is the ratio between unixtime and javascript time  //  TODO: move magic number to a readonly property?
			} else { // it's a time // TODO: refuse to idle into the past
				timeout = d*1000 - Date.now();  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  1000 is the ratio between unixtime and javascript time  //  TODO: move magic number to a readonly property?
			}
		} else if( d instanceof Date ) {
			timeout = d.getTime() - Date.now();
		} else {
			timeout = Date.parse(d) - Date.now();
		}
		timer = setTimeout( finished, timeout );
		if( callback ) {
			const canceler: ()=>void = () => {
				_resolve(false);
				if( timer ) { clearTimeout( timer ); timer = undefined; }  //  eslint-disable-line no-undefined  --  explicitly clear the timer
			};
			callback( canceler );
		}
		return r;
	}
	/** As close as javascript gets to the common `sleep` function (this one can't be cancelled) */
	public static async idleFor( s = 0 ): Promise<void> { return new Promise<void>( (resolve) => setTimeout( resolve, s*1000 ) ); }  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  1000 is the ratio between unixtime and javascript time  //  TODO: move magic number to a readonly property?
	/** As close as javascript gets to a `sleep_until` function (this one can't be cancelled) */
	public static async idleUntil( u: number|Date|string ): Promise<void> { // TODO: return an Abortable // TODO: unixtime type?
		let v: number;
		if( "number" === typeof u ) {
			v = u*1000;  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  1000 is the ratio between unixtime and javascript time  //  TODO: move magic number to a readonly property?
		} else if( u instanceof Date ) {
			v = u.getTime();
		} else {
			v = Date.parse(u);
		}
		await this.idleFor( v - this.unixTime() );
		return;
	}
	/** repeat a test at some time interval until timeout or test passes */
	public static async poll( timeout: number, interval: number, test:()=>Promise<boolean> ): Promise<boolean> {
		// let fn: string = "Helpers.poll";
		const start = this.unixTime();
		const stop = start + timeout;
		// console.log( "Polling every "+interval+" from "+this.humanTime(start)+" to "+this.humanTime(stop) );
		while( true ) {  //  eslint-disable-line no-constant-condition  --  pollin is an infinite loop  //  TODO: use setInterval?
			if( await test() ) { return true; }
			// console.log( "POLL test failed" );
			if( this.unixTime() > stop ) { break; }
			// console.log( "POLL timeout not reached" );
			await this.idle( interval ); // TODO: ensure idle will take this as an interval; make a function for that?
		}
		if( await test() ) { return true; }
		// console.log( "POLL timed out" );
		return false;
	}
	/** Convert an object to multiline JSON, optionally excluding specified keys */
	public static JSONify( obj: any, options: any = {}, _console?: Console ) {  //  eslint-disable-line @typescript-eslint/naming-convention,@typescript-eslint/no-explicit-any  --  keep "JSON" all caps; JSON can come from any type  // TODO: type for options & options.exclude
		const fn = "Helpers.JSONify";
		if( _console ) { _console.log( `${fn}: options = `, options ); }
		return JSON.stringify(
			obj,
			( ("undefined" !== typeof options) && ("undefined" !== typeof options.exclude) ) ? (key,value) => {  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  not actually unsafe when reciever is not undefined  //  TODO: types for options & options.exclude
				const exclude: boolean = (
					("undefined" !== typeof options)
					&& ("undefined" !== typeof options.exclude)  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  not actually unsafe when reciever is not undefined  //  TODO: types for options & options.exclude
					&& (
						( ("string" === typeof options.exclude) && (options.exclude === key) )        //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  not actually unsafe when reciever is not undefined  //  TODO: types for options & options.exclude
						|| ( (options.exclude instanceof Array) && !!options.exclude.includes(key) )  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/strict-boolean-expressions  --  not actually unsafe when reciever is an Array  //  TODO: types for options & options.exclude
						|| (!!options.exclude.key)                                                    //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions  --  not actually unsafe when reciever is not undefined  //  TODO: types for options & options.exclude
					)
				);
				if( exclude ) {
					if( _console ) { _console.log( `${fn}/replacer: EXCLUDING key (${typeof key}) ${key}` ); }
					return undefined;  //  eslint-disable-line no-undefined  --  use undefined for excluded keys
				}
				if( _console ) { _console.log( `${fn}/replacer: including key (${typeof key}) ${key}` ); }
				return value;  //  eslint-disable-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return  --  JSON can come from any type
			} : undefined,  //  eslint-disable-line no-undefined  --  use undefined for no filtering
			"\t",
		);
	}
	/** Get a unixTime, Date or parsable time string in a human-readable format */
	public static humanTime( time?: number | Date | string ): string {
		const u: number = "undefined" === typeof time
			? this.unixTime()
			: "number" === typeof time
				? time
				: time instanceof Date
					? time.getTime()/1000  //  eslint-disable-line @typescript-eslint/no-magic-numbers  --  1000 is the ratio between unixtime and javascript time  //  TODO: unixtime as a type? Use unixtime conversion method here?
					: Date.parse(time);
		const m: Moment = unixMoment( u );
		const r: string = m.format( "YYYY-MMM-DD HH:mm:ss.SSSSSS Z" );
		return r;
	}
	/**
	 * Ensures an Error object and adds a prefix to the error message; useful for tracing errors through promise chains
	 * @param error {any} The caught error to prepend the messagePrefix to
	 */
	public static errorChain( error: unknown, messagePrefix?: string ): Error {
		const err: Error = error instanceof Error ? error : "object" === typeof error ? new Error( this.JSONify( error ) ) : new Error( error as string ); // all primitives are reasonably convertable to string // TODO: include class name from tostring as well as JSONify?
		if( "" === err.message ) {
			err.message = "(Empty message)";
		} else if( "undefined" === typeof err.message ) {  //  eslint-disable-line @typescript-eslint/tslint/config  --  being cautious and testing for conditions that shouldn't happen
			err.message = "(No message)";
		}
		if( "undefined" !== typeof messagePrefix ) { err.message = `${messagePrefix} -- ${err.message}`; }
		return err;
	}
	/** Fork a daemon process to run in the background, with no direct communication to this process */
	public static forkDaemon( env: typeof process.env, cwd: string, args: string[] ): ChildProcess {
		const opts: ForkOptions = {
			cwd: cwd,
			detached: true, // types exclude detatched, but fork call honors it; see https://github.com/nodejs/node/issues/17592
			env: env,
			stdio: "ignore", // types exclude string (and errs with array of ignore), but fork call honors it
		};
		const moduleName = caller();
		// console.log( "Forking with ", { moduleName: moduleName, args: args, opts: opts } );
		const daemon = forkProcess( moduleName, args, opts );
		daemon.unref();
		return daemon;
	}
	/** Get output from external command (what backticks do in many languages) */
	public static async backtick( command: string, args: string[] = [], options: any = {} ): Promise<BacktickResult> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  TODO: type for options; superset of SpawnOptions?
		const fn = "Helpers.backtick";
		return new Promise<BacktickResult>( (resolve,reject) => {
			(async () => {  //  eslint-disable-line @typescript-eslint/require-await  --  TODO: review this design
				try {
					let opts: SpawnOptionsWithoutStdio = {};  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  TODO: type for options; copy constructor here
					let input = "";
					if( "undefined" === typeof options ) {
						if( "undefined" !== typeof args ) {  //  eslint-disable-line @typescript-eslint/tslint/config  --  being cautious and testing for conditions that shouldn't happen
							if( args.length > 1 && "object" === typeof args[args.length-1] ) {  //  eslint-disable-line @typescript-eslint/tslint/config  --  being cautious and testing for conditions that shouldn't happen  //  TODO: if args isn't a rest parameter, why allow the last arg to be the options?
								opts = args.pop() as SpawnOptionsWithoutStdio;  //  TODO: this should go to options, opts should be derived from options  //  TODO: type for options
							}
						}
					} else {
						if( "undefined" !== typeof options.env ) { opts.env = options.env; }  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment  --  not actually unsafe when reciever is not undefined  //  TODO: type for options
						if( "undefined" !== typeof options.cwd ) { opts.cwd = options.cwd; }  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment  --  not actually unsafe when reciever is not undefined  //  TODO: type for options
						if( "undefined" !== typeof options.input ) { input = options.input; }  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment  --  not actually unsafe when reciever is not undefined  //  TODO: type for options
					}
					if( "undefined" === typeof args || 0 === args.length ) {  //  eslint-disable-line @typescript-eslint/tslint/config  --  being cautious and testing for conditions that shouldn't happen
						if( /\s/.test( command ) ) {
							opts.shell = true;  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment  --  not actually unsafe when reciever is not undefined  //  TODO: type for options
						}
					}
					// TODO: options.timeout
					// console.log( fn+": command = ", command );
					// console.log( fn+": args = ", args );
					// console.log( fn+": opts = ", opts );

					let out = "";
					let err = "";
					const log: BacktickOutputEntry[] = [];

					const start: number = Helpers.unixTime();
					const cmd = spawnProcess( command, args, opts );
					cmd.stdout.on( "data", (data) => { const data_string = "string" === typeof data ? data : String(data); out += data_string; log.push( { time: Helpers.unixTime(), fd: "OUT", data: data_string } ); } );
					cmd.stderr.on( "data", (data) => { const data_string = "string" === typeof data ? data : String(data); err += data_string; log.push( { time: Helpers.unixTime(), fd: "ERR", data: data_string } ); } );
					cmd.on( "close", (code:number) => {
						const stop = Helpers.unixTime();
						log.push( { time: stop, fd: "EXIT", data: `${code}` } );
						resolve( {
							code: code,
							command: [command].concat( "undefined" !== typeof args ? args : [] ).join(" "),  //  eslint-disable-line @typescript-eslint/tslint/config  --  being cautious and testing for conditions that shouldn't happen
							err: err,
							errors: err.length > 0 || code !== 0,
							input: input,
							out: out,
							start: start,
							stop: stop,
						} );
					} );
					if( input.length > 0 ) { cmd.stdin.write( input ); }
					cmd.stdin.end();
				} catch(e) { reject( this.errorChain( e, fn ) ); }
			})().catch( async (e) => Promise.reject( this.errorChain(e,fn) ) );  //  eslint-disable-line @typescript-eslint/dot-notation  --  TODO: @typescript-eslint/dot-notation option to allow keywords when appropriate, ideally detecting when the type defines the property
		} );
	}
	/** Create a lock file both the proper way and containing our PID, starttime, and hostname */
	public static async PIDlock( filename: string, compromised?: (err:Error)=>boolean ): Promise<()=>Promise<void>> { const fn = "Helpers.PIDlock"; try {  //  eslint-disable-line @typescript-eslint/naming-convention,brace-style  --  keep "PID" all caps; TODO: brace-style option to allow try/catch on start & end lines
		const release: ()=>Promise<void> = async ():Promise<void> => {
			debug( `${fn}/release: releasing ${filename}` );
			await removeFile( filename );
			await releaseDir();
			debug( `${fn}/release: released ${filename}` );
		};
		const onCompromised: (err:Error)=>void = (err):void => {
			// TODO: default recovery attempts
			if( compromised ) {
				const recovered: boolean = compromised(err);
				if( !recovered ) { release(); }  //  eslint-disable-line @typescript-eslint/no-floating-promises  --  TODO: check how properLock handles onCompromised, confirm that release result is not lost
			} else {
				throw this.errorChain( err, `${fn}/compromised` );
			}
		};
		const pid: number = process.pid;
		const getStart = await this.backtick( `ps -p ${pid} -o lstart=` ); // TODO: command is OS dependent
		const start: number = this.unixTime( getStart.out );
		const content: string = this.JSONify( {
			HOST:  hostname(),  //  eslint-disable-line @typescript-eslint/naming-convention  --  using a different convention for file format
			PID:   pid,         //  eslint-disable-line @typescript-eslint/naming-convention  --  using a different convention for file format
			START: start,       //  eslint-disable-line @typescript-eslint/naming-convention  --  using a different convention for file format
			startStr: this.humanTime( start ),
		} );
		const releaseDir: ReleaseFn = await properLock( filename, { realpath: false, onCompromised: onCompromised } );
		await writeFile( filename, content, "utf8" );
		return release;
	} catch(e) { throw this.errorChain( e, fn ); } }  //  eslint-disable-line brace-style  --  TODO: brace-style option to allow try/catch on start & end lines
	/** Check weather a lock created by {@link PIDlock} is still valid */
	public static async PIDcheck( filename: string ): Promise<PIDcheckInfo|undefined> {  //  eslint-disable-line @typescript-eslint/naming-convention  --  keep "PID" all caps
		const fn = "Helpers.PIDcheck";
		// console.log( "Checking PIDfile "+filename );
		try {
			// console.log( "Checking PIDfile "+filename );
			// let info = JSON.parse( await fse.readFile( filename, { encoding: "utf8" } ) );
			const raw = await readFile( filename, { encoding: "utf8" } );
			// console.log( "PIDfile "+filename+" contains ", raw );
			const info = JSON.parse( raw );  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment  --  TODO: types for PID*
			// console.log( "PIDfile "+filename+" contains ", info );
			const getStart = await this.backtick( `ps -p ${info.PID} -o lstart=` );  //  eslint-disable-line @typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-member-access  --  TODO: types for PID*
			if( !getStart.errors ) {
				const start = this.unixTime( getStart.out );
				if( info.START !== start ) {  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  TODO: types for PID*
					// console.log( "PID "+info.PID+" start time mismatch with ", this.humanTime(start) );
					return undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that the specified file does not represent a current lock
				}
				// console.log( "PID "+info.PID+" start time match with ", this.humanTime(start) );
				return info;  //  eslint-disable-line @typescript-eslint/no-unsafe-return  --  TODO: types for PID*
			} else if( 1 === getStart.code ) {
				return undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that the specified file does not represent a current lock
			} else {
				throw new Error( `${fn} >> Error checking start time of ${filename}\nCONTENTS:\n${raw}\nBACKTICK\n${this.JSONify(getStart)}` );
			}
		} catch(e) {
			if( e instanceof Object && "code" in e && "ENOENT" === e.code ) {
				return undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that the specified file does not represent a current lock
			} else {
				throw this.errorChain(e,fn);
			}
		}
	}
	/** End the process that owns a lock created by {@link PIDlock} */
	public static async PIDkill( filename:string, timeout=10 ) {  //  eslint-disable-line @typescript-eslint/naming-convention,@typescript-eslint/no-magic-numbers  --  keep "PID" all caps; magic number is ok for default value
		const fn = "Helpers.PIDkill";
		try {
			let info = await this.PIDcheck( filename );
			// console.log( "PIDfile "+filename+" contains ", info );
			if( info ) {
				// console.log( "PIDfile "+filename+" running as "+info.PID+" since "+info.startStr );
				process.kill( info.PID, "SIGTERM" );
				if( !await this.poll( timeout, 1, async () => !(info = await this.PIDcheck(filename)) ) ) {
					debug( `PIDfile ${filename} still running as ${info.PID} after SIGTERM, sending SIGKILL` );
					while( info ) {
						process.kill( info.PID, "SIGKILL" );
						info = await this.PIDcheck(filename);
						debug( "after SIGKILL: ", info );
						try { await removeFile( filename ); }  //  eslint-disable-line brace-style  --  TODO: brace-style option to allow this style, maybe according to line length or block complexity
						catch(e) { console.log( `${fn}: Error removing PID file after SIGKILL -- ${e}` ); }  //  eslint-disable-line no-console,@typescript-eslint/restrict-template-expressions  --  TODO: callback for error logging; TODO: helper for error standardization
						try { await removeDir( `${filename}.lock` ); }  //  eslint-disable-line brace-style  --  TODO: brace-style option to allow this style, maybe according to line length or block complexity
						catch(e) { console.log( `${fn}: Error removing PID lock after SIGKILL -- ${e}` ); }  //  eslint-disable-line no-console,@typescript-eslint/restrict-template-expressions  --  TODO: callback for error logging; TODO: helper for error standardization
					}
				// } else {
				// 	console.log( "PIDfile "+filename+" removed after SIGTERM" );
				}
			}
		} catch(e) {
			throw this.errorChain( e, fn );
		}
	}
	/** Turn a function that takes a callback into a function that returns a Promise */
	public static async asyncify<T,E=any>( oldf:(...args:any[])=>void, ...args: any[] ): Promise<T> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
		const fn = "Helpers.asyncify";
		return new Promise<T>( (resolve,reject): void => {
			let check = false;
			const callback = ( err:E, res:T ) => {
				check = true;
				if( "undefined" !== typeof err) { reject(err); } else { resolve(res); }
			};
			args.push(callback);
			try {
				oldf( args );
				if( !check ) { console.warn( `${fn}: function returned before callback invoked; either it started something asynchronous, or this chain is doomed` ); }  //  eslint-disable-line no-console  --  TODO: what's the right way to do this?
			} catch( e ) { reject(e); return; }
		} );
	}
	/** Each call returns the next entry in the given cycle; defaults to English capital letters */
	public static cycler<T=string>( ...args:(T|T[])[] ): ()=>T {
		const list: T[] = args.length > 0
			? 1 === args.length && args[0] instanceof Array
				? args[0]
				: args as T[]
			: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"] as T[];
		let i = list.length-1;
		if( i <= 0 ) { throw new Error( "Helpers.cycler: cycle must contain at least one entry" ); }
		return () => { i = i >= list.length-1 ? 0 : i+1; return list[i]; };
	}
	/** Tests whether a given value is Thenable */
	public static isThenable( p: any ): p is Thenable<any> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		return ("undefined" !== typeof p) && ( "object" === typeof p || "function" === typeof p) && "function" === typeof p.then;  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access  --  any because this is a type discriminator
	}
	/** Tests whether a given value is "PromiseLike" in that it's Thenable */
	public static isPromiseLike( p: any ): p is PromiseLike<any> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		return this.isThenable( p );
	}
	/** Returns the then method, if and only if p is thenable */
	public static thenIfThenable<T=any>( p: any ): AbortableThen<T> | undefined {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		if( ("undefined" !== typeof p) && ( "object" === typeof p || "function" === typeof p) ) {
			const then: AbortableThen<T> | undefined = p.then;  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access  --  any because this is a type discriminator  //  p.then must be copied to pass promise test with thenable that can only be then'd once
			return "function" === typeof then ? then.bind( p ) : undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that p is not thenable
		} else {
			return undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that p is not thenable
		}
	}
	/** Returns the catch method, if and only if p is catchable */
	public static catchIfCatchable( p: any ): typeof Promise.prototype.catch | undefined {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		if( ("undefined" !== typeof p) && ( "object" === typeof p || "function" === typeof p) ) {
			const _catch: typeof Promise.prototype.catch | undefined = p.catch;  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/dot-notation  --  any because this is a type discriminator; dot-keyword because that's the spec
			return "function" === typeof _catch ? _catch.bind( p ) : undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that p is not catchable
		} else {
			return undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that p is not catchable
		}
	}
	/** Returns the aborted method, if and only if p is abortedable */
	public static abortedIfAbortedable<T=any>( p: any ): AbortableAborted<T> | undefined {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		if( ("undefined" !== typeof p) && ( "object" === typeof p || "function" === typeof p) ) {
			const aborted: AbortableAborted<T> | undefined = p.aborted;  //  eslint-disable-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access  --  any because this is a type discriminator
			return "function" === typeof aborted ? aborted.bind( p ) : undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that p is not abortedable
		} else {
			return undefined;  //  eslint-disable-line no-undefined  --  undefined indicates that p is not abortedable
		}
	}
	/** Tests whether a given value looks like it will quack like a Promise */
	public static isPromise( p: any ): p is Promise<any> {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		return this.isThenable(p) && "function" === typeof (p as any).catch;  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any,@typescript-eslint/dot-notation  --  any because this is a type discriminator; dot-keyword because that's the spec
	}
	/** try-catch with else before finally */
	public static tryCatchElseFinally<T=any>( tryBlk: ()=>T, catchBlk: (e:unknown)=>T, elseBlk?: (try_result:T)=>T, finallyBlk?: (result:T|undefined,error:unknown)=>void ): [T|undefined,unknown] {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  default to any so it works by default
		let result: T | undefined;
		let error: unknown;
		try {
			let success = false;
			try { result = tryBlk(); success = true; }  //  eslint-disable-line brace-style  --  TODO: brace-style option to allow this style, maybe according to line length or block complexity
			catch(e) { error = e; result = catchBlk(e); }
			if(success && elseBlk) { result = elseBlk(result); }
		} finally {
			if( finallyBlk ) { finallyBlk( result, error ); }
		}
		return [ result, error ];
	}
	/**
	 * Enable original source locations in Node stack traces involving code compiled to javascript;
	 * requires presence of module [`source-map-support`](https://www.npmjs.com/package/source-map-support)
	 */
	public static enableSourceMaps() {
		try {
			require("source-map-support").install();  //  eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,import/no-extraneous-dependencies,@typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires  --  ignore safeguards for debugging helper
			return true;
		} catch(unused_e) {
			return false;
		}
	}
	/** Tries to identify the type of x */
	public static whatIs( x: any ): string {  //  eslint-disable-line @typescript-eslint/no-explicit-any  --  any because this is a type discriminator
		let r: string = typeof x;
		if( "object" === typeof x ) {
			if( null === x ) {  //  eslint-disable-line no-null/no-null  --  trying to detect null
				r = "null";
			} else {
				// TODO: detect more things
			}
		}
		return r;
	}
	/** Convert any object into a (possibly meaningless) string */
	public static stringify( x: unknown ):string {
		if( "object" !== typeof x ) { return `${x}`; }  //  eslint-disable-line @typescript-eslint/restrict-template-expressions  --  primitives are safe to stringify
		if( null === x ) { return "null"; }  //  eslint-disable-line no-null/no-null  --  string representation of null
		if( "function" === typeof x.toString ) { return x.toString(); }  //  eslint-disable-line @typescript-eslint/tslint/config  --  not all objects define their own string representation  //  TODO: check that toString returns a string?
		return this.JSONify( x );
	}
}

export interface IAsyncNew {
	/** Resolves when asynchronous portion of constructor completes */
	asyncConstructor: Promise<void>;
	// static async new(...args:any[]): Promise<typeof this> { let r = new this(...args); await r.asyncConstructor; return r}
}

export type BacktickResult = {
	/** unixtime of command start */
	start: number;
	/** command or command and parameters */
	command: string | string[];
	/** input given on stdin after command is started */
	input: string;
	/** output command wrote to stdout */
	out: string;
	/** output command wrote to stderr */
	err: string;
	/** exit code */
	code: number;
	/** unixtime of command exit */
	stop: number;
	/** true if stdout was written to or code is nonzero */
	errors: boolean;
};

type BacktickOutputEntry = { time: number; fd: "OUT"|"ERR"|"EXIT"; data: string };
type PIDcheckInfo        = { HOST: string; PID: number; START: number; startStr: string };  //  eslint-disable-line @typescript-eslint/naming-convention  --  using a different convention for file format
