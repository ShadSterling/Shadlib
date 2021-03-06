import { describe, /*it*/ } from "mocha"; // tslint:disable-line:no-implicit-dependencies
import { expect } from "chai"; // tslint:disable-line:no-implicit-dependencies ordered-imports

import { install } from "source-map-support"; // tslint:disable-line:no-implicit-dependencies // it's a dev dependency; testing is part of dev
install();

// import * as promisesAPlusTests from "promises-aplus-tests"; // tslint:disable-line:no-implicit-dependencies // it's a dev dependency; testing is part of dev

import { Abortable } from "../lib/Abortable";

describe( "Abortable", () => {
	describe( "Abortable.aborted", () => {
		it( "should return an aborted instance", async ():Promise<void> => {
			expect( Abortable.aborted("test").state ).to.equal( "aborted" );
		} );
	} );
	// promisesAPlusTests.mocha( Abortable );  // The Promises/A+ Compliance Test Suite
} );
