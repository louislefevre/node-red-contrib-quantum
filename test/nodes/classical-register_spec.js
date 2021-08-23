const util = require('util');
const testUtil = require('../test-util');
const classicalRegisterNode = require('../../quantum/nodes/classical-register/classical-register.js');
const {FlowBuilder} = require('../flow-builder');
const nodeTestHelper = testUtil.nodeTestHelper;
const snippets = require('../../quantum/snippets.js');

const flow = new FlowBuilder();

describe('ClassicalRegisterNode', function() {
  beforeEach(function(done) {
    nodeTestHelper.startServer(done);
  });

  afterEach(function(done) {
    flow.reset();
    nodeTestHelper.unload();
    nodeTestHelper.stopServer(done);
  });

  it('load node', function(done) {
    testUtil.isLoaded(classicalRegisterNode, 'classical-register', done);
  });

  it('execute command', function(done) {
    let command = util.format(snippets.CLASSICAL_REGISTER, '_test', '3, "test"');
    flow.add('quantum-circuit', 'n0', [['n1'], ['n2']],
        {structure: 'registers', outputs: '2', qbitsreg: '1', cbitsreg: '1'});
    flow.add('quantum-register', 'n1', [['n3']], {outputs: '1'});
    flow.add('classical-register', 'n2', [], {classicalBits: '3', name: 'test'});
    flow.addOutput('n3');

    testUtil.commandExecuted(flow, command, done);
  });
});
