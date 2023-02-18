/*  eslint-disable import/no-extraneous-dependencies,import/order  --  this is a test spec; TODO: import/order option to sort by imported name rather than import source name  */

import { describe } from "mocha";

import * as promisesAPlusTests from "promises-aplus-tests-refreshed";

import { install } from "source-map-support";
install();

import * as promisesFinallyTests from "../testlib/promises-finally-tests";

import { Asyncable } from "../lib/Asyncable/Asyncable";

describe( "Asyncable", () => {
	promisesAPlusTests.mocha( Asyncable );
	promisesFinallyTests.mocha( Asyncable );
} );
