/*  eslint-disable import/no-extraneous-dependencies,@typescript-eslint/require-await,import/order,@typescript-eslint/no-magic-numbers  --  this is a test spec; awaits are handled by test framework; TODO: import/order option to sort by imported name rather than import source name; magic numbers are ok for tests  */

import { describe } from "mocha";
import { expect } from "chai";

import { install } from "source-map-support";
install();

import { Helpers } from "../lib/Helpers";

describe( "Helpers", () => {
	describe( "Helpers.arrayInsertArray", () => {
		it( "should make the destination array longer", async ():Promise<void> => {
			const al = ["a","b"];
			const nu = [1,2];  //  eslint:disable-line:no-magic-numbers // testcase
			Helpers.arrayInsertArray<string|number>( al, nu, 1 );
			expect( al.length ).to.equal( 4 );
		} );
	} );
} );
