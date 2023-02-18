/*  eslint-disable import/no-extraneous-dependencies,@typescript-eslint/require-await,import/order  --  this is a test spec; awaits are handled by test framework; TODO: import/order option to sort by imported name rather than import source name  */

import { describe } from "mocha";
import { expect } from "chai";

import { install } from "source-map-support";
install();

// import * as promisesAPlusTests from "promises-aplus-tests-refreshed";  //  TODO: this doesn't pass; fix based on Asyncable

import { Abortable } from "../lib/Abortable";

describe( "Abortable", () => {
	describe( "Abortable.aborted", () => {
		it( "should return an aborted instance", async ():Promise<void> => {
			expect( Abortable.aborted("test").state ).to.equal( "aborted" );
		} );
	} );
	// promisesAPlusTests.mocha( Abortable );  // The Promises/A+ Compliance Test Suite
} );
